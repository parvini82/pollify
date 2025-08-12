import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layout'
import LoginPage from './features/auth/LoginPage'
import FormsPage from './features/forms/FormsPage'
import FormEditorPage from './features/forms/FormEditorPage'
import PublicFillPage from './features/public/PublicFillPage'
import ResultsPage from './features/results/ResultsPage'
import { Box, CircularProgress } from '@mui/material'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirects to home if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <FormsPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/forms/:id" element={
        <ProtectedRoute>
          <Layout>
            <FormEditorPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/forms/:formId/fill" element={<PublicFillPage />} />
      <Route path="/forms/:formId/results" element={
        <ProtectedRoute>
          <Layout>
            <ResultsPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/public/:formId" element={<PublicFillPage />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
