import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Swipe from "@/pages/swipe";
import Matches from "@/pages/matches";
import Chat from "@/pages/chat";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import VIP from "@/pages/vip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Redirect to="/login" />;
  
  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Layout>
      <Switch>
        <Route path="/">
          {user ? <Redirect to="/swipe" /> : <Redirect to="/login" />}
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        <Route path="/swipe" render={() => <ProtectedRoute component={Swipe} />} />
        <Route path="/matches" render={() => <ProtectedRoute component={Matches} />} />
        <Route path="/chat/:matchId" render={() => <ProtectedRoute component={Chat} />} />
        <Route path="/dashboard" render={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/profile" render={() => <ProtectedRoute component={Profile} />} />
        <Route path="/settings" render={() => <ProtectedRoute component={Settings} />} />
        <Route path="/vip" render={() => <ProtectedRoute component={VIP} />} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
