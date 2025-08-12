import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { http, errMsg } from '../../api/https'
import type { Form } from '../../types'
import { 
  Button, 
  Card, 
  CardContent, 
  Stack, 
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  LinearProgress
} from '@mui/material'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material'

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    isPublic: true,
    maxResponses: '',
    allowMultipleResponses: false
  })

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      setLoading(true)
      const { data } = await http.get('/api/forms')
      setForms(data)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const createForm = async () => {
    try {
      const formData = {
        ...newForm,
        maxResponses: newForm.maxResponses ? parseInt(newForm.maxResponses) : undefined
      }
      
      const { data } = await http.post('/api/forms', formData)
      setForms(prev => [data, ...prev])
      setCreateDialogOpen(false)
      setNewForm({
        title: '',
        description: '',
        isPublic: true,
        maxResponses: '',
        allowMultipleResponses: false
      })
    } catch (e) {
      setError(errMsg(e))
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading forms...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">My Forms</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create New Form
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Forms Grid */}
      <Grid container spacing={3}>
        {forms.map((form) => (
          <Grid item xs={12} md={6} lg={4} key={form.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {form.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {form.description || 'No description'}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {form.isPublic ? (
                        <Chip icon={<PublicIcon />} label="Public" size="small" color="success" />
                      ) : (
                        <Chip icon={<LockIcon />} label="Private" size="small" color="default" />
                      )}
                      <Chip label={`${form._count?.responses || 0} responses`} size="small" />
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                    <IconButton 
                      component={RouterLink} 
                      to={`/forms/${form.id}`}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      component={RouterLink} 
                      to={`/forms/${form.id}/fill`}
                      color="info"
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      component={RouterLink} 
                      to={`/forms/${form.id}/results`}
                      color="secondary"
                      size="small"
                    >
                      <AnalyticsIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {forms.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No forms yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first form to get started
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Form
          </Button>
        </Box>
      )}

      {/* Create Form Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Form</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Form Title"
              value={newForm.title}
              onChange={(e) => setNewForm({...newForm, title: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newForm.description}
              onChange={(e) => setNewForm({...newForm, description: e.target.value})}
              multiline
              rows={3}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={newForm.isPublic}
                  onChange={(e) => setNewForm({...newForm, isPublic: e.target.checked})}
                />
              }
              label="Public form (anyone can access)"
            />
            <TextField
              label="Max Responses (optional)"
              type="number"
              value={newForm.maxResponses}
              onChange={(e) => setNewForm({...newForm, maxResponses: e.target.value})}
              fullWidth
              helperText="Leave empty for unlimited responses"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={newForm.allowMultipleResponses}
                  onChange={(e) => setNewForm({...newForm, allowMultipleResponses: e.target.checked})}
                />
              }
              label="Allow multiple responses from same participant"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={createForm} 
            variant="contained"
            disabled={!newForm.title.trim()}
          >
            Create Form
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
