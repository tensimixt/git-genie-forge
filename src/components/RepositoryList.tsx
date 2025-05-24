import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, GitFork, Calendar, ExternalLink, MessageSquare, RefreshCw, Bug } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRepositories } from '@/hooks/useRepositories';

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
  const { sessionFullyRestored } = useAuth();
  const { repositories, loading, error, debugLogs, refetch } = useRepositories();
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

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

      // Store debug info
      setDebugInfo({
        hasSession: true,
        hasAccessToken: !!session.access_token,
        hasProviderToken: !!hasGithubToken,
        userId: session.user?.id,
        timestamp: new Date().toISOString()
      });

      setAuthReady(true);
      return true;
    } catch (err) {
      console.error('Error checking auth state:', err);
      setAuthReady(false);
      return false;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkAuthState();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Initial auth check
  useEffect(() => {
    if (user && sessionFullyRestored) {
      checkAuthState();
    }
  }, [user, sessionFullyRestored]);

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

  // Manual refresh function with direct fetch fallback
  const manualRefresh = async () => {
    try {
      console.log('Manual refresh triggered');
      
      // First check auth state
      const isAuthReady = await checkAuthState();
      if (!isAuthReady) {
        console.log('Auth not ready, attempting to refresh session');
      }
      
      // Use the refetch function from useRepositories
      refetch();
    } catch (err) {
      console.error('Error in manual refresh:', err);
    }
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
        <div className="flex justify-center space-x-4 mt-4">
          <Button 
            onClick={manualRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Session & Retry
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowDebugLogs(!showDebugLogs)}
          >
            <Bug className="w-4 h-4 mr-2" />
            {showDebugLogs ? 'Hide Debug Logs' : 'Show Debug Logs'}
          </Button>
        </div>
        
        {error.includes('authentication') && (
          <p className="text-sm text-gray-600 mt-2">
            You may need to sign in with GitHub again
          </p>
        )}
        
        {/* Debug info display */}
        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-left text-xs text-gray-700 max-w-md mx-auto">
            <h4 className="font-bold mb-2">Session Info:</h4>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
        
        {/* Debug logs display */}
        {showDebugLogs && debugLogs && debugLogs.length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-left text-xs text-gray-700 max-w-md mx-auto">
            <h4 className="font-bold mb-2">Debug Logs:</h4>
            <div className="max-h-96 overflow-auto">
              {debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">{log.time.substring(11, 19)}</span>: {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Debug and refresh buttons */}
      <div className="mb-4 flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowDebugLogs(!showDebugLogs)}
        >
          <Bug className="w-4 h-4 mr-2" />
          {showDebugLogs ? 'Hide Debug Logs' : 'Show Debug Logs'}
        </Button>
        <Button 
          onClick={manualRefresh}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Session
        </Button>
      </div>
      
      {/* Debug logs display */}
      {showDebugLogs && debugLogs && debugLogs.length > 0 && (
        <div className="mb-6 p-4 bg-gray-100 rounded text-xs text-gray-700">
          <h4 className="font-bold mb-2">Debug Logs:</h4>
          <div className="max-h-40 overflow-auto">
            {debugLogs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">{log.time.substring(11, 19)}</span>: {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
      
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
            <div className="flex justify-center space-x-4 mt-4">
              <Button 
                onClick={manualRefresh}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Session & Repositories
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowDebugLogs(!showDebugLogs)}
              >
                <Bug className="w-4 h-4 mr-2" />
                {showDebugLogs ? 'Hide Debug Logs' : 'Show Debug Logs'}
              </Button>
            </div>
            
            {/* Debug info display */}
            {debugInfo && (
              <div className="mt-6 p-4 bg-gray-100 rounded text-left text-xs text-gray-700 max-w-md mx-auto">
                <h4 className="font-bold mb-2">Session Info:</h4>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
            
            {/* Debug logs display */}
            {showDebugLogs && debugLogs && debugLogs.length > 0 && (
              <div className="mt-6 p-4 bg-gray-100 rounded text-left text-xs text-gray-700 max-w-md mx-auto">
                <h4 className="font-bold mb-2">Debug Logs:</h4>
                <div className="max-h-96 overflow-auto">
                  {debugLogs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">{log.time.substring(11, 19)}</span>: {log.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
