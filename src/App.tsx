
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastProvider } from "@/hooks/toast-context";
import Index from '@/pages/Index';
import { Toaster } from "@/components/ui/toaster";
import ThemeProvider from '@/components/ThemeProvider';

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
          </Routes>
          <Toaster />
        </Router>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
