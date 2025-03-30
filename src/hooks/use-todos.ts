
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export interface TodoResponse {
  success: boolean;
  message: string;
  todoId?: string;
  error?: any;
}

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<TodoResponse | null>(null);
  const { user } = useAuth();

  // Fetch todos from Supabase
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setTodos([]);
        return;
      }
      
      console.log('Fetching todos for user:', user.id);
      
      // Query the todo_items table and explicitly filter by user_id
      const { data, error } = await supabase
        .from('todo_items')
        .select('id, title, completed, created_at, completed_at, event_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('Fetched todos:', data);
      
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
      // Use the actual error message instead of a generic one
      setError(err.message || err.error_description || String(err));
      // Still set the todos to an empty array so the UI doesn't break
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a new todo to Supabase
  const addTodo = async (title: string) => {
    try {
      if (!user || !title.trim()) {
        const response = {
          success: false,
          message: !user ? 'User not authenticated' : 'Title cannot be empty',
        };
        setLastResponse(response);
        return response;
      }
      
      console.log('Adding new todo:', title);
      
      // Create a todo item with user_id explicitly set
      // Note: Removed id field to let Supabase generate it
      const newTodo = {
        title: title.trim(),
        completed: false,
        order_position: 0,
        user_id: user.id // Explicitly set the user_id to the current user
      };
      
      console.log('Inserting todo with data:', newTodo);
      
      const { data, error } = await supabase
        .from('todo_items')
        .insert(newTodo)
        .select();
      
      if (error) {
        console.error('Error details:', error);
        const response = {
          success: false,
          message: `Failed to add todo: ${error.message}`,
          error
        };
        setLastResponse(response);
        return response;
      }
      
      console.log('Todo successfully added with response:', data);
      
      // Only optimistically update the UI if the database operation succeeded
      // Use the ID returned from Supabase for the new todo item
      if (data && data.length > 0) {
        setTodos(prevTodos => [{
          id: data[0].id,
          title: title.trim(),
          completed: false,
          created_at: new Date().toISOString(),
          isCalendarEvent: false
        }, ...prevTodos]);
        
        const response = {
          success: true,
          message: 'Todo added successfully',
          todoId: data[0].id,
          data
        };
        setLastResponse(response);
        return response;
      }
      
      const response = {
        success: true,
        message: 'Todo added but ID not returned',
        data
      };
      setLastResponse(response);
      return response;
    } catch (err: any) {
      console.error('Error adding todo:', err);
      const response = {
        success: false,
        message: `Error adding todo: ${err.message || String(err)}`,
        error: err
      };
      setLastResponse(response);
      return response;
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
        .eq('id', id)
        .eq('user_id', user.id); // Add user_id filter for extra security
      
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
        .eq('id', id)
        .eq('user_id', user.id); // Add user_id filter for extra security
      
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
        .eq('id', todoId)
        .eq('user_id', user.id); // Add user_id filter for extra security
      
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
      console.log('User is authenticated, fetching todos');
      fetchTodos();
    } else {
      console.log('No user, clearing todos');
      setTodos([]);
      setLoading(false);
    }
    
    // Set up real-time subscription for todos
    const todosSubscription = supabase
      .channel('todos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'todo_items', filter: `user_id=eq.${user?.id}` }, 
        (payload) => {
          console.log('Realtime update received:', payload);
          // Only refetch when the user is authenticated
          if (user) {
            fetchTodos();
          }
        }
      )
      .subscribe();
      
    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(todosSubscription);
    };
  }, [user, fetchTodos]);

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    deleteTodo,
    linkTodoToEvent,
    refetchTodos: fetchTodos,
    lastResponse
  };
}
