import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { http, errMsg } from '../../api/https'
import type { Form, Question, ResponseItem } from '../../types'
import { 
  Button, 
  Card, 
  CardContent, 
  Stack, 
  TextField, 
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Rating,
  Box,
  LinearProgress,
  Alert,
  Chip,
  Paper,
  Divider
} from '@mui/material'
import { 
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Timer as TimerIcon
} from '@mui/icons-material'

export default function PublicFillPage() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({})
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [timeSpent, setTimeSpent] = useState<{ [questionId: string]: number }>({})
  const [answerChanges, setAnswerChanges] = useState<{ [questionId: string]: number }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (formId) {
      loadForm()
    }
  }, [formId])

  useEffect(() => {
    // Start timer for current question
    setQuestionStartTime(Date.now())
    
    // Clear previous timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Start new timer
    timerRef.current = setInterval(() => {
      const currentQuestion = form?.questions[currentQuestionIndex]
      if (currentQuestion) {
        const timeSpentOnQuestion = Math.floor((Date.now() - questionStartTime) / 1000)
        setTimeSpent(prev => ({
          ...prev,
          [currentQuestion.id]: timeSpentOnQuestion
        }))
      }
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentQuestionIndex, form?.questions])

  const loadForm = async () => {
    try {
      setLoading(true)
      const { data } = await http.get(`/api/forms/${formId}`)
      setForm(data)
      
      // Check if form has reached max responses
      if (data.maxResponses && data._count?.responses >= data.maxResponses) {
        setError('This form has reached the maximum number of responses.')
        return
      }
      
      // Check if user has already submitted (if not allowing multiple responses)
      if (!data.allowMultipleResponses) {
        const clientIp = await getClientIP()
        const existingResponse = await http.get(`/api/forms/${formId}/responses/check`, {
          params: { clientIp }
        })
        if (existingResponse.data.exists) {
          setError('You have already submitted a response to this form.')
          return
        }
      }
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  const getVisibleQuestions = (): Question[] => {
    if (!form?.questions) return []
    
    return form.questions.filter((question, index) => {
      if (!question.conditionalLogic) return true
      
      const logic = question.conditionalLogic
      const dependsOnAnswer = answers[logic.dependsOnQuestionId]
      
      if (!dependsOnAnswer) return logic.showQuestion
      
      let conditionMet = false
      switch (logic.operator) {
        case 'EQUALS':
          conditionMet = dependsOnAnswer === logic.value
          break
        case 'NOT_EQUALS':
          conditionMet = dependsOnAnswer !== logic.value
          break
        case 'CONTAINS':
          conditionMet = String(dependsOnAnswer).includes(logic.value)
          break
        case 'GREATER_THAN':
          conditionMet = Number(dependsOnAnswer) > Number(logic.value)
          break
        case 'LESS_THAN':
          conditionMet = Number(dependsOnAnswer) < Number(logic.value)
          break
      }
      
      return logic.showQuestion ? conditionMet : !conditionMet
    })
  }

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: value }
      
      // Track answer changes
      if (prev[questionId] !== undefined && prev[questionId] !== value) {
        setAnswerChanges(prevChanges => ({
          ...prevChanges,
          [questionId]: (prevChanges[questionId] || 0) + 1
        }))
      }
      
      return newAnswers
    })
  }

  const nextQuestion = () => {
    const visibleQuestions = getVisibleQuestions()
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const canProceed = (): boolean => {
    const visibleQuestions = getVisibleQuestions()
    const currentQuestion = visibleQuestions[currentQuestionIndex]
    
    if (!currentQuestion?.required) return true
    
    const answer = answers[currentQuestion.id]
    if (!answer) return false
    
    if (currentQuestion.type === 'MULTIPLE_CHOICE' && !answer) return false
    if (currentQuestion.type === 'TEXT' && !answer.trim()) return false
    if (currentQuestion.type === 'RATING' && !answer) return false
    
    return true
  }

  const submitForm = async () => {
    try {
      setLoading(true)
      
      const clientIp = await getClientIP()
      const totalTime = Math.floor((Date.now() - startTime) / 1000)
      
      const responseItems: Omit<ResponseItem, 'id'>[] = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        valueText: typeof value === 'string' ? value : undefined,
        valueChoiceId: typeof value === 'string' && value.includes('choice_') ? value : undefined,
        valueRating: typeof value === 'number' ? value : undefined,
        timeSpent: timeSpent[questionId] || 0,
        changedAnswers: answerChanges[questionId] || 0
      }))

      await http.post(`/api/forms/${formId}/responses`, {
        clientIp,
        totalTime,
        items: responseItems
      })
      
      setSubmitted(true)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id]
    
    switch (question.type) {
      case 'TEXT':
        return (
          <TextField
            label="Your answer"
            value={answer || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            multiline
            rows={4}
            fullWidth
            required={question.required}
          />
        )
        
      case 'MULTIPLE_CHOICE':
        return (
          <FormControl component="fieldset" required={question.required}>
            <FormLabel component="legend">Select an option:</FormLabel>
            <RadioGroup
              value={answer || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
            >
              {question.choices?.map((choice) => (
                <FormControlLabel
                  key={choice.id}
                  value={choice.id}
                  control={<Radio />}
                  label={choice.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )
        
      case 'RATING':
        const labels = question.ratingLabels ? question.ratingLabels.split(',').map(l => l.trim()) : []
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Rate from {question.minRating} to {question.maxRating}
            </Typography>
            <Rating
              value={answer || 0}
              onChange={(_, value) => handleAnswer(question.id, value)}
              max={question.maxRating || 5}
              min={question.minRating || 1}
              size="large"
            />
            {labels.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {labels[answer - 1] || ''}
                </Typography>
              </Box>
            )}
          </Box>
        )
        
      default:
        return null
    }
  }

  if (loading && !form) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading form...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={() => navigate('/')} startIcon={<ArrowBackIcon />}>
          Back to Forms
        </Button>
      </Box>
    )
  }

  if (submitted) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>Thank you!</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your response has been submitted successfully.
        </Typography>
        <Button onClick={() => navigate('/')} variant="contained">
          Back to Forms
        </Button>
      </Box>
    )
  }

  if (!form) return null

  const visibleQuestions = getVisibleQuestions()
  const currentQuestion = visibleQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>{form.title}</Typography>
        {form.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {form.description}
          </Typography>
        )}
        
        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Question {currentQuestionIndex + 1} of {visibleQuestions.length}
            </Typography>
            <Chip 
              icon={<TimerIcon />} 
              label={`${Math.floor((Date.now() - startTime) / 1000)}s`} 
              size="small" 
            />
          </Stack>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      </Paper>

      {/* Current Question */}
      {currentQuestion && (
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {currentQuestion.title}
                  {currentQuestion.required && (
                    <span style={{ color: 'red' }}> *</span>
                  )}
                </Typography>
                
                {currentQuestion.conditionalLogic && (
                  <Chip 
                    label="Conditional Question" 
                    size="small" 
                    color="secondary" 
                    sx={{ mb: 1 }} 
                  />
                )}
              </Box>

              {renderQuestion(currentQuestion)}

              {/* Navigation */}
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
                <Button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  startIcon={<ArrowBackIcon />}
                >
                  Previous
                </Button>

                {currentQuestionIndex === visibleQuestions.length - 1 ? (
                  <Button
                    onClick={submitForm}
                    disabled={!canProceed() || loading}
                    variant="contained"
                    endIcon={<CheckIcon />}
                  >
                    {loading ? 'Submitting...' : 'Submit'}
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    disabled={!canProceed()}
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Next
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
