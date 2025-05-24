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
      setRepositories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching repositories for user:', user.id);
      const { data, error: funcError } = await supabase.functions.invoke('fetch-github-repos', {
        body: { searchQuery }
      });

      if (funcError) throw funcError;

      console.log('Repositories fetched:', data.repositories ? data.repositories.length : 0);
      setRepositories(data.repositories || []);
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

  // Modified effect to handle page refresh
  useEffect(() => {
    // This will run once when the component mounts
    const handlePageRefresh = () => {
      // Check if we're coming from a page refresh (not initial load)
      const isPageRefresh = sessionStorage.getItem('app_initialized');
      
      if (isPageRefresh && user && profile && sessionFullyRestored) {
        console.log('Page was refreshed, session fully restored, fetching repositories');
        fetchRepositories();
      }
      
      // Mark that the app has been initialized
      sessionStorage.setItem('app_initialized', 'true');
    };
    
    handlePageRefresh();
    
    // Clean up
    return () => {
      // No cleanup needed
    };
  }, [user, profile, sessionFullyRestored, fetchRepositories]);

  return {
    repositories,
    loading,
    error,
    fetchRepositories,
    refetch: () => fetchRepositories()
  };
}
