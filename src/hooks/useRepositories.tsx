import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useRepositories() {
  const { user, profile, loading: authLoading } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { toast } = useToast();

  const fetchRepositories = async (searchQuery) => {
    if (!user || !profile) {
      setRepositories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching repositories...');
      const { data, error: funcError } = await supabase.functions.invoke('fetch-github-repos', {
        body: { searchQuery }
      });

      if (funcError) throw funcError;

      console.log('Repositories fetched:', data.repositories ? data.repositories.length : 0);
      setRepositories(data.repositories || []);
      setHasFetched(true);
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
  };

  // Fetch repositories when user and profile are available
  useEffect(() => {
    if (user && profile && !hasFetched) {
      console.log('User and profile available, fetching repositories');
      fetchRepositories();
    }
  }, [user, profile, hasFetched]);

  // Reset hasFetched when user changes
  useEffect(() => {
    if (!user) {
      setHasFetched(false);
    }
  }, [user]);

  return {
    repositories,
    loading,
    error,
    fetchRepositories,
    refetch: () => fetchRepositories()
  };
}
