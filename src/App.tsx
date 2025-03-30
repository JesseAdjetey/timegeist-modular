
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { ToastTest } from '@/components/ToastTest';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ToastTest />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
