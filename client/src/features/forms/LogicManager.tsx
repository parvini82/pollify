import { useState } from 'react'
import { http, errMsg } from '../../api/https'
import type { Form, LogicRule, VisibilityRule, NavigationRule, ConditionalAction, ConditionalOperator } from '../../types'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Chip,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Navigation as NavigationIcon } from '@mui/icons-material'

interface LogicManagerProps {
  open: boolean
  onClose: () => void
  form: Form | null
  onFormUpdate: () => void
}

export default function LogicManager({ open, onClose, form, onFormUpdate }: LogicManagerProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [editingRule, setEditingRule] = useState<Partial<LogicRule> | null>(null)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [ruleType, setRuleType] = useState<'VISIBILITY' | 'NAVIGATION'>('VISIBILITY')

  const [newRule, setNewRule] = useState<Partial<LogicRule>>({
    dependsOnQuestionId: '',
    operator: 'EQUALS',
    value: '',
    order: 0
  })

  const openAddRuleDialog = (type: 'VISIBILITY' | 'NAVIGATION') => {
    setRuleType(type)
    setNewRule({
      type,
      dependsOnQuestionId: '',
      operator: 'EQUALS',
      value: '',
      order: 0,
      ...(type === 'VISIBILITY' ? { showQuestion: true } : { action: 'GO_TO' })
    })
    setRuleDialogOpen(true)
  }

  const editRule = (rule: LogicRule) => {
    setEditingRule(rule)
    setRuleType(rule.type)
    setNewRule(rule)
    setRuleDialogOpen(true)
  }

  const saveRule = async () => {
    if (!form?.id || !newRule.dependsOnQuestionId || !newRule.operator || !newRule.value) {
      alert('Please fill in all required fields')
      return
    }

    try {
      if (editingRule?.id) {
        await http.patch(`/api/forms/${form.id}/logic-rules/${editingRule.id}`, newRule)
      } else {
        await http.post(`/api/forms/${form.id}/logic-rules`, newRule)
      }
      setRuleDialogOpen(false)
      setEditingRule(null)
      onFormUpdate()
    } catch (e) {
      alert(errMsg(e))
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!form?.id || !confirm('Delete this logic rule?')) return
    try {
      await http.delete(`/api/forms/${form.id}/logic-rules/${ruleId}`)
      onFormUpdate()
    } catch (e) {
      alert(errMsg(e))
    }
  }

  const visibilityRules = form?.logicRules?.filter(rule => rule.type === 'VISIBILITY') || []
  const navigationRules = form?.logicRules?.filter(rule => rule.type === 'NAVIGATION') || []

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Logic Manager</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                onClick={() => openAddRuleDialog('VISIBILITY')}
                startIcon={<VisibilityIcon />}
                variant="outlined"
                size="small"
              >
                Add Visibility Rule
              </Button>
              <Button
                onClick={() => openAddRuleDialog('NAVIGATION')}
                startIcon={<NavigationIcon />}
                variant="outlined"
                size="small"
              >
                Add Navigation Rule
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Visibility Rules (${visibilityRules.length})`} />
            <Tab label={`Navigation Rules (${navigationRules.length})`} />
          </Tabs>

          {activeTab === 0 && (
            <Stack spacing={2}>
              <Typography variant="h6">Visibility Rules</Typography>
              <Typography variant="body2" color="text.secondary">
                Control which questions are shown or hidden based on answers to other questions.
              </Typography>
              
              {visibilityRules.length === 0 ? (
                <Alert severity="info">
                  No visibility rules defined. Click "Add Visibility Rule" to create one.
                </Alert>
              ) : (
                <List>
                  {visibilityRules.map((rule) => {
                    const dependsOnQuestion = form?.questions.find(q => q.id === rule.dependsOnQuestionId)
                    const subjectQuestion = form?.questions.find(q => q.id === rule.subjectQuestionId)
                    return (
                      <ListItem key={rule.id} divider>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body1">
                                <strong>If</strong> "{dependsOnQuestion?.title}" {rule.operator.toLowerCase()} "{rule.value}"
                              </Typography>
                              <Chip 
                                label={rule.showQuestion ? "Show" : "Hide"} 
                                color={rule.showQuestion ? "success" : "error"}
                                size="small"
                              />
                              <Typography variant="body1">
                                <strong>then</strong> "{subjectQuestion?.title}"
                              </Typography>
                            </Stack>
                          }
                          secondary={`Order: ${rule.order}`}
                        />
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            <IconButton onClick={() => editRule(rule)} size="small">
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => deleteRule(rule.id)} size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </ListItemSecondaryAction>
                      </ListItem>
                    )
                  })}
                </List>
              )}
            </Stack>
          )}

          {activeTab === 1 && (
            <Stack spacing={2}>
              <Typography variant="h6">Navigation Rules</Typography>
              <Typography variant="body2" color="text.secondary">
                Control survey flow by jumping to specific questions or ending the survey based on answers.
              </Typography>
              
              {navigationRules.length === 0 ? (
                <Alert severity="info">
                  No navigation rules defined. Click "Add Navigation Rule" to create one.
                </Alert>
              ) : (
                <List>
                  {navigationRules.map((rule) => {
                    const dependsOnQuestion = form?.questions.find(q => q.id === rule.dependsOnQuestionId)
                    const fromQuestion = form?.questions.find(q => q.id === rule.fromQuestionId)
                    const targetQuestion = rule.targetQuestionId ? form?.questions.find(q => q.id === rule.targetQuestionId) : null
                    return (
                      <ListItem key={rule.id} divider>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="body1">
                                <strong>After</strong> "{fromQuestion?.title}" <strong>if</strong> "{dependsOnQuestion?.title}" {rule.operator.toLowerCase()} "{rule.value}"
                              </Typography>
                              <Chip 
                                label={rule.action.toLowerCase().replace('_', ' ')} 
                                color="primary"
                                size="small"
                              />
                              {targetQuestion && (
                                <Typography variant="body1">
                                  <strong>then go to</strong> "{targetQuestion.title}"
                                </Typography>
                              )}
                            </Stack>
                          }
                          secondary={`Order: ${rule.order}`}
                        />
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            <IconButton onClick={() => editRule(rule)} size="small">
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => deleteRule(rule.id)} size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </ListItemSecondaryAction>
                      </ListItem>
                    )
                  })}
                </List>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Rule Editor Dialog */}
      <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRule ? 'Edit Rule' : 'Add Rule'} - {ruleType === 'VISIBILITY' ? 'Visibility' : 'Navigation'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              select
              label="Depends on Question"
              value={newRule.dependsOnQuestionId || ''}
              onChange={(e) => setNewRule({...newRule, dependsOnQuestionId: e.target.value})}
              fullWidth
              required
            >
              {form?.questions.map(q => (
                <MenuItem key={q.id} value={q.id}>
                  Q{form.questions.findIndex(question => question.id === q.id)! + 1}: {q.title}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Operator"
              value={newRule.operator || ''}
              onChange={(e) => setNewRule({...newRule, operator: e.target.value as ConditionalOperator})}
              fullWidth
              required
            >
              <MenuItem value="EQUALS">Equals</MenuItem>
              <MenuItem value="NOT_EQUALS">Not Equals</MenuItem>
              <MenuItem value="CONTAINS">Contains</MenuItem>
              <MenuItem value="GREATER_THAN">Greater Than</MenuItem>
              <MenuItem value="LESS_THAN">Less Than</MenuItem>
            </TextField>

            <TextField
              label="Value"
              value={newRule.value || ''}
              onChange={(e) => setNewRule({...newRule, value: e.target.value})}
              fullWidth
              required
            />

            {ruleType === 'VISIBILITY' ? (
              <>
                <TextField
                  select
                  label="Target Question"
                  value={(newRule as VisibilityRule).subjectQuestionId || ''}
                  onChange={(e) => setNewRule({...newRule, subjectQuestionId: e.target.value})}
                  fullWidth
                  required
                >
                  {form?.questions.map(q => (
                    <MenuItem key={q.id} value={q.id}>
                      Q{form.questions.findIndex(question => question.id === q.id)! + 1}: {q.title}
                    </MenuItem>
                  ))}
                </TextField>
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={(newRule as VisibilityRule).showQuestion ?? true}
                      onChange={(e) => setNewRule({...newRule, showQuestion: e.target.checked})}
                    />
                  }
                  label="Show question when condition is met"
                />
              </>
            ) : (
              <>
                <TextField
                  select
                  label="From Question"
                  value={(newRule as NavigationRule).fromQuestionId || ''}
                  onChange={(e) => setNewRule({...newRule, fromQuestionId: e.target.value})}
                  fullWidth
                  required
                >
                  {form?.questions.map(q => (
                    <MenuItem key={q.id} value={q.id}>
                      Q{form.questions.findIndex(question => question.id === q.id)! + 1}: {q.title}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  select
                  label="Action"
                  value={(newRule as NavigationRule).action || 'GO_TO'}
                  onChange={(e) => setNewRule({...newRule, action: e.target.value as ConditionalAction})}
                  fullWidth
                  required
                >
                  <MenuItem value="GO_TO">Go to Question</MenuItem>
                  <MenuItem value="SKIP_TO">Skip to Question</MenuItem>
                  <MenuItem value="END_SURVEY">End Survey</MenuItem>
                </TextField>
                
                {((newRule as NavigationRule).action === 'GO_TO' || (newRule as NavigationRule).action === 'SKIP_TO') && (
                  <TextField
                    select
                    label="Target Question"
                    value={(newRule as NavigationRule).targetQuestionId || ''}
                    onChange={(e) => setNewRule({...newRule, targetQuestionId: e.target.value})}
                    fullWidth
                    required
                  >
                    {form?.questions.map(q => (
                      <MenuItem key={q.id} value={q.id}>
                        Q{form.questions.findIndex(question => question.id === q.id)! + 1}: {q.title}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </>
            )}

            <TextField
              type="number"
              label="Rule Order"
              value={newRule.order || 0}
              onChange={(e) => setNewRule({...newRule, order: parseInt(e.target.value) || 0})}
              fullWidth
              helperText="Order of evaluation (lower numbers are evaluated first)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveRule} variant="contained">
            {editingRule ? 'Update' : 'Add'} Rule
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
