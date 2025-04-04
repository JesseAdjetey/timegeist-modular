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

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setTodos([]);
        return;
      }
      
      console.log('Fetching todos for user:', user.id);
      
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
      setError(err.message || err.error_description || String(err));
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      
      const newTodo = {
        title: title.trim(),
        completed: false,
        order_position: 0,
        user_id: user.id
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

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      if (!user) return;
      
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ));
      
      const { error } = await supabase
        .from('todo_items')
        .update({ completed: !completed })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
    } catch (err: any) {
      console.error('Error updating todo:', err);
      toast.error('Failed to update todo');
      
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed } : todo
      ));
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      if (!user) return;
      
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      
      const { error } = await supabase
        .from('todo_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error details:', error);
        throw error;
      }
    } catch (err: any) {
      console.error('Error deleting todo:', err);
      toast.error('Failed to delete todo');
      
      fetchTodos();
    }
  };

  const linkTodoToEvent = async (todoId: string, eventId: string) => {
    try {
      if (!user) return { success: false, message: 'User not authenticated' };
      
      const { error } = await supabase
        .from('todo_items')
        .update({ event_id: eventId })
        .eq('id', todoId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error details:', error);
        return { success: false, message: error.message };
      }
      
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === todoId ? { ...todo, isCalendarEvent: true, eventId } : todo
      ));
      
      return { success: true, message: 'Todo linked to event successfully' };
    } catch (err: any) {
      console.error('Error linking todo to event:', err);
      return { success: false, message: err.message || 'Failed to link todo to event' };
    }
  };

  const updateTodoTitle = async (id: string, newTitle: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user || !newTitle.trim()) {
        return { success: false, message: !user ? 'User not authenticated' : 'Title cannot be empty' };
      }
      
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === id ? { ...todo, title: newTitle.trim() } : todo
      ));
      
      const { error } = await supabase
        .from('todo_items')
        .update({ title: newTitle.trim() })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error updating todo title:', error);
        return { success: false, message: error.message };
      }
      
      return { success: true, message: 'Todo title updated successfully' };
    } catch (err: any) {
      console.error('Error updating todo title:', err);
      
      fetchTodos();
      
      return { success: false, message: err.message || 'Failed to update todo title' };
    }
  };

  const unlinkTodoFromEvent = async (todoId: string) => {
    try {
      if (!user) return { success: false, message: 'User not authenticated' };
      
      const { error } = await supabase
        .from('todo_items')
        .update({ event_id: null })
        .eq('id', todoId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error unlinking todo from event:', error);
        return { success: false, message: error.message };
      }
      
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === todoId ? { ...todo, isCalendarEvent: false, eventId: undefined } : todo
      ));
      
      return { success: true, message: 'Todo unlinked from event successfully' };
    } catch (err: any) {
      console.error('Error unlinking todo from event:', err);
      return { success: false, message: err.message || 'Failed to unlink todo from event' };
    }
  };

  const getTodoById = (id: string): TodoItem | undefined => {
    return todos.find(todo => todo.id === id);
  };

  useEffect(() => {
    if (user) {
      console.log('User is authenticated, fetching todos');
      fetchTodos();
    } else {
      console.log('No user, clearing todos');
      setTodos([]);
      setLoading(false);
    }
    
    const todosSubscription = supabase
      .channel('todos-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'todo_items', filter: `user_id=eq.${user?.id}` }, 
        (payload) => {
          console.log('Realtime update received:', payload);
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
    unlinkTodoFromEvent,
    updateTodoTitle,
    getTodoById,
    refetchTodos: fetchTodos,
    lastResponse
  };
}
