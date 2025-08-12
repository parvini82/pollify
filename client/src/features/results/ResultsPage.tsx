import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { http, errMsg } from '../../api/https'
import type { Form, Response, BehavioralAnalysis } from '../../types'
import { 
  Button, 
  Card, 
  CardContent, 
  Stack, 
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material'
import { 
  BarChart as BarChartIcon,
  Download as DownloadIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ResultsPage() {
  const { formId } = useParams()
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [behavioralAnalysis, setBehavioralAnalysis] = useState<BehavioralAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    if (formId) {
      loadResults()
    }
  }, [formId])

  const loadResults = async () => {
    try {
      setLoading(true)
      const [formResponse, responsesResponse, analysisResponse] = await Promise.all([
        http.get(`/api/forms/${formId}`),
        http.get(`/api/forms/${formId}/responses`),
        http.get(`/api/forms/${formId}/behavioral-analysis`)
      ])
      
      setForm(formResponse.data)
      setResponses(responsesResponse.data)
      setBehavioralAnalysis(analysisResponse.data)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!form || !responses.length) return

    const headers = ['Response ID', 'Submitted At', 'Total Time (seconds)']
    form.questions.forEach(q => {
      headers.push(q.title)
    })

    const csvContent = [
      headers.join(','),
      ...responses.map(response => {
        const row = [
          response.id,
          new Date(response.submittedAt).toLocaleString(),
          response.totalTime || 0
        ]
        
        form.questions.forEach(question => {
          const item = response.items.find(item => item.questionId === question.id)
          let value = ''
          
          if (item) {
            switch (question.type) {
              case 'TEXT':
                value = item.valueText || ''
                break
              case 'MULTIPLE_CHOICE':
                const choice = question.choices.find(c => c.id === item.valueChoiceId)
                value = choice?.label || ''
                break
              case 'RATING':
                value = item.valueRating?.toString() || ''
                break
            }
          }
          
          // Escape commas and quotes
          value = value.replace(/"/g, '""')
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value}"`
          }
          
          row.push(value)
        })
        
        return row.join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.title}_responses.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getQuestionStats = (questionId: string) => {
    const question = form?.questions.find(q => q.id === questionId)
    if (!question) return null

    const questionResponses = responses.map(r => 
      r.items.find(item => item.questionId === questionId)
    ).filter(Boolean)

    switch (question.type) {
      case 'MULTIPLE_CHOICE': {
        const choiceCounts: { [key: string]: number } = {}
        question.choices.forEach(choice => {
          choiceCounts[choice.label] = 0
        })
        
        questionResponses.forEach(item => {
          const choice = question.choices.find(c => c.id === item?.valueChoiceId)
          if (choice) {
            choiceCounts[choice.label]++
          }
        })

        return choiceCounts
      }

      case 'RATING': {
        const ratings = questionResponses
          .map(item => item?.valueRating)
          .filter((rating): rating is number => rating !== undefined)
        
        if (ratings.length === 0) return null
        
        const avg = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        const min = Math.min(...ratings)
        const max = Math.max(...ratings)
        
        return { average: avg.toFixed(1), min, max, total: ratings.length }
      }

      case 'TEXT': {
        return { total: questionResponses.length }
      }

      default:
        return null
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading results...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={loadResults} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    )
  }

  if (!form) return null

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>{form.title} - Results</Typography>
          <Typography variant="body1" color="text.secondary">
            {responses.length} responses • Created {new Date(form.createdAt || '').toLocaleDateString()}
          </Typography>
        </Box>
        <Button 
          onClick={exportToCSV} 
          variant="outlined" 
          startIcon={<DownloadIcon />}
          disabled={!responses.length}
        >
          Export CSV
        </Button>
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Summary" icon={<BarChartIcon />} iconPosition="start" />
          <Tab label="Responses" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Behavioral Analysis" icon={<PsychologyIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Summary Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {form.questions.map((question) => {
            const stats = getQuestionStats(question.id)
            if (!stats) return null

            return (
              <Grid item xs={12} md={6} key={question.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {question.title}
                      <Chip label={question.type} size="small" sx={{ ml: 1 }} />
                    </Typography>
                    
                    {question.type === 'MULTIPLE_CHOICE' && (
                      <Stack spacing={1}>
                        {Object.entries(stats).map(([choice, count]) => (
                          <Box key={choice}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2">{choice}</Typography>
                              <Chip label={count} size="small" />
                            </Stack>
                            <LinearProgress 
                              variant="determinate" 
                              value={(count / responses.length) * 100} 
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    )}
                    
                    {question.type === 'RATING' && (
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          Average: {stats.average} stars
                        </Typography>
                        <Typography variant="body2">
                          Range: {stats.min} - {stats.max} stars
                        </Typography>
                        <Typography variant="body2">
                          Total responses: {stats.total}
                        </Typography>
                      </Stack>
                    )}
                    
                    {question.type === 'TEXT' && (
                      <Typography variant="body2">
                        Total responses: {stats.total}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </TabPanel>

      {/* Responses Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Response ID</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Total Time</TableCell>
                {form.questions.map(q => (
                  <TableCell key={q.id}>{q.title}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {responses.map((response) => (
                <TableRow key={response.id}>
                  <TableCell>{response.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {new Date(response.submittedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {response.totalTime ? `${response.totalTime}s` : 'N/A'}
                  </TableCell>
                  {form.questions.map(question => {
                    const item = response.items.find(item => item.questionId === question.id)
                    let value = 'No response'
                    
                    if (item) {
                      switch (question.type) {
                        case 'TEXT':
                          value = item.valueText || 'No text'
                          break
                        case 'MULTIPLE_CHOICE':
                          const choice = question.choices.find(c => c.id === item.valueChoiceId)
                          value = choice?.label || 'No choice'
                          break
                        case 'RATING':
                          value = item.valueRating ? `${item.valueRating} stars` : 'No rating'
                          break
                      }
                    }
                    
                    return (
                      <TableCell key={question.id}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {value}
                        </Typography>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Behavioral Analysis Tab */}
      <TabPanel value={tabValue} index={2}>
        {behavioralAnalysis ? (
          <Grid container spacing={3}>
            {/* Behavioral Metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Question Change Rates</Typography>
                  <Stack spacing={2}>
                    {form.questions.map(question => {
                      const changeRate = behavioralAnalysis.questionChangeRates[question.id] || 0
                      return (
                        <Box key={question.id}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {question.title}
                            </Typography>
                            <Chip 
                              label={`${changeRate.toFixed(1)} changes`} 
                              size="small"
                              color={changeRate > 2 ? 'error' : changeRate > 1 ? 'warning' : 'success'}
                            />
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(changeRate * 20, 100)} 
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Completion Rates</Typography>
                  <Stack spacing={2}>
                    {form.questions.map(question => {
                      const completionRate = behavioralAnalysis.completionRates[question.id] || 0
                      return (
                        <Box key={question.id}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {question.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {completionRate.toFixed(1)}%
                            </Typography>
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={completionRate} 
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Average Time per Question</Typography>
                  <Stack spacing={2}>
                    {form.questions.map(question => {
                      const avgTime = behavioralAnalysis.averageTimePerQuestion[question.id] || 0
                      return (
                        <Box key={question.id}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                              {question.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {avgTime.toFixed(1)}s average
                            </Typography>
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(avgTime * 2, 100)} 
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info">No behavioral analysis data available.</Alert>
        )}
      </TabPanel>
    </Box>
  )
}
