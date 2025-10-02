import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute, { AdminRoute, PentesterRoute, AnalystRoute, ViewerRoute } from './components/ProtectedRoute/ProtectedRoute'
import Dashboard from './pages/Dashboard/Dashboard'
import Tools from './pages/Tools/Tools'
import Scans from './pages/Scans/Scans'
import Reports from './pages/Reports/Reports'
import Settings from './pages/Settings/Settings'
import Assistant from './pages/Assistant/Assistant'
import McpToolset from './pages/McpToolset/McpToolset'
import Analytics from './pages/Analytics/Analytics'
import StrategicFramework from './pages/StrategicFramework/StrategicFramework'
import HexStrikeAI from './pages/HexStrikeAI/HexStrikeAI'
import McpGodMode from './pages/McpGodMode/McpGodMode'
import ComplianceDashboard from './pages/ComplianceDashboard/ComplianceDashboard'
import Login from './pages/Login/Login'
import NotFound from './pages/NotFound/NotFound'
import PWAInstallPrompt from './components/PWAInstallPrompt/PWAInstallPrompt'

const App: React.FC = () => {
  return (
    <>
      <PWAInstallPrompt />
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Tools - Pentester and above */}
      <Route path="/tools" element={
        <PentesterRoute>
          <Layout>
            <Tools />
          </Layout>
        </PentesterRoute>
      } />
      <Route path="/tools/:category" element={
        <PentesterRoute>
          <Layout>
            <Tools />
          </Layout>
        </PentesterRoute>
      } />
      <Route path="/tools/:category/:toolId" element={
        <PentesterRoute>
          <Layout>
            <Tools />
          </Layout>
        </PentesterRoute>
      } />

      {/* MCP Toolset - Pentester and above */}
      <Route path="/mcp-toolset" element={
        <PentesterRoute>
          <Layout>
            <McpToolset />
          </Layout>
        </PentesterRoute>
      } />
      <Route path="/mcp-toolset/:category" element={
        <PentesterRoute>
          <Layout>
            <McpToolset />
          </Layout>
        </PentesterRoute>
      } />
      <Route path="/mcp-toolset/:category/:toolId" element={
        <PentesterRoute>
          <Layout>
            <McpToolset />
          </Layout>
        </PentesterRoute>
      } />

      {/* Scans - Analyst and above */}
      <Route path="/scans" element={
        <AnalystRoute>
          <Layout>
            <Scans />
          </Layout>
        </AnalystRoute>
      } />
      <Route path="/scans/:scanId" element={
        <AnalystRoute>
          <Layout>
            <Scans />
          </Layout>
        </AnalystRoute>
      } />

      {/* Reports - All authenticated users */}
      <Route path="/reports" element={
        <ViewerRoute>
          <Layout>
            <Reports />
          </Layout>
        </ViewerRoute>
      } />
      <Route path="/reports/:reportId" element={
        <ViewerRoute>
          <Layout>
            <Reports />
          </Layout>
        </ViewerRoute>
      } />

      {/* Analytics - Analyst and above */}
      <Route path="/analytics" element={
        <AnalystRoute>
          <Layout>
            <Analytics />
          </Layout>
        </AnalystRoute>
      } />

      {/* Strategic Framework - Analyst and above */}
      <Route path="/strategic-framework" element={
        <AnalystRoute>
          <Layout>
            <StrategicFramework />
          </Layout>
        </AnalystRoute>
      } />

      {/* HexStrike AI - Pentester and above */}
      <Route path="/hexstrike-ai" element={
        <PentesterRoute>
          <Layout>
            <HexStrikeAI />
          </Layout>
        </PentesterRoute>
      } />

      {/* MCP God Mode - Admin only */}
      <Route path="/mcp-god-mode" element={
        <AdminRoute>
          <Layout>
            <McpGodMode />
          </Layout>
        </AdminRoute>
      } />

      {/* Compliance Dashboard - Admin only */}
      <Route path="/compliance" element={
        <AdminRoute>
          <Layout>
            <ComplianceDashboard />
          </Layout>
        </AdminRoute>
      } />

      {/* Assistant - All authenticated users */}
      <Route path="/assistant" element={
        <ViewerRoute>
          <Layout>
            <Assistant />
          </Layout>
        </ViewerRoute>
      } />

      {/* Settings - All authenticated users */}
      <Route path="/settings" element={
        <ViewerRoute>
          <Layout>
            <Settings />
          </Layout>
        </ViewerRoute>
      } />
      <Route path="/settings/:section" element={
        <ViewerRoute>
          <Layout>
            <Settings />
          </Layout>
        </ViewerRoute>
      } />

      {/* 404 Not Found - Protected */}
      <Route path="*" element={
        <ProtectedRoute>
          <Layout>
            <NotFound />
          </Layout>
        </ProtectedRoute>
      } />
      </Routes>
    </>
  )
}

export default App