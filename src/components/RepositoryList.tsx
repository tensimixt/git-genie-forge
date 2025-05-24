import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, GitFork, Calendar, ExternalLink, MessageSquare, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from '@/integrations/supabase/client';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
}

interface RepositoryListProps {
  user: any;
  searchTerm: string;
  onRepositorySelect: (repo: Repository) => void;
}

export const RepositoryList = ({ user, searchTerm, onRepositorySelect }: RepositoryListProps) => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const fetchRepositories = async () => {
    if (!user) {
      setRepositories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Attempting to fetch repositories...');
      
      // Get current session and verify it exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found. Please login again.');
      }

      console.log('Session found, calling edge function...');
      
      const { data, error: funcError } = await supabase.functions.invoke('fetch-github-repos', {
        body: { searchQuery: searchTerm || '' },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('Edge function response:', { data, funcError });

      if (funcError) {
        console.error('Function error details:', funcError);
        throw new Error(`Failed to fetch repositories: ${funcError.message}`);
      }

      if (data && data.repositories) {
        console.log('Repositories fetched successfully:', data.repositories.length);
        setRepositories(data.repositories);
      } else {
        console.warn('No repositories data returned:', data);
        setRepositories([]);
      }
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories from GitHub');
    } finally {
      setLoading(false);
    }
  };

  // Wait for initial auth state to be determined
  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial auth check:', !!session);
        setIsAuthenticating(false);
        
        // If we have a user and session, fetch repositories
        if (user && session) {
          fetchRepositories();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking initial auth:', error);
        setIsAuthenticating(false);
        setLoading(false);
      }
    };

    checkInitialAuth();
  }, [user]); // Only depend on user changes

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session && user) {
          // Wait a bit for everything to settle
          setTimeout(() => {
            fetchRepositories();
          }, 500);
        } else if (event === 'SIGNED_OUT') {
          setRepositories([]);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [user, searchTerm]);

  // Handle search term changes (only if we already have a user and are not loading)
  useEffect(() => {
    if (user && !isAuthenticating && !loading && searchTerm !== undefined) {
      const debounceTimer = setTimeout(() => {
        fetchRepositories();
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm]);

  // Manual retry mechanism
  useEffect(() => {
    if (retryCount > 0 && user && !isAuthenticating) {
      fetchRepositories();
    }
  }, [retryCount]);

  // Filter repositories based on search term
  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      TypeScript: 'bg-blue-500',
      JavaScript: 'bg-yellow-500',
      Python: 'bg-green-500',
      Java: 'bg-red-500',
      'C++': 'bg-purple-500',
      Go: 'bg-cyan-500',
    };
    return colors[language] || 'bg-gray-500';
  };

  // Show loading while authenticating or fetching
  if (isAuthenticating || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-48">
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-2/3 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">{error}</p>
        <Button 
          onClick={() => setRetryCount(prev => prev + 1)}
          className="mt-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
        {error.includes('session') && (
          <p className="text-sm text-gray-600 mt-2">
            You may need to sign in with GitHub again
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredRepositories.map((repo) => (
        <Card key={repo.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                  {repo.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  {repo.description || "No description available"}
                </CardDescription>
              </div>
              {repo.private && (
                <Badge variant="secondary" className="text-xs">
                  Private
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-4">
                {repo.language && (
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)} mr-1`} />
                    <span>{repo.language}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  {repo.stargazers_count}
                </div>
                <div className="flex items-center">
                  <GitFork className="w-4 h-4 mr-1" />
                  {repo.forks_count}
                </div>
              </div>
            </div>
            
            <div className="flex items-center text-xs text-gray-400 mb-4">
              <Calendar className="w-3 h-3 mr-1" />
              Updated {formatDate(repo.updated_at)}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => onRepositorySelect(repo)}
                className="flex-1"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with AI
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(repo.html_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {filteredRepositories.length === 0 && !loading && (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-500 text-lg">No repositories found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm ? 'Try adjusting your search terms' : 'Connect to GitHub to see your repositories'}
          </p>
          <Button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Repositories
          </Button>
        </div>
      )}
    </div>
  );
};
