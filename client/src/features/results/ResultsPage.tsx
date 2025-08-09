import { useState } from 'react'
import { http } from '../../api/https'
import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

export default function ResultsPage() {
  const [formId, setFormId] = useState(''); const [summary, setSummary] = useState<any>(null)
  const [resp, setResp] = useState<any>(null); const [page, setPage] = useState(1)

  const loadSummary = async () => { const { data } = await http.get(`/api/forms/${formId}/analytics/summary`); setSummary(data) }
  const loadResponses = async (p=1) => { const { data } = await http.get(`/api/forms/${formId}/responses?page=${p}&pageSize=10&order=desc`); setResp(data); setPage(p) }

  return (
    <Stack spacing={3}>
      <Card><CardContent>
        <Stack direction={{xs:'column',sm:'row'}} spacing={2} alignItems="flex-end">
          <TextField label="Form ID" value={formId} onChange={e=>setFormId(e.target.value)} fullWidth />
          <Button onClick={loadSummary} variant="contained">Load summary</Button>
          <Button onClick={()=>loadResponses(1)}>Load responses</Button>
          <Button component="a" href={`/api/forms/${formId}/export.csv`} target="_blank">Download CSV</Button>
        </Stack>
      </CardContent></Card>

      {summary && (
        <Card><CardContent>
          <Typography variant="h6" gutterBottom>Summary (Total: {summary.totalResponses})</Typography>
          <Stack spacing={3}>
            {summary.questions.map((q:any)=>(
              <div key={q.questionId}>
                <Typography fontWeight={600} gutterBottom>{q.title}</Typography>
                {q.type==='MULTIPLE_CHOICE' ? (
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <BarChart data={q.results.map((r:any)=>({ name:r.label, count:r.count }))}>
                        <XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip />
                        <Bar dataKey="count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Typography color="text.secondary">Text responses: {q.textResponsesCount}</Typography>
                )}
              </div>
            ))}
          </Stack>
        </CardContent></Card>
      )}

      {resp && (
        <Card><CardContent>
          <Typography variant="h6" gutterBottom>Responses (page {page}/{resp.totalPages})</Typography>
          <Stack spacing={2}>
            {resp.data.map((r:any)=>(
              <div key={r.id} style={{ border:'1px solid #eee', borderRadius:8, padding:12 }}>
                <Typography variant="caption" color="text.secondary">{new Date(r.submittedAt).toLocaleString()}</Typography>
                <ul>
                  {r.items.map((i:any)=>(<li key={i.id}><strong>{i.questionTitle}:</strong> {i.valueText || i.valueChoiceId || '-'}</li>))}
                </ul>
              </div>
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt:2 }}>
            <Button onClick={()=>loadResponses(Math.max(1, page-1))}>Prev</Button>
            <Button onClick={()=>loadResponses(Math.min(resp.totalPages, page+1))}>Next</Button>
          </Stack>
        </CardContent></Card>
      )}
    </Stack>
  )
}
