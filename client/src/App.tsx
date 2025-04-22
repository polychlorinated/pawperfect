import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Booking from "@/pages/booking";
import Admin from "@/pages/admin";
import ApiDocs from "@/pages/api-docs";
import MCPDashboard from "@/pages/mcp";
import ModelContextProtocolPage from "@/pages/model-context-protocol";
import Profiles from "@/pages/profiles";
import CustomerProfile from "@/pages/customer-profile";
import AuthPage from "@/pages/auth-page";
import WebhooksPage from "@/pages/webhooks";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { AuthProvider } from "@/hooks/use-auth";
import { useMCP } from "@/hooks/use-mcp";
import { ProtectedRoute, AdminRoute, CustomerRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/booking" component={Booking} />
      <ProtectedRoute path="/booking/:step" component={Booking} />
      <CustomerRoute path="/profile" component={CustomerProfile} />
      <AdminRoute path="/admin" component={Admin} />
      <AdminRoute path="/admin/profiles" component={Profiles} />
      <AdminRoute path="/admin/profiles/:id" component={Profiles} />
      <AdminRoute path="/api-docs" component={ApiDocs} />
      <AdminRoute path="/mcp" component={MCPDashboard} />
      <AdminRoute path="/model-context-protocol" component={ModelContextProtocolPage} />
      <AdminRoute path="/admin/webhooks" component={WebhooksPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MCPInitializer() {
  // Initialize MCP connection (inside Auth context)
  useMCP({
    autoConnect: true,
    showToasts: false // Disable toasts for connection events to reduce noise
  });
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MCPInitializer />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
