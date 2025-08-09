import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { http, errMsg } from '../../api/https'
import type { Form } from '../../types'
import { Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'

export default function FormEditorPage() {
  const { id } = useParams()
  const [form, setForm] = useState<Form | null>(null)
  const [qTitle, setQTitle] = useState(''); const [qType, setQType] = useState<'TEXT'|'MULTIPLE_CHOICE'>('TEXT'); const [qOrder, setQOrder] = useState(0)

  const refresh = async () => {
    try { const { data } = await http.get(`/api/forms/${id}`); setForm(data) }
    catch (e) { alert(errMsg(e)) }
  }
  useEffect(()=>{ if(id) refresh() }, [id])

  const addQuestion = async () => {
    if (!id || !qTitle.trim()) return
    try { await http.post(`/api/forms/${id}/questions`, { title: qTitle, type: qType, order: Number(qOrder), required: false }); setQTitle(''); setQType('TEXT'); setQOrder(0); refresh() }
    catch (e) { alert(errMsg(e)) }
  }
  const delQuestion = async (qid: string) => { if (!confirm('Delete question?')) return; await http.delete(`/api/questions/${qid}`); refresh() }
  const addChoice = async (qid: string) => {
    const label = prompt('Choice label?'); if(!label) return
    const value = prompt('Choice value?', label) || label
    const order = Number(prompt('Choice order?', '0') || 0)
    await http.post(`/api/questions/${qid}/choices`, { label, value, order }); refresh()
  }
  const delChoice = async (cid: string) => { if (!confirm('Delete choice?')) return; await http.delete(`/api/choices/${cid}`); refresh() }

  if (!form) return null

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{form.title}</Typography>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/public">Fill Public</Button>
          <Button component={RouterLink} to="/results">Results</Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Add Question</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField label="Title" value={qTitle} onChange={e=>setQTitle(e.target.value)} fullWidth /></Grid>
            <Grid item xs={6} md={3}>
              <TextField select label="Type" value={qType} onChange={e=>setQType(e.target.value as any)} fullWidth>
                <MenuItem value="TEXT">TEXT</MenuItem>
                <MenuItem value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}><TextField type="number" label="Order" value={qOrder} onChange={e=>setQOrder(parseInt(e.target.value||'0'))} fullWidth/></Grid>
          </Grid>
          <Stack sx={{ mt:2 }}><Button variant="contained" onClick={addQuestion}>Add</Button></Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Questions</Typography>
          <Stack spacing={2}>
            {form.questions?.map(q=>(
              <Card key={q.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <div>
                      <Typography>{q.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{q.type}</Typography>
                    </div>
                    <Button color="error" onClick={()=>delQuestion(q.id)}>Delete</Button>
                  </Stack>

                  {q.type==='MULTIPLE_CHOICE' && (
                    <Stack spacing={1} sx={{ mt:2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Choices</Typography>
                        <Button onClick={()=>addChoice(q.id)}>Add choice</Button>
                      </Stack>
                      <Stack spacing={1}>
                        {q.choices?.map(c=>(
                          <Stack key={c.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ border:'1px solid #eee', p:1, borderRadius:1 }}>
                            <Typography>{c.label} <span style={{color:'#999'}}>({c.value})</span></Typography>
                            <Button color="error" onClick={()=>delChoice(c.id)}>Delete</Button>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
