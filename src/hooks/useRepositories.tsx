import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useRepositories() {
  const { user, profile, sessionFullyRestored } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchRepositories = useCallback(async (searchQuery) => {
    if (!user || !profile) {
      console.log('No user or profile available, skipping fetch');
      setRepositories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching repositories for user:', user.id);
      
      // Get the current session to ensure we have a valid token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData || !sessionData.session) {
        throw new Error('No valid session found');
      }
      
      console.log('Session found, access token available:', !!sessionData.session.access_token);
      
      // Explicitly log the function call
      console.log('Invoking edge function: fetch-github-repos');
      
      const { data, error: funcError } = await supabase.functions.invoke('fetch-github-repos', {
        body: { searchQuery }
      });

      if (funcError) {
        console.error('Function error:', funcError);
        throw funcError;
      }

      console.log('Repositories fetched:', data?.repositories ? data.repositories.length : 0);
      setRepositories(data?.repositories || []);
    } catch (err) {
      console.error('Error fetching repositories:', err);
      const errorMessage = 'Failed to fetch repositories from GitHub';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  // Initial fetch when component mounts and user/profile are available
  useEffect(() => {
    if (user && profile && sessionFullyRestored) {
      console.log('User, profile, and session fully available, fetching repositories');
      fetchRepositories();
    }
  }, [user, profile, sessionFullyRestored, fetchRepositories]);

  // Add a dedicated refresh function that forces a new session check
  const forceRefreshRepositories = useCallback(async () => {
    if (!user) {
      console.log('No user available, cannot refresh');
      return;
    }
    
    console.log('Force refreshing repositories with fresh session check');
    
    try {
      // Force refresh the session first
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        toast({
          title: "Session Error",
          description: "Failed to refresh your session. Please try signing in again.",
          variant: "destructive",
        });
        return;
      }
      
      if (refreshData && refreshData.session) {
        console.log('Session refreshed successfully');
        // Now fetch repositories with the fresh session
        fetchRepositories();
      } else {
        console.error('No session after refresh');
        toast({
          title: "Authentication Error",
          description: "Your session could not be restored. Please sign in again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error in force refresh:', err);
    }
  }, [user, fetchRepositories, toast]);

  // Modified effect to handle page refresh
  useEffect(() => {
    // This will run once when the component mounts
    const handlePageRefresh = () => {
      // Check if we're coming from a page refresh (not initial load)
      const isPageRefresh = sessionStorage.getItem('app_initialized');
      
      if (isPageRefresh && user && profile && sessionFullyRestored) {
        console.log('Page was refreshed, session fully restored, forcing repository fetch with token refresh');
        forceRefreshRepositories();
      }
      
      // Mark that the app has been initialized
      sessionStorage.setItem('app_initialized', 'true');
    };
    
    handlePageRefresh();
  }, [user, profile, sessionFullyRestored, forceRefreshRepositories]);

  return {
    repositories,
    loading,
    error,
    fetchRepositories,
    refetch: forceRefreshRepositories
  };
}
