/**
 * 🧠 AI-POWERED TOOL RECOMMENDATIONS COMPONENT
 * Enterprise-Grade Intelligent Security Tool Suggestions
 * Machine Learning Integration with Advanced Context Analysis
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Psychology as AIIcon,
  ExpandMore as ExpandIcon,
  TrendingUp as TrendingIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  GpsFixed as TargetIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PlayArrow as ExecuteIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon
} from '@mui/icons-material'
import { McpTool } from '../../services/mcpApi'
import {
  aiRecommendationEngine,
  RecommendationContext,
  ToolRecommendation
} from '../../services/aiRecommendationEngine'

interface AIRecommendationsProps {
  availableTools: McpTool[]
  onToolSelect?: (tool: McpTool, context: RecommendationContext) => void
  onExecute?: (tool: McpTool, recommendations: ToolRecommendation) => void
  previousTools?: string[]
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  availableTools,
  onToolSelect,
  onExecute,
  previousTools = []
}) => {
  // State Management
  const [context, setContext] = useState<RecommendationContext>({
    objective: 'reconnaissance',
    targetType: 'network',
    riskTolerance: 'medium',
    timeConstraint: 'standard',
    skillLevel: 'intermediate',
    previousTools,
    environment: 'test'
  })

  const [recommendations, setRecommendations] = useState<ToolRecommendation[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<ToolRecommendation | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  /**
   * Generate AI recommendations
   */
  const generateRecommendations = useCallback(async () => {
    if (availableTools.length === 0) return

    setIsGenerating(true)
    try {
      console.log('🧠 Generating AI recommendations with context:', context)

      const aiRecommendations = await aiRecommendationEngine.getRecommendations(
        context,
        availableTools
      )

      setRecommendations(aiRecommendations)
      console.log(`✨ Generated ${aiRecommendations.length} AI recommendations`)

    } catch (error) {
      console.error('❌ Failed to generate AI recommendations:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [context, availableTools])

  /**
   * Auto-generate recommendations when context changes
   */
  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  /**
   * Handle context parameter changes
   */
  const handleContextChange = (field: keyof RecommendationContext, value: any) => {
    setContext(prev => ({
      ...prev,
      [field]: value
    }))
  }

  /**
   * Handle tool selection
   */
  const handleToolSelect = (recommendation: ToolRecommendation) => {
    setSelectedRecommendation(recommendation)

    if (onToolSelect) {
      onToolSelect(recommendation.tool, context)
    }

    // Record selection for AI learning
    aiRecommendationEngine.recordSelection(context, recommendation.tool, 'success')
  }

  /**
   * Handle tool execution
   */
  const handleExecute = (recommendation: ToolRecommendation) => {
    if (onExecute) {
      onExecute(recommendation.tool, recommendation)
    }
  }

  /**
   * Get risk color
   */
  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#9c27b0'
    }
    return colors[level] || '#757575'
  }

  /**
   * Get confidence color
   */
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4caf50'
    if (confidence >= 0.6) return '#ff9800'
    return '#f44336'
  }

  /**
   * Render context configuration
   */
  const renderContextConfiguration = () => (
    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AIIcon sx={{ mr: 1, color: 'white' }} />
          <Typography variant="h6" sx={{ color: 'white', flexGrow: 1 }}>
            AI Context Configuration
          </Typography>
          <Button
            variant="outlined"
            onClick={generateRecommendations}
            disabled={isGenerating}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            {isGenerating ? 'Analyzing...' : 'Generate'}
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'white' }}>Objective</InputLabel>
              <Select
                value={context.objective}
                onChange={(e) => handleContextChange('objective', e.target.value)}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
              >
                <MenuItem value="reconnaissance">Reconnaissance</MenuItem>
                <MenuItem value="vulnerability_scanning">Vulnerability Scanning</MenuItem>
                <MenuItem value="exploitation">Exploitation</MenuItem>
                <MenuItem value="post_exploitation">Post-Exploitation</MenuItem>
                <MenuItem value="analysis">Analysis</MenuItem>
                <MenuItem value="reporting">Reporting</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'white' }}>Target Type</InputLabel>
              <Select
                value={context.targetType}
                onChange={(e) => handleContextChange('targetType', e.target.value)}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
              >
                <MenuItem value="web_application">Web Application</MenuItem>
                <MenuItem value="network">Network</MenuItem>
                <MenuItem value="host">Host</MenuItem>
                <MenuItem value="database">Database</MenuItem>
                <MenuItem value="wireless">Wireless</MenuItem>
                <MenuItem value="mobile">Mobile</MenuItem>
                <MenuItem value="cloud">Cloud</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'white' }}>Risk Tolerance</InputLabel>
              <Select
                value={context.riskTolerance}
                onChange={(e) => handleContextChange('riskTolerance', e.target.value)}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'white' }}>Time Constraint</InputLabel>
              <Select
                value={context.timeConstraint}
                onChange={(e) => handleContextChange('timeConstraint', e.target.value)}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
              >
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="extended">Extended</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'white' }}>Skill Level</InputLabel>
              <Select
                value={context.skillLevel}
                onChange={(e) => handleContextChange('skillLevel', e.target.value)}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'white' }}>Environment</InputLabel>
              <Select
                value={context.environment}
                onChange={(e) => handleContextChange('environment', e.target.value)}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
              >
                <MenuItem value="production">Production</MenuItem>
                <MenuItem value="staging">Staging</MenuItem>
                <MenuItem value="development">Development</MenuItem>
                <MenuItem value="test">Test</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  /**
   * Render recommendation card
   */
  const renderRecommendationCard = (recommendation: ToolRecommendation, index: number) => (
    <Card
      key={recommendation.tool.id}
      sx={{
        mb: 2,
        border: selectedRecommendation?.tool.id === recommendation.tool.id ? '2px solid #2196f3' : '1px solid #e0e0e0',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
      onClick={() => handleToolSelect(recommendation)}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" flexGrow={1}>
            <Badge badgeContent={index + 1} color="primary">
              <Avatar sx={{ bgcolor: getRiskColor(recommendation.tool.riskLevel), mr: 2 }}>
                <SecurityIcon />
              </Avatar>
            </Badge>

            <Box flexGrow={1}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {recommendation.tool.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {recommendation.tool.description}
              </Typography>

              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={recommendation.tool.category}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={recommendation.tool.riskLevel}
                  size="small"
                  sx={{
                    backgroundColor: getRiskColor(recommendation.tool.riskLevel),
                    color: 'white'
                  }}
                />
                <Chip
                  label={recommendation.tool.serverName}
                  size="small"
                  variant="filled"
                  color="info"
                />
              </Box>
            </Box>
          </Box>

          <Box textAlign="right">
            <Box display="flex" alignItems="center" mb={1}>
              <TrendingIcon sx={{ mr: 0.5, fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: getConfidenceColor(recommendation.confidence) }}>
                {(recommendation.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={recommendation.confidence * 100}
              sx={{
                width: 60,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getConfidenceColor(recommendation.confidence)
                }
              }}
            />
          </Box>
        </Box>

        {/* AI Reasoning */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
              <AIIcon sx={{ mr: 1, fontSize: 16 }} />
              AI Analysis & Reasoning
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🎯 Why This Tool:
                </Typography>
                {recommendation.reasoning.map((reason, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'flex-start' }}>
                    <CheckIcon sx={{ fontSize: 16, mr: 0.5, color: 'green', mt: 0.2 }} />
                    {reason}
                  </Typography>
                ))}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📊 AI Metrics:
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">AI Score:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(recommendation.metadata.aiScore * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Pattern Match:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(recommendation.metadata.patternMatch * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Success Rate:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {(recommendation.metadata.successProbability * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Expected Outcome:
                  </Typography>
                  <Typography variant="body2">
                    {recommendation.expectedOutcome}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Risk Assessment */}
        {recommendation.riskAssessment.factors.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 1, fontSize: 16 }} />
                Risk Assessment
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🚨 Risk Factors:
                  </Typography>
                  {recommendation.riskAssessment.factors.map((factor, idx) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'flex-start' }}>
                      <WarningIcon sx={{ fontSize: 16, mr: 0.5, color: 'orange', mt: 0.2 }} />
                      {factor}
                    </Typography>
                  ))}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🛡️ Mitigation:
                  </Typography>
                  {recommendation.riskAssessment.mitigation.map((mitigation, idx) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'flex-start' }}>
                      <CheckIcon sx={{ fontSize: 16, mr: 0.5, color: 'green', mt: 0.2 }} />
                      {mitigation}
                    </Typography>
                  ))}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Action Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Box display="flex" gap={1}>
            <Tooltip title={`Estimated Duration: ${recommendation.estimatedDuration}`}>
              <Chip
                icon={<SpeedIcon />}
                label={recommendation.estimatedDuration}
                size="small"
                variant="outlined"
              />
            </Tooltip>

            {recommendation.followUpTools.length > 0 && (
              <Tooltip title={`Recommended follow-up: ${recommendation.followUpTools.join(', ')}`}>
                <Chip
                  icon={<TargetIcon />}
                  label={`+${recommendation.followUpTools.length} follow-up`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>

          <Box display="flex" gap={1}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* Handle bookmark */ }}>
              <BookmarkIcon />
            </IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* Handle share */ }}>
              <ShareIcon />
            </IconButton>
            <Button
              variant="contained"
              size="small"
              startIcon={<ExecuteIcon />}
              onClick={(e) => {
                e.stopPropagation()
                handleExecute(recommendation)
              }}
              sx={{
                background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FF5252, #26C6DA)'
                }
              }}
            >
              Execute
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box>
      {/* Context Configuration */}
      {renderContextConfiguration()}

      {/* Loading State */}
      {isGenerating && (
        <Box textAlign="center" py={4}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            🧠 AI is analyzing {availableTools.length} tools...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generating intelligent recommendations based on your context
          </Typography>
        </Box>
      )}

      {/* Recommendations */}
      {!isGenerating && recommendations.length > 0 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <AIIcon sx={{ mr: 1 }} />
            AI Recommendations ({recommendations.length})
          </Typography>

          {recommendations.map((recommendation, index) =>
            renderRecommendationCard(recommendation, index)
          )}
        </Box>
      )}

      {/* No Recommendations */}
      {!isGenerating && recommendations.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="h6">No AI Recommendations Available</Typography>
          <Typography>
            Try adjusting your context parameters or ensure tools are available for analysis.
          </Typography>
        </Alert>
      )}
    </Box>
  )
}

export default AIRecommendations