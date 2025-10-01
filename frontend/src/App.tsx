import React, { Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ErrorBoundary from './ErrorBoundary';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import SecurityToolsPage from './components/security/SecurityToolsPage';
import ReportsPage from './components/reports/ReportsPage';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light'
    }
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <Layout toggleTheme={toggleTheme} isDarkMode={isDarkMode}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route
                  path="/security-tools"
                  element={<SecurityToolsPage />}
                />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  );
};
