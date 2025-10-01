import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  LinearProgress,
  Collapse,
  Alert,
  Stack,
} from '@mui/material'
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Security as SecurityIcon,
  Terminal as TerminalIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  AutoFixHigh as AutoFixHighIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth.tsx'

// Types für den LLM Assistant
interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: Date
  metadata?: {
    toolCall?: string
    executionTime?: number
    verbosityLevel?: number
    debugInfo?: any
    status?: 'pending' | 'executing' | 'completed' | 'error'
  }
}

interface ToolExecution {
  id: string
  name: string
  parameters: any
  status: 'pending' | 'executing' | 'completed' | 'error'
  output?: string
  executionTime?: number
  verbosityLevel: number
}

interface ActiveOperation {
  id: string
  name: string
  type: 'scan' | 'analysis' | 'toolchain' | 'investigation'
  status: 'planning' | 'executing' | 'monitoring' | 'completed' | 'error'
  progress: number
  tools: string[]
  startTime: Date
  estimatedDuration?: number
}

const Assistant: React.FC = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Sunzi Cerebro LLM Assistant initialisiert. Bereit für Security Operations!',
      timestamp: new Date(),
      metadata: { status: 'completed' }
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [verbosityLevel, setVerbosityLevel] = useState(1)
  const [debugMode, setDebugMode] = useState(false)
  const [autoExecute, setAutoExecute] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  const [activeOperations, setActiveOperations] = useState<ActiveOperation[]>([
    {
      id: 'op-1',
      name: 'Network Security Assessment',
      type: 'scan',
      status: 'executing',
      progress: 67,
      tools: ['nmap', 'nuclei', 'dirb'],
      startTime: new Date(Date.now() - 300000), // 5 minutes ago
      estimatedDuration: 600 // 10 minutes
    }
  ])
  const [expandedOperations, setExpandedOperations] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsProcessing(true)

    // Simuliere LLM-Antwort und Tool-Orchestrierung
    setTimeout(() => {
      const assistantResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: `Ich verstehe deine Anfrage: "${inputMessage}". Basierend auf deiner Eingabe plane ich eine mehrstufige Security-Operation:\n\n🎯 **Geplante Aktionen:**\n1. Target-Analyse mit Nmap\n2. Vulnerability-Scan mit Nuclei\n3. Directory-Enumeration mit Dirb\n4. Report-Generierung\n\n⚙️ **Konfiguration:**\n- Verbosity Level: ${verbosityLevel}\n- Debug Mode: ${debugMode ? 'Aktiviert' : 'Deaktiviert'}\n- Auto-Execute: ${autoExecute ? 'Aktiviert' : 'Deaktiviert'}\n\nSoll ich mit der Ausführung beginnen?`,
        timestamp: new Date(),
        metadata: {
          verbosityLevel,
          status: 'completed'
        }
      }

      setMessages(prev => [...prev, assistantResponse])
      setIsProcessing(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleOperationExpanded = (operationId: string) => {
    setExpandedOperations(prev =>
      prev.includes(operationId)
        ? prev.filter(id => id !== operationId)
        : [...prev, operationId]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'info'
      case 'executing': return 'primary'
      case 'monitoring': return 'warning'
      case 'completed': return 'success'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <SettingsIcon />
      case 'executing': return <PlayArrowIcon />
      case 'monitoring': return <TrendingUpIcon />
      case 'completed': return <CheckCircleIcon />
      case 'error': return <ErrorIcon />
      default: return <PauseIcon />
    }
  }

  const quickCommands = [
    { label: 'Port Scan', command: 'Führe einen Port-Scan für 192.168.1.1 durch' },
    { label: 'Vulnerability Assessment', command: 'Starte eine Vulnerability-Bewertung für example.com' },
    { label: 'Network Discovery', command: 'Erkunde das Netzwerk 192.168.1.0/24' },
    { label: 'Web App Test', command: 'Teste die Web-Anwendung https://target.com auf Sicherheitslücken' },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
          <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          LLM Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary">
          KI-gestützter Security Orchestrator für intelligente Pentesting-Operationen und Tool-Management.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Chat Interface */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {/* Messages Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: message.type === 'user' ? 'primary.main' : 
                               message.type === 'assistant' ? 'secondary.main' :
                               message.type === 'tool' ? 'warning.main' : 'info.main'
                    }}
                  >
                    {message.type === 'user' ? user?.username?.[0]?.toUpperCase() :
                     message.type === 'assistant' ? <PsychologyIcon /> :
                     message.type === 'tool' ? <TerminalIcon /> : <SecurityIcon />}
                  </Avatar>
                  
                  <Card
                    sx={{
                      maxWidth: '70%',
                      bgcolor: message.type === 'user' ? 'primary.light' : 'background.paper',
                      color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                        {message.content}
                      </Typography>
                      
                      {message.metadata && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {message.metadata.toolCall && (
                            <Chip size="small" icon={<TerminalIcon />} label={message.metadata.toolCall} />
                          )}
                          {message.metadata.executionTime && (
                            <Chip size="small" label={`${message.metadata.executionTime}ms`} />
                          )}
                          {message.metadata.status && (
                            <Chip 
                              size="small" 
                              color={getStatusColor(message.metadata.status)}
                              label={message.metadata.status} 
                            />
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))}
              
              {isProcessing && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <PsychologyIcon />
                  </Avatar>
                  <Card sx={{ minWidth: 200 }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="body2" color="text.secondary">
                        KI analysiert und plant Operation...
                      </Typography>
                      <LinearProgress sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Quick Commands */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {quickCommands.map((cmd, index) => (
                  <Chip
                    key={index}
                    label={cmd.label}
                    variant="outlined"
                    size="small"
                    onClick={() => setInputMessage(cmd.command)}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Beschreibe deine Security-Operation oder stelle eine Frage..."
                  variant="outlined"
                  disabled={isProcessing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isProcessing}
                  sx={{ minWidth: 100, borderRadius: 2 }}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Control Panel & Active Operations */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Control Panel */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                KI-Konfiguration
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>LLM-Model</InputLabel>
                <Select
                  value={selectedModel}
                  label="LLM-Model"
                  onChange={(e) => setSelectedModel(e.target.value)}
                  size="small"
                >
                  <MenuItem value="gpt-4">GPT-4 (Empfohlen)</MenuItem>
                  <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                  <MenuItem value="claude-3">Claude 3</MenuItem>
                  <MenuItem value="local-model">Local Model</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Verbosity Level</InputLabel>
                <Select
                  value={verbosityLevel}
                  label="Verbosity Level"
                  onChange={(e) => setVerbosityLevel(Number(e.target.value))}
                  size="small"
                >
                  <MenuItem value={0}>Silent (0)</MenuItem>
                  <MenuItem value={1}>Minimal (1)</MenuItem>
                  <MenuItem value={2}>Standard (2)</MenuItem>
                  <MenuItem value={3}>Verbose (3)</MenuItem>
                  <MenuItem value={4}>Debug (4)</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={debugMode}
                    onChange={(e) => setDebugMode(e.target.checked)}
                  />
                }
                label="Debug-Modus"
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={autoExecute}
                    onChange={(e) => setAutoExecute(e.target.checked)}
                  />
                }
                label="Auto-Execute"
                sx={{ mb: 1 }}
              />
            </Paper>

            {/* Active Operations */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Aktive Operationen
              </Typography>

              {activeOperations.length === 0 ? (
                <Alert severity="info">
                  Keine aktiven Operationen
                </Alert>
              ) : (
                <List sx={{ p: 0 }}>
                  {activeOperations.map((operation) => (
                    <React.Fragment key={operation.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${getStatusColor(operation.status)}.main` }}>
                            {getStatusIcon(operation.status)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {operation.name}
                              </Typography>
                              <Chip
                                size="small"
                                color={getStatusColor(operation.status)}
                                label={operation.status}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Tools: {operation.tools.join(', ')}
                              </Typography>
                              {operation.status === 'executing' && (
                                <LinearProgress
                                  variant="determinate"
                                  value={operation.progress}
                                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                                />
                              )}
                            </Box>
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={() => toggleOperationExpanded(operation.id)}
                        >
                          {expandedOperations.includes(operation.id) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </ListItem>
                      
                      <Collapse in={expandedOperations.includes(operation.id)}>
                        <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Gestartet: {operation.startTime.toLocaleTimeString()}
                          </Typography>
                          {operation.estimatedDuration && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Geschätzte Dauer: {Math.round(operation.estimatedDuration / 60)} Minuten
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1}>
                            <Button size="small" startIcon={<PauseIcon />}>
                              Pausieren
                            </Button>
                            <Button size="small" startIcon={<StopIcon />} color="error">
                              Stoppen
                            </Button>
                          </Stack>
                        </Box>
                      </Collapse>
                      
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Assistant