
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastProvider } from "@/hooks/toast-context";
import Index from '@/pages/Index';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
        <Toaster />
      </Router>
    </ToastProvider>
  );
}

export default App;
