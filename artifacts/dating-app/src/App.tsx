import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
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

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  return <Component />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Layout>
      <Switch>
        <Route path="/">
          {user ? <Redirect to="/swipe" /> : <Redirect to="/login" />}
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/swipe">
          <ProtectedRoute component={Swipe} />
        </Route>
        <Route path="/matches">
          <ProtectedRoute component={Matches} />
        </Route>
        <Route path="/chat/:matchId">
          <ProtectedRoute component={Chat} />
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={Settings} />
        </Route>
        <Route path="/vip">
          <ProtectedRoute component={VIP} />
        </Route>
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
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
