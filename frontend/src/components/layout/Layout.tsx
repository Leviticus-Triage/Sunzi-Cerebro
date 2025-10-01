import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

interface LayoutProps {
  children: React.ReactNode;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, toggleTheme, isDarkMode }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const drawerWidth = 240;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header
        toggleSidebar={toggleSidebar}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
      <Sidebar open={sidebarOpen} drawerWidth={drawerWidth} />
      <MainContent>{children}</MainContent>
    </Box>
  );
};

export default Layout;