import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Investments from "@/pages/investments";
import Reports from "@/pages/reports";
import Categories from "@/pages/categories";
import Profile from "@/pages/profile";
import Goals from "@/pages/goals";
import Import from "@/pages/import";
import Subscription from "@/pages/subscription";
import Upgrade from "@/pages/upgrade";
import Onboarding from "@/pages/onboarding";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Initialize business theme
  useBusinessTheme();
  
  // Check if user needs onboarding
  const needsOnboarding = isAuthenticated && user && !user.onboardingCompleted;

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : needsOnboarding ? (
        <Route path="*" component={Onboarding} />
      ) : (
        <>
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/investments" component={Investments} />
          <Route path="/goals" component={Goals} />
          <Route path="/import" component={Import} />
          <Route path="/reports" component={Reports} />
          <Route path="/categories" component={Categories} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/upgrade" component={Upgrade} />
          <Route path="/profile" component={Profile} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="financeflow-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
