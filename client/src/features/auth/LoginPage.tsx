import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
  Link,
  Paper
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(credentials);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 2
        }}
      >
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              {/* Header */}
              <Box sx={{ textAlign: 'center' }}>
                <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to your Polifly account
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={credentials.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                  
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={<LoginIcon />}
                    sx={{ mt: 2 }}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </Stack>
              </Box>

              {/* Demo Credentials */}
              <Box sx={{ mt: 2, p:2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Demo Credentials:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Admin:</strong> admin@pollify.local / admin123
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>User:</strong> user@pollify.local / user123
                </Typography>
              </Box>

              {/* Footer */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link component={RouterLink} to="/register" underline="hover">
                    Contact an admin
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
}
