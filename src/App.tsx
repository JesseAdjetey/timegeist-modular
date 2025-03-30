
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastProvider } from "@/hooks/toast-context";
import { ToastTest } from '@/components/ToastTest';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ToastTest />} />
        </Routes>
        <Toaster />
      </Router>
    </ToastProvider>
  );
}

export default App;
