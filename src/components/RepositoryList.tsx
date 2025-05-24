
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, GitFork, Calendar, ExternalLink, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepositories();
  }, [user]);

  const fetchRepositories = async () => {
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock repository data - in real implementation, this would come from GitHub API
      const mockRepos: Repository[] = [
        {
          id: 1,
          name: "awesome-web-app",
          full_name: `${user.login}/awesome-web-app`,
          description: "A full-stack web application built with React and Node.js",
          html_url: `https://github.com/${user.login}/awesome-web-app`,
          language: "TypeScript",
          stargazers_count: 42,
          forks_count: 8,
          updated_at: "2024-01-15T10:30:00Z",
          private: false
        },
        {
          id: 2,
          name: "api-service",
          full_name: `${user.login}/api-service`,
          description: "RESTful API service with authentication and database integration",
          html_url: `https://github.com/${user.login}/api-service`,
          language: "JavaScript",
          stargazers_count: 15,
          forks_count: 3,
          updated_at: "2024-01-10T14:20:00Z",
          private: true
        },
        {
          id: 3,
          name: "mobile-app",
          full_name: `${user.login}/mobile-app`,
          description: "Cross-platform mobile application using React Native",
          html_url: `https://github.com/${user.login}/mobile-app`,
          language: "JavaScript",
          stargazers_count: 28,
          forks_count: 5,
          updated_at: "2024-01-12T09:15:00Z",
          private: false
        },
        {
          id: 4,
          name: "data-analytics",
          full_name: `${user.login}/data-analytics`,
          description: "Data analysis and visualization tools",
          html_url: `https://github.com/${user.login}/data-analytics`,
          language: "Python",
          stargazers_count: 67,
          forks_count: 12,
          updated_at: "2024-01-08T16:45:00Z",
          private: false
        }
      ];
      
      setRepositories(mockRepos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

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
            {searchTerm ? 'Try adjusting your search terms' : 'No repositories available'}
          </p>
        </div>
      )}
    </div>
  );
};
