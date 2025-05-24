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
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [authReady, setAuthReady] = useState(false);

  // Check if user is properly authenticated with GitHub token
  const checkAuthState = async () => {
    if (!user) {
      setAuthReady(false);
      return false;
    }

    try {
      // Get the current session to ensure we have a valid token
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('No valid session found');
        setAuthReady(false);
        return false;
      }

      // Check if we have the GitHub provider token
      const hasGithubToken = session.provider_token || 
                           session.user?.user_metadata?.provider_token ||
                           session.user?.app_metadata?.provider_token;

      if (!hasGithubToken) {
        console.log('No GitHub token found in session');
        setAuthReady(false);
        return false;
      }

      setAuthReady(true);
      return true;
    } catch (err) {
      console.error('Error checking auth state:', err);
      setAuthReady(false);
      return false;
    }
  };

  const fetchRepositories = async () => {
    if (!user) {
      setRepositories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Wait for auth to be ready
      const isAuthReady = await checkAuthState();
      
      if (!isAuthReady) {
        throw new Error('GitHub authentication not ready. Please try logging in again.');
      }

      console.log('Fetching repositories for user:', user.id);
      
      const { data, error: funcError } = await supabase.functions.invoke('fetch-github-repos', {
        body: { searchQuery: searchTerm }
      });

      if (funcError) {
        console.error('Function error:', funcError);
        throw funcError;
      }

      if (data && data.repositories) {
        console.log('Repositories fetched:', data.repositories.length);
        setRepositories(data.repositories);
      } else {
        console.error('No repositories data returned:', data);
        throw new Error('No repository data returned from GitHub');
      }
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError(err.message || 'Failed to fetch repositories from GitHub');
    } finally {
      setLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Wait a bit for the session to be fully established
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Initial fetch when component mounts or dependencies change
  useEffect(() => {
    if (user) {
      fetchRepositories();
    } else {
      setRepositories([]);
      setLoading(false);
      setAuthReady(false);
    }
  }, [user, searchTerm, retryCount]);

  // Auto-retry mechanism for page refresh cases
  useEffect(() => {
    if (user && repositories.length === 0 && !loading && !error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log('No repositories found after initial load, retrying...', retryCount + 1);
        setRetryCount(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [repositories, loading, error, retryCount, user]);

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

  if (loading) {
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
        {error.includes('authentication') && (
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
