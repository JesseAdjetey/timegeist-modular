
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  created_at?: string;
  completed_at?: string;
  isCalendarEvent?: boolean;
  eventId?: string;
}

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch todos from Supabase
  const fetchTodos = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setTodos([]);
        return;
      }
      
      // Directly query just the todo_items table without any joins to avoid policy issues
      const { data, error } = await supabase
        .from('todo_items')
        .select('id, title, completed, created_at, completed_at, event_id')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      // Transform the data to match our TodoItem interface
      const transformedTodos = data.map(item => ({
        id: item.id,
        title: item.title,
        completed: item.completed,
        created_at: item.created_at,
        completed_at: item.completed_at,
        isCalendarEvent: item.event_id ? true : false,
        eventId: item.event_id
      }));
      
      setTodos(transformedTodos);
    } catch (err: any) {
      console.error('Error fetching todos:', err);
      setError('Failed to fetch todos');
      // Still set the todos to an empty array so the UI doesn't break
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new todo to Supabase
  const addTodo = async (title: string) => {
    try {
      if (!user || !title.trim()) return null;
      
      const newTodoId = nanoid();
      
      // Create a basic todo item with minimal fields
      const newTodo = {
        id: newTodoId,
        title: title.trim(),
        completed: false, 
        user_id: user.id // Add the user ID to ensure ownership
      };
      
      const { error } = await supabase
        .from('todo_items')
        .insert(newTodo);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      // Only optimistically update the UI if the database operation succeeded
      setTodos(prevTodos => [{
        id: newTodoId,
        title: title.trim(),
        completed: false,
        created_at: new Date().toISOString(),
        isCalendarEvent: false
      }, ...prevTodos]);
      
      return newTodoId;
    } catch (err: any) {
      console.error('Error adding todo:', err);
      toast.error('Failed to add todo');
      return null;
    }
  };

  // Toggle todo completion status
  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      if (!user) return;
      
      // Optimistically update the UI
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ));
      
      const { error } = await supabase
        .from('todo_items')
        .update({ completed: !completed })
        .eq('id', id);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
    } catch (err: any) {
      console.error('Error updating todo:', err);
      toast.error('Failed to update todo');
      
      // Revert the optimistic update
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed } : todo
      ));
    }
  };

  // Delete a todo
  const deleteTodo = async (id: string) => {
    try {
      if (!user) return;
      
      // Optimistically update the UI
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      
      const { error } = await supabase
        .from('todo_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
    } catch (err: any) {
      console.error('Error deleting todo:', err);
      toast.error('Failed to delete todo');
      
      // Refetch todos to restore the correct state
      fetchTodos();
    }
  };

  // Link a todo with a calendar event
  const linkTodoToEvent = async (todoId: string, eventId: string) => {
    try {
      if (!user) return;
      
      const { error } = await supabase
        .from('todo_items')
        .update({ event_id: eventId })
        .eq('id', todoId);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === todoId ? { ...todo, isCalendarEvent: true, eventId } : todo
      ));
    } catch (err: any) {
      console.error('Error linking todo to event:', err);
      toast.error('Failed to link todo to event');
    }
  };

  // Load todos when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchTodos();
    } else {
      setTodos([]);
      setLoading(false);
    }
    
    // Set up real-time subscription for todos
    const todosSubscription = supabase
      .channel('todos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'todo_items' }, 
        () => {
          // Only refetch when the user is authenticated
          if (user) {
            fetchTodos();
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(todosSubscription);
    };
  }, [user]);

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    deleteTodo,
    linkTodoToEvent,
    fetchTodos
  };
}
