
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Github, Search, Star, GitFork, Calendar } from "lucide-react";
import { GitHubAuth } from "@/components/GitHubAuth";
import { RepositoryList } from "@/components/RepositoryList";
import { UserProfile } from "@/components/UserProfile";

const Index = () => {
  const [user, setUser] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const savedUser = localStorage.getItem('github_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('github_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setRepositories([]);
    localStorage.removeItem('github_user');
    localStorage.removeItem('github_token');
  };

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
            <GitHubAuth onAuthSuccess={handleAuthSuccess} />
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
          <UserProfile user={user} onLogout={handleLogout} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Repositories</h2>
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
