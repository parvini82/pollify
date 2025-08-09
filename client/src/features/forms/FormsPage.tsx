import { useEffect, useState } from 'react'
import { http, errMsg } from '../../api/https'
import type { Form } from '../../types'
import { Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [isPublic] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try { const { data } = await http.get<Form[]>('/api/forms'); setForms(data) }
    catch (e) { alert(errMsg(e)) }
    finally { setLoading(false) }
  }
  useEffect(() => { refresh() }, [])

  const createForm = async () => {
    if (!title.trim()) return
    try { await http.post('/api/forms', { title, description, isPublic }); setTitle(''); setDescription(''); refresh() }
    catch (e) { alert(errMsg(e)) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this form?')) return
    try { await http.delete(`/api/forms/${id}`); refresh() }
    catch (e) { alert(errMsg(e)) }
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Create Form</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Title" value={title} onChange={e=>setTitle(e.target.value)} fullWidth />
            <TextField label="Description" value={description} onChange={e=>setDescription(e.target.value)} fullWidth />
            <Button variant="contained" onClick={createForm}>Create</Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Your Forms</Typography>
        <Button onClick={refresh}>Refresh</Button>
      </Stack>

      {loading ? <CircularProgress /> : (
        <Stack spacing={2}>
          {forms.map(f => (
            <Card key={f.id}>
              <CardContent sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <Box>
                  <Typography>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">Responses: {f._count?.responses ?? 0}</Typography>
                </Box>
                <Box>
                  <Button component={RouterLink} to={`/forms/${f.id}`} sx={{ mr:1 }}>Open</Button>
                  <Button color="error" onClick={()=>del(f.id)}>Delete</Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
