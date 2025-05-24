
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface GitHubAuthProps {
  onAuthSuccess?: (user: any) => void;
}

export const GitHubAuth = ({ onAuthSuccess }: GitHubAuthProps) => {
  const [loading, setLoading] = useState(false);
  const { signInWithGitHub } = useAuth();

  const handleGitHubAuth = async () => {
    setLoading(true);
    try {
      await signInWithGitHub();
      // The auth state change will be handled by the AuthProvider
    } catch (error) {
      console.error('GitHub auth error:', error);
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
