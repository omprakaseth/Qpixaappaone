import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { NotificationProvider } from "./context/NotificationContext";
import Index from "./hooks/pages/Index";
import Admin from "./hooks/pages/Admin";
import NotFound from "./hooks/pages/NotFound";
import PrivacyPage from "./hooks/pages/PrivacyPage";
import TermsPage from "./hooks/pages/TermsPage";
import ContactPage from "./hooks/pages/ContactPage";
import AboutPage from "./hooks/pages/AboutPage";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { SplashScreen } from "./components/SplashScreen";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <NotificationProvider>
          <SplashScreen />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home/prompt/:id" element={<Index />} />
              <Route path="/home/creator/:id" element={<Index />} />

              <Route path="/market" element={<Index />} />
              <Route path="/market/prompt/:id" element={<Index />} />
              <Route path="/market/creator/:id" element={<Index />} />
              <Route path="/marketplace" element={<Navigate to="/market" replace />} />

              <Route path="/shorts" element={<Index />} />
              <Route path="/shorts/creator/:id" element={<Index />} />

              <Route path="/studio" element={<Index />} />

              <Route path="/notifications" element={<Index />} />

              <Route path="/favorites" element={<Index />} />
              <Route path="/favorites/prompt/:id" element={<Index />} />

              <Route path="/profile" element={<Index />} />
              <Route path="/profile/prompt/:id" element={<Index />} />
              <Route path="/profile/creator/:id" element={<Index />} />

              {/* Legacy / Compatibility routes for deep links */}
              <Route path="/prompt/:id" element={<Index />} />
              <Route path="/creator/:id" element={<Index />} />

              <Route path="/admin/qpixa-portal" element={<Admin />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <PWAInstallPrompt />
          </BrowserRouter>
        </NotificationProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
