import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useRepositories() {
  const { user, profile, sessionFullyRestored } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const { toast } = useToast();

  // Helper to add debug logs
  const addDebugLog = (message) => {
    console.log(message);
    setDebugLogs(prev => [...prev, { time: new Date().toISOString(), message }]);
  };

  const fetchRepositories = useCallback(async (searchQuery) => {
    if (!user || !profile) {
      addDebugLog('No user or profile available, skipping fetch');
      setRepositories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      addDebugLog(`Fetching repositories for user: ${user.id}`);
      
      // Get the current session to ensure we have a valid token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData || !sessionData.session) {
        addDebugLog('No valid session found');
        throw new Error('No valid session found');
      }
      
      addDebugLog(`Session found, access token available: ${!!sessionData.session.access_token}`);
      addDebugLog(`Provider token available: ${!!sessionData.session.provider_token}`);
      
      // Explicitly log the function call
      addDebugLog('Invoking edge function: fetch-github-repos');
      
      try {
        // Ensure we're passing the Authorization header with the current access token
        const { data, error: funcError } = await supabase.functions.invoke('fetch-github-repos', {
          body: { searchQuery },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`
          }
        });

        if (funcError) {
          addDebugLog(`Function error: ${JSON.stringify(funcError)}`);
          throw funcError;
        }

        if (!data || !data.repositories) {
          addDebugLog(`No repositories data returned: ${JSON.stringify(data)}`);
          throw new Error('No repository data returned from GitHub');
        }

        addDebugLog(`Repositories fetched: ${data.repositories.length}`);
        setRepositories(data.repositories);
      } catch (funcErr) {
        addDebugLog(`Error calling function: ${funcErr.message}`);
        
        // Try a direct fetch as a fallback
        addDebugLog('Attempting direct fetch to GitHub API');
        
        // Only try this if we have a provider token (GitHub token)
        if (!sessionData.session.provider_token) {
          addDebugLog('No GitHub token available for direct fetch');
          throw new Error('GitHub token not available');
        }
        
        // Directly fetch from GitHub API
        const githubUrl = searchQuery 
          ? `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=30`
          : 'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator';
        
        addDebugLog(`Fetching from GitHub API: ${githubUrl}`);
        
        const response = await fetch(githubUrl, {
          headers: {
            'Authorization': `token ${sessionData.session.provider_token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Git-Genie-App'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          addDebugLog(`GitHub API error: ${response.status} - ${errorText}`);
          throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const githubData = await response.json();
        const repositories = searchQuery ? githubData.items : githubData;
        
        addDebugLog(`Direct GitHub fetch successful: ${repositories.length} repositories`);
        setRepositories(repositories || []);
      }
    } catch (err) {
      addDebugLog(`Error fetching repositories: ${err.message}`);
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
      addDebugLog('User, profile, and session fully available, fetching repositories');
      fetchRepositories();
    }
  }, [user, profile, sessionFullyRestored, fetchRepositories]);

  // Add a dedicated refresh function that forces a new session check
  const forceRefreshRepositories = useCallback(async () => {
    if (!user) {
      addDebugLog('No user available, cannot refresh');
      return;
    }
    
    addDebugLog('Force refreshing repositories with fresh session check');
    
    try {
      // Force refresh the session first
      addDebugLog('Attempting to refresh session');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        addDebugLog(`Error refreshing session: ${JSON.stringify(refreshError)}`);
        toast({
          title: "Session Error",
          description: "Failed to refresh your session. Please try signing in again.",
          variant: "destructive",
        });
        return;
      }
      
      if (refreshData && refreshData.session) {
        addDebugLog('Session refreshed successfully');
        addDebugLog(`Access token available: ${!!refreshData.session.access_token}`);
        addDebugLog(`Provider token available: ${!!refreshData.session.provider_token}`);
        
        // Now fetch repositories with the fresh session
        fetchRepositories();
      } else {
        addDebugLog('No session after refresh');
        toast({
          title: "Authentication Error",
          description: "Your session could not be restored. Please sign in again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      addDebugLog(`Error in force refresh: ${err.message}`);
    }
  }, [user, fetchRepositories, toast]);

  // Modified effect to handle page refresh
  useEffect(() => {
    // This will run once when the component mounts
    const handlePageRefresh = () => {
      // Check if we're coming from a page refresh (not initial load)
      const isPageRefresh = sessionStorage.getItem('app_initialized');
      
      if (isPageRefresh && user && profile && sessionFullyRestored) {
        addDebugLog('Page was refreshed, session fully restored, forcing repository fetch with token refresh');
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
    debugLogs,
    fetchRepositories,
    refetch: forceRefreshRepositories
  };
}
