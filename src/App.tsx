
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/hooks/toast-context";
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
