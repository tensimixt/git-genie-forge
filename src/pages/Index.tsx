import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Github, Search } from "lucide-react";
import { GitHubAuth } from "@/components/GitHubAuth";
import { RepositoryList } from "@/components/RepositoryList";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [forceRefresh, setForceRefresh] = useState(0);

  // Force a refresh of child components when auth state changes
  useEffect(() => {
    if (user && profile && !loading) {
      console.log("Auth state ready, triggering repository refresh");
      setForceRefresh(prev => prev + 1);
    }
  }, [user, profile, loading]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-black rounded-full p-3">
                <Github className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Git Genie</CardTitle>
            <CardDescription>
              AI-powered GitHub repository assistant. Connect your GitHub account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GitHubAuth />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-black rounded-full p-2">
              <Github className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">Git Genie</h1>
          </div>
          <UserProfile />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.username || user.email}!
          </h2>
          <p className="text-gray-600">Select a repository to start chatting with AI about your code</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search repositories..."
              className="pl-10 pr-4 py-2 w-full max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Repository List */}
        <RepositoryList 
          key={forceRefresh} // This forces the component to remount when auth state changes
          user={user} 
          searchTerm={searchTerm}
          onRepositorySelect={(repo) => {
            console.log('Selected repository:', repo);
            // TODO: Navigate to chat interface
          }}
        />
      </main>
    </div>
  );
};

export default Index;
