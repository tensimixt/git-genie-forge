
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GitHubAuthProps {
  onAuthSuccess: (user: any) => void;
}

export const GitHubAuth = ({ onAuthSuccess }: GitHubAuthProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGitHubAuth = async () => {
    setLoading(true);
    
    try {
      // For now, simulate GitHub OAuth flow
      // In a real implementation, this would redirect to GitHub OAuth
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock user data - in real implementation, this would come from GitHub API
      const mockUser = {
        id: 12345,
        login: "demo-user",
        name: "Demo User",
        avatar_url: "https://github.com/github.png",
        email: "demo@example.com",
        public_repos: 25,
        followers: 150,
        following: 75
      };

      // Mock access token - in real implementation, this would come from OAuth flow
      const mockToken = "ghp_mock_token_for_demo";
      localStorage.setItem('github_token', mockToken);
      
      onAuthSuccess(mockUser);
      
      toast({
        title: "Authentication Successful",
        description: "Connected to GitHub successfully!",
      });
      
    } catch (error) {
      console.error('GitHub auth error:', error);
      toast({
        title: "Authentication Failed",
        description: "Failed to connect to GitHub. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGitHubAuth} 
      disabled={loading}
      className="w-full bg-gray-900 hover:bg-gray-800 text-white"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Github className="w-4 h-4 mr-2" />
          Sign in with GitHub
        </>
      )}
    </Button>
  );
};
