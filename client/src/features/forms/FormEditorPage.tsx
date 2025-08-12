import { useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { http, errMsg } from '../../api/https'
import type { Form, Question, ConditionalLogic } from '../../types'
import { 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  MenuItem, 
  Stack, 
  TextField, 
  Typography,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Box,
  Divider,
  Alert
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Settings as SettingsIcon } from '@mui/icons-material'

export default function FormEditorPage() {
  const { id } = useParams()
  const [form, setForm] = useState<Form | null>(null)
  const [qTitle, setQTitle] = useState('')
  const [qType, setQType] = useState<'TEXT'|'MULTIPLE_CHOICE'|'RATING'>('TEXT')
  const [qOrder, setQOrder] = useState(0)
  const [qRequired, setQRequired] = useState(false)
  const [qMinRating, setQMinRating] = useState(1)
  const [qMaxRating, setQMaxRating] = useState(5)
  const [qRatingLabels, setQRatingLabels] = useState('')
  
  // Multiple choice options
  const [qChoices, setQChoices] = useState<string[]>([''])
  
  // Conditional logic dialog
  const [conditionalDialogOpen, setConditionalDialogOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [conditionalLogic, setConditionalLogic] = useState<Partial<ConditionalLogic>>({})

  const refresh = async () => {
    try { 
      const { data } = await http.get(`/api/forms/${id}`)
      setForm(data) 
    }
    catch (e) { alert(errMsg(e)) }
  }
  
  useEffect(()=>{ if(id) refresh() }, [id])
  
  // Initialize choices when question type changes
  useEffect(() => {
    if (qType === 'MULTIPLE_CHOICE') {
      setQChoices(['', '']) // Start with 2 empty options
    } else {
      setQChoices([''])
    }
  }, [qType])

  const addQuestion = async () => {
    if (!id || !qTitle.trim()) return
    
    // Validate multiple choice questions have choices
    if (qType === 'MULTIPLE_CHOICE') {
      const validChoices = qChoices.filter(choice => choice.trim() !== '')
      if (validChoices.length < 2) {
        alert('Multiple choice questions must have at least 2 choices')
        return
      }
    }
    
    const questionData: any = { 
      title: qTitle, 
      type: qType, 
      order: Number(qOrder), 
      required: qRequired 
    }
    
    if (qType === 'RATING') {
      questionData.minRating = qMinRating
      questionData.maxRating = qMaxRating
      questionData.ratingLabels = qRatingLabels
    }
    
    try { 
      const response = await http.post(`/api/forms/${id}/questions`, questionData)
      const questionId = response.data.id
      
      // If it's a multiple choice question, create the choices
      if (qType === 'MULTIPLE_CHOICE') {
        const validChoices = qChoices.filter(choice => choice.trim() !== '')
        for (let i = 0; i < validChoices.length; i++) {
          const choice = validChoices[i]
          await http.post(`/api/questions/${questionId}/choices`, {
            label: choice,
            value: choice.toLowerCase().replace(/\s+/g, '_'),
            order: i + 1
          })
        }
      }
      
      // Reset form
      setQTitle('')
      setQType('TEXT')
      setQOrder(0)
      setQRequired(false)
      setQMinRating(1)
      setQMaxRating(5)
      setQRatingLabels('')
      setQChoices([''])
      refresh() 
    }
    catch (e) { alert(errMsg(e)) }
  }
  
  const delQuestion = async (qid: string) => { 
    if (!confirm('Delete question?')) return
    await http.delete(`/api/questions/${qid}`)
    refresh() 
  }
  
  const addChoice = async (qid: string) => {
    const label = prompt('Choice label?')
    if(!label) return
    const value = prompt('Choice value?', label) || label
    const order = Number(prompt('Choice order?', '0') || 0)
    await http.post(`/api/questions/${qid}/choices`, { label, value, order })
    refresh()
  }
  
  const addNewChoiceOption = () => {
    setQChoices([...qChoices, ''])
  }
  
  const removeChoiceOption = (index: number) => {
    if (qChoices.length > 1) {
      const newChoices = qChoices.filter((_, i) => i !== index)
      setQChoices(newChoices)
    }
  }
  
  const updateChoiceOption = (index: number, value: string) => {
    const newChoices = [...qChoices]
    newChoices[index] = value
    setQChoices(newChoices)
  }
  
  const delChoice = async (cid: string) => { 
    if (!confirm('Delete choice?')) return
    await http.delete(`/api/choices/${cid}`)
    refresh() 
  }

  const updateFormSettings = async (settings: Partial<Form>) => {
    if (!id) return
    try {
      await http.patch(`/api/forms/${id}`, settings)
      refresh()
    } catch (e) { alert(errMsg(e)) }
  }

  const openConditionalDialog = (question: Question) => {
    setSelectedQuestion(question)
    setConditionalLogic(question.conditionalLogic || {})
    setConditionalDialogOpen(true)
  }

  const saveConditionalLogic = async () => {
    if (!selectedQuestion) return
    try {
      if (conditionalLogic.id) {
        await http.patch(`/api/conditional-logic/${conditionalLogic.id}`, conditionalLogic)
      } else {
        await http.post(`/api/questions/${selectedQuestion.id}/conditional-logic`, conditionalLogic)
      }
      setConditionalDialogOpen(false)
      refresh()
    } catch (e) { alert(errMsg(e)) }
  }

  if (!form) return null

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">{form.title}</Typography>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to={`/forms/${id}/fill`} variant="outlined">Preview Form</Button>
          <Button component={RouterLink} to={`/forms/${id}/results`} variant="contained">View Results</Button>
        </Stack>
      </Stack>

      {/* Form Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Form Settings</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Max Responses" 
                type="number"
                value={form.maxResponses || ''}
                onChange={(e) => updateFormSettings({ maxResponses: e.target.value ? parseInt(e.target.value) : null })}
                fullWidth 
                helperText="Leave empty for unlimited responses"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={form.allowMultipleResponses}
                    onChange={(e) => updateFormSettings({ allowMultipleResponses: e.target.checked })}
                  />
                }
                label="Allow multiple responses from same participant"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Add Question */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Add Question</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Question Title" 
                value={qTitle} 
                onChange={e=>setQTitle(e.target.value)} 
                fullWidth 
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField 
                select 
                label="Type" 
                value={qType} 
                onChange={(e) => {
                  const newType = e.target.value as any
                  setQType(newType)
                  // Reset choices when switching to multiple choice
                  if (newType === 'MULTIPLE_CHOICE') {
                    setQChoices(['', '']) // Start with 2 empty options
                  } else {
                    setQChoices([''])
                  }
                }} 
                fullWidth
              >
                <MenuItem value="TEXT">Text</MenuItem>
                <MenuItem value="MULTIPLE_CHOICE">Multiple Choice</MenuItem>
                <MenuItem value="RATING">Rating</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField 
                type="number" 
                label="Order" 
                value={qOrder} 
                onChange={e=>setQOrder(parseInt(e.target.value||'0'))} 
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={qRequired}
                    onChange={(e) => setQRequired(e.target.checked)}
                  />
                }
                label="Required"
              />
            </Grid>
            
            {qType === 'RATING' && (
              <>
                <Grid item xs={6} md={3}>
                  <TextField 
                    type="number" 
                    label="Min Rating" 
                    value={qMinRating} 
                    onChange={e=>setQMinRating(parseInt(e.target.value||'1'))} 
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField 
                    type="number" 
                    label="Max Rating" 
                    value={qMaxRating} 
                    onChange={e=>setQMaxRating(parseInt(e.target.value||'5'))} 
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Rating Labels (comma-separated)" 
                    value={qRatingLabels} 
                    onChange={e=>setQRatingLabels(e.target.value)} 
                    fullWidth
                    helperText="e.g., Poor, Fair, Good, Very Good, Excellent"
                  />
                </Grid>
              </>
            )}
            
            {qType === 'MULTIPLE_CHOICE' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Multiple Choice Options</Typography>
                <Stack spacing={1}>
                  {qChoices.map((choice, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center">
                      <TextField
                        label={`Option ${index + 1}`}
                        value={choice}
                        onChange={(e) => updateChoiceOption(index, e.target.value)}
                        fullWidth
                        size="small"
                      />
                      {qChoices.length > 1 && (
                        <IconButton
                          onClick={() => removeChoiceOption(index)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Stack>
                  ))}
                  <Button
                    onClick={addNewChoiceOption}
                    startIcon={<AddIcon />}
                    size="small"
                    variant="outlined"
                  >
                    Add Option
                  </Button>
                </Stack>
              </Grid>
            )}
          </Grid>
          <Stack sx={{ mt: 2 }}>
            <Button variant="contained" onClick={addQuestion} startIcon={<AddIcon />}>
              Add Question
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Questions ({form.questions?.length || 0})</Typography>
          <Stack spacing={2}>
            {form.questions?.map(q=>(
              <Card key={q.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="h6">{q.title}</Typography>
                        <Chip label={q.type} size="small" color="primary" />
                        {q.required && <Chip label="Required" size="small" color="error" />}
                        {q.conditionalLogic && <Chip label="Conditional" size="small" color="secondary" />}
                      </Stack>
                      
                      {q.type === 'RATING' && (
                        <Typography variant="body2" color="text.secondary">
                          Rating scale: {q.minRating} - {q.maxRating}
                          {q.ratingLabels && ` (${q.ratingLabels})`}
                        </Typography>
                      )}
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        onClick={() => openConditionalDialog(q)}
                        color="primary"
                        size="small"
                      >
                        <SettingsIcon />
                      </IconButton>
                      <IconButton 
                        onClick={()=>delQuestion(q.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {q.type==='MULTIPLE_CHOICE' && (
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Choices</Typography>
                        <Button 
                          onClick={()=>addChoice(q.id)}
                          size="small"
                          startIcon={<AddIcon />}
                        >
                          Add Choice
                        </Button>
                      </Stack>
                      <Stack spacing={1}>
                        {q.choices?.map(c=>(
                          <Stack 
                            key={c.id} 
                            direction="row" 
                            justifyContent="space-between" 
                            alignItems="center" 
                            sx={{ 
                              border:'1px solid #eee', 
                              p: 1, 
                              borderRadius: 1,
                              backgroundColor: '#fafafa'
                            }}
                          >
                            <Typography>
                              {c.label} <span style={{color:'#999'}}>({c.value})</span>
                            </Typography>
                            <IconButton 
                              onClick={()=>delChoice(c.id)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Conditional Logic Dialog */}
      <Dialog open={conditionalDialogOpen} onClose={() => setConditionalDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Conditional Logic</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This question will be shown/hidden based on the answer to another question.
            </Typography>
            
            <TextField
              select
              label="Depends on Question"
              value={conditionalLogic.dependsOnQuestionId || ''}
              onChange={(e) => setConditionalLogic({...conditionalLogic, dependsOnQuestionId: e.target.value})}
              fullWidth
            >
              {form.questions?.filter(q => q.id !== selectedQuestion?.id).map(q => (
                <MenuItem key={q.id} value={q.id}>{q.title}</MenuItem>
              ))}
            </TextField>
            
            <TextField
              select
              label="Operator"
              value={conditionalLogic.operator || ''}
              onChange={(e) => setConditionalLogic({...conditionalLogic, operator: e.target.value as any})}
              fullWidth
            >
              <MenuItem value="EQUALS">Equals</MenuItem>
              <MenuItem value="NOT_EQUALS">Not Equals</MenuItem>
              <MenuItem value="CONTAINS">Contains</MenuItem>
              <MenuItem value="GREATER_THAN">Greater Than</MenuItem>
              <MenuItem value="LESS_THAN">Less Than</MenuItem>
            </TextField>
            
            <TextField
              label="Value"
              value={conditionalLogic.value || ''}
              onChange={(e) => setConditionalLogic({...conditionalLogic, value: e.target.value})}
              fullWidth
              helperText="The value to compare against"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={conditionalLogic.showQuestion ?? true}
                  onChange={(e) => setConditionalLogic({...conditionalLogic, showQuestion: e.target.checked})}
                />
              }
              label="Show question when condition is met"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConditionalDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveConditionalLogic} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
