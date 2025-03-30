
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
      
      const { data, error } = await supabase
        .from('todo_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
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
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  // Add a new todo to Supabase
  const addTodo = async (title: string) => {
    try {
      if (!user || !title.trim()) return;
      
      const newTodo = {
        id: nanoid(),
        title: title.trim(),
        completed: false,
        order_position: todos.length + 1
      };
      
      const { error } = await supabase
        .from('todo_items')
        .insert(newTodo);
      
      if (error) {
        throw error;
      }
      
      // Refetch todos to ensure we have the latest data
      fetchTodos();
      return newTodo.id;
    } catch (err) {
      console.error('Error adding todo:', err);
      toast.error('Failed to add todo');
      return null;
    }
  };

  // Toggle todo completion status
  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      if (!user) return;
      
      const { error } = await supabase
        .from('todo_items')
        .update({ completed })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed } : todo
      ));
    } catch (err) {
      console.error('Error updating todo:', err);
      toast.error('Failed to update todo');
    }
  };

  // Delete a todo
  const deleteTodo = async (id: string) => {
    try {
      if (!user) return;
      
      const { error } = await supabase
        .from('todo_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      toast.error('Failed to delete todo');
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
        throw error;
      }
      
      setTodos(todos.map(todo => 
        todo.id === todoId ? { ...todo, isCalendarEvent: true, eventId } : todo
      ));
    } catch (err) {
      console.error('Error linking todo to event:', err);
      toast.error('Failed to link todo to event');
    }
  };

  // Load todos when component mounts or user changes
  useEffect(() => {
    fetchTodos();
    
    // Set up real-time subscription for todos
    const todosSubscription = supabase
      .channel('todos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'todo_items' }, 
        () => {
          fetchTodos();
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
