
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'sonner';
import { SupabaseRealTimeSetup } from './components/SupabaseRealTimeSetup';
import './App.css';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <SupabaseRealTimeSetup />
        <Toaster position="top-right" />
        <AppRoutes />
      </ThemeProvider>
    </Router>
  );
}

export default App;
