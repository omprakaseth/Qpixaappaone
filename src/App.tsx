"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { NotificationProvider } from "./context/NotificationContext";
import Index from "./views/Index";
import Admin from "./views/Admin";
import NotFound from "./views/NotFound";
import PrivacyPage from "./views/PrivacyPage";
import TermsPage from "./views/TermsPage";
import ContactPage from "./views/ContactPage";
import AboutPage from "./views/AboutPage";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

const App = () => {
  console.log('App: Rendering');
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/market" element={<Index />} />
                <Route path="/shorts" element={<Index />} />
                <Route path="/studio" element={<Index />} />
                <Route path="/notifications" element={<Index />} />
                <Route path="/favorites" element={<Index />} />
                <Route path="/profile" element={<Index />} />
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
            </Router>
          </NotificationProvider>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
