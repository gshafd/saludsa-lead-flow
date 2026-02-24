import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import LeadsList from "./pages/LeadsList";
import LeadDetail from "./pages/LeadDetail";
import Engagement from "./pages/Engagement";
import WebChat from "./pages/WebChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DataProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsList />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/engagement/:id" element={<Engagement />} />
              <Route path="/engagement" element={<Engagement />} />
              <Route path="/webchat" element={<WebChat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
