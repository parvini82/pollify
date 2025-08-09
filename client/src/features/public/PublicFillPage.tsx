import { useState } from 'react'
import { http, errMsg } from '../../api/https'
import { Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material'

export default function PublicFillPage() {
  const [formId, setFormId] = useState(''); const [form, setForm] = useState<any>(null)
  const [values, setValues] = useState<Record<string,string>>({})

  const load = async () => {
    try { const { data } = await http.get(`/api/public/forms/${formId}`); setForm(data); setValues({}) }
    catch (e) { alert('Form not found or not public'); setForm(null) }
  }
  const submit = async () => {
    const items = form.questions.map((q:any) => q.type==='MULTIPLE_CHOICE'
      ? { questionId: q.id, valueChoiceId: values[q.id] || null }
      : { questionId: q.id, valueText: values[q.id] || '' })
    const { data } = await http.post(`/api/public/forms/${form.id}/responses`, { items })
    alert('Submitted! responseId=' + data.responseId)
  }

  return (
    <Stack spacing={3}>
      <Card><CardContent>
        <Stack direction={{xs:'column',sm:'row'}} spacing={2} alignItems="flex-end">
          <TextField label="Form ID" value={formId} onChange={e=>setFormId(e.target.value)} fullWidth />
          <Button variant="contained" onClick={load}>Load</Button>
        </Stack>
      </CardContent></Card>

      {form && (
        <Card><CardContent>
          <Typography variant="h6" gutterBottom>{form.title}</Typography>
          <Stack spacing={2}>
            {form.questions.map((q:any)=>(
              <div key={q.id}>
                <Typography fontWeight={600} gutterBottom>{q.title}</Typography>
                {q.type==='TEXT' ? (
                  <TextField fullWidth value={values[q.id]||''} onChange={e=>setValues({...values,[q.id]:e.target.value})} />
                ) : (
                  <TextField select fullWidth value={values[q.id]||''} onChange={e=>setValues({...values,[q.id]:e.target.value})}>
                    <MenuItem value="">Select...</MenuItem>
                    {q.choices.map((c:any)=><MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
                  </TextField>
                )}
              </div>
            ))}
          </Stack>
          <Stack sx={{ mt:2 }}><Button variant="contained" onClick={submit}>Submit</Button></Stack>
        </CardContent></Card>
      )}
    </Stack>
  )
}
