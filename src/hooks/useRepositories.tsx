import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export function useRepositories() {
  const { user, profile } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRepositories = async (searchQuery?: string) => {
    if (!user || !profile) {
      setRepositories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('fetch-github-repos', {
        body: { searchQuery }
      });

      if (funcError) throw funcError;

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
  };

  useEffect(() => {
    // Only fetch repositories when auth is not in loading state and both user and profile exist
    const { loading: authLoading } = useAuth();
    if (!authLoading && user && profile) {
      fetchRepositories();
    }
  }, [user, profile, useAuth().loading]);

  return {
    repositories,
    loading,
    error,
    fetchRepositories,
    refetch: () => fetchRepositories()
  };
}
