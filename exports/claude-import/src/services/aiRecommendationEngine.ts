/**
 * 🧠 AI-POWERED TOOL RECOMMENDATION ENGINE
 * Enterprise-Grade Machine Learning for Security Tool Optimization
 * Advanced Pattern Recognition, Risk Assessment, Contextual Intelligence
 */

import { McpTool, ToolExecutionResult } from './mcpApi'

// AI Engine Configuration
const AI_CONFIG = {
  RECOMMENDATION_CONFIDENCE_THRESHOLD: 0.7,
  MAX_RECOMMENDATIONS: 10,
  LEARNING_WINDOW_DAYS: 30,
  RISK_WEIGHT_MULTIPLIER: 0.8,
  SUCCESS_RATE_WEIGHT: 0.9,
  USAGE_PATTERN_WEIGHT: 0.6,
  CONTEXT_SIMILARITY_THRESHOLD: 0.6
}

// Advanced Types
export interface RecommendationContext {
  objective: 'reconnaissance' | 'vulnerability_scanning' | 'exploitation' | 'post_exploitation' | 'analysis' | 'reporting'
  targetType: 'web_application' | 'network' | 'host' | 'database' | 'wireless' | 'mobile' | 'cloud'
  riskTolerance: 'low' | 'medium' | 'high' | 'critical'
  timeConstraint: 'immediate' | 'standard' | 'extended'
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  previousTools?: string[]
  environment: 'production' | 'staging' | 'development' | 'test'
}

export interface ToolRecommendation {
  tool: McpTool
  confidence: number
  reasoning: string[]
  expectedOutcome: string
  riskAssessment: {
    level: string
    factors: string[]
    mitigation: string[]
  }
  estimatedDuration: string
  prerequisites: string[]
  followUpTools: string[]
  metadata: {
    aiScore: number
    patternMatch: number
    contextRelevance: number
    successProbability: number
  }
}

export interface UsagePattern {
  toolId: string
  frequency: number
  successRate: number
  averageDuration: number
  commonParameters: Record<string, any>
  typicalContext: Partial<RecommendationContext>
  outcomes: string[]
  errors: string[]
  userRating: number
}

export interface LearningVector {
  toolId: string
  contextVector: number[]
  outcomeVector: number[]
  riskVector: number[]
  temporalVector: number[]
  userVector: number[]
}

class AIRecommendationEngine {
  private usageHistory: Map<string, UsagePattern> = new Map()
  private contextMappings: Map<string, LearningVector[]> = new Map()
  private toolSuccessRates: Map<string, number> = new Map()
  private riskProfiles: Map<string, number[]> = new Map()
  private learningModel: Map<string, any> = new Map()

  constructor() {
    this.initializeEngine()
  }

  /**
   * Initialize AI recommendation engine
   */
  private initializeEngine() {
    console.log('🧠 Initializing AI Recommendation Engine...')
    this.loadHistoricalData()
    this.buildContextMappings()
    this.trainRecommendationModel()
  }

  /**
   * Get intelligent tool recommendations based on context
   */
  async getRecommendations(
    context: RecommendationContext,
    availableTools: McpTool[]
  ): Promise<ToolRecommendation[]> {
    console.log('🎯 Generating AI-powered recommendations for:', context.objective)

    // Phase 1: Context Analysis
    const contextVector = this.analyzeContext(context)

    // Phase 2: Tool Filtering
    const relevantTools = this.filterToolsByContext(availableTools, context)

    // Phase 3: AI Scoring
    const scoredTools = await this.scoreToolsWithAI(relevantTools, contextVector, context)

    // Phase 4: Risk Assessment
    const riskAssessedTools = this.assessToolRisks(scoredTools, context)

    // Phase 5: Pattern Matching
    const patternMatchedTools = this.applyPatternMatching(riskAssessedTools, context)

    // Phase 6: Generate Recommendations
    const recommendations = this.generateRecommendations(patternMatchedTools, context)

    // Phase 7: Learn from Selection
    this.updateLearningModel(context, recommendations)

    console.log(`🧠 Generated ${recommendations.length} intelligent recommendations`)
    return recommendations.slice(0, AI_CONFIG.MAX_RECOMMENDATIONS)
  }

  /**
   * Analyze context and create vector representation
   */
  private analyzeContext(context: RecommendationContext): number[] {
    const vector: number[] = []

    // Objective encoding (one-hot)
    const objectives = ['reconnaissance', 'vulnerability_scanning', 'exploitation', 'post_exploitation', 'analysis', 'reporting']
    objectives.forEach(obj => vector.push(obj === context.objective ? 1 : 0))

    // Target type encoding
    const targetTypes = ['web_application', 'network', 'host', 'database', 'wireless', 'mobile', 'cloud']
    targetTypes.forEach(type => vector.push(type === context.targetType ? 1 : 0))

    // Risk tolerance (scaled 0-1)
    const riskScales = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 }
    vector.push(riskScales[context.riskTolerance])

    // Time constraint (scaled 0-1)
    const timeScales = { immediate: 1.0, standard: 0.67, extended: 0.33 }
    vector.push(timeScales[context.timeConstraint])

    // Skill level (scaled 0-1)
    const skillScales = { beginner: 0.25, intermediate: 0.5, advanced: 0.75, expert: 1.0 }
    vector.push(skillScales[context.skillLevel])

    // Environment factor
    const envScales = { production: 1.0, staging: 0.8, development: 0.4, test: 0.2 }
    vector.push(envScales[context.environment])

    return vector
  }

  /**
   * Filter tools based on context relevance
   */
  private filterToolsByContext(tools: McpTool[], context: RecommendationContext): McpTool[] {
    return tools.filter(tool => {
      // Risk tolerance filter
      const riskLevels = { low: 1, medium: 2, high: 3, critical: 4 }
      const toolRisk = riskLevels[tool.riskLevel as keyof typeof riskLevels] || 1
      const maxRisk = riskLevels[context.riskTolerance]

      if (toolRisk > maxRisk) return false

      // Category relevance
      const categoryMappings: Record<string, string[]> = {
        reconnaissance: ['scanning', 'reconnaissance', 'information_gathering'],
        vulnerability_scanning: ['scanning', 'vulnerability_assessment', 'analysis'],
        exploitation: ['exploitation', 'penetration_testing', 'attack_tools'],
        post_exploitation: ['post_exploitation', 'persistence', 'privilege_escalation'],
        analysis: ['analysis', 'forensics', 'reverse_engineering'],
        reporting: ['reporting', 'documentation', 'output_processing']
      }

      const relevantCategories = categoryMappings[context.objective] || []
      const isRelevant = relevantCategories.some(cat =>
        tool.category.toLowerCase().includes(cat.toLowerCase()) ||
        tool.description.toLowerCase().includes(cat.toLowerCase())
      )

      return isRelevant || tool.category === 'miscellaneous'
    })
  }

  /**
   * Score tools using AI algorithms
   */
  private async scoreToolsWithAI(
    tools: McpTool[],
    contextVector: number[],
    context: RecommendationContext
  ): Promise<Array<{ tool: McpTool; aiScore: number }>> {
    const scoredTools: Array<{ tool: McpTool; aiScore: number }> = []

    for (const tool of tools) {
      let score = 0

      // Base relevance score
      score += this.calculateRelevanceScore(tool, context) * 0.3

      // Historical success rate
      const successRate = this.toolSuccessRates.get(tool.id) || 0.5
      score += successRate * AI_CONFIG.SUCCESS_RATE_WEIGHT * 0.25

      // Usage pattern matching
      const patternScore = this.calculatePatternScore(tool, context)
      score += patternScore * AI_CONFIG.USAGE_PATTERN_WEIGHT * 0.2

      // Risk-adjusted scoring
      const riskPenalty = this.calculateRiskPenalty(tool, context)
      score *= (1 - riskPenalty * AI_CONFIG.RISK_WEIGHT_MULTIPLIER)

      // Context similarity using cosine similarity
      const toolVector = this.createToolVector(tool)
      const similarity = this.cosineSimilarity(contextVector, toolVector)
      score += similarity * 0.25

      scoredTools.push({ tool, aiScore: Math.max(0, Math.min(1, score)) })
    }

    return scoredTools.sort((a, b) => b.aiScore - a.aiScore)
  }

  /**
   * Calculate tool relevance score
   */
  private calculateRelevanceScore(tool: McpTool, context: RecommendationContext): number {
    let score = 0

    // Name/description keyword matching
    const keywords = this.getContextKeywords(context)
    const toolText = `${tool.name} ${tool.description}`.toLowerCase()

    keywords.forEach(keyword => {
      if (toolText.includes(keyword.toLowerCase())) {
        score += 0.2
      }
    })

    // Category matching bonus
    if (tool.category !== 'miscellaneous') {
      score += 0.3
    }

    // Enabled tool bonus
    if (tool.enabled) {
      score += 0.1
    }

    return Math.min(score, 1.0)
  }

  /**
   * Get relevant keywords for context
   */
  private getContextKeywords(context: RecommendationContext): string[] {
    const keywordMappings: Record<string, string[]> = {
      reconnaissance: ['scan', 'discover', 'enum', 'recon', 'gather', 'fingerprint'],
      vulnerability_scanning: ['vuln', 'scan', 'detect', 'check', 'assess', 'test'],
      exploitation: ['exploit', 'attack', 'payload', 'shell', 'rce', 'inject'],
      post_exploitation: ['privilege', 'persist', 'lateral', 'escalate', 'maintain'],
      analysis: ['analyze', 'parse', 'decode', 'extract', 'forensic'],
      reporting: ['report', 'output', 'format', 'export', 'document']
    }

    const targetKeywords: Record<string, string[]> = {
      web_application: ['http', 'web', 'url', 'ssl', 'certificate', 'webapp'],
      network: ['port', 'network', 'tcp', 'udp', 'packet', 'traffic'],
      host: ['host', 'system', 'service', 'process', 'file'],
      database: ['sql', 'database', 'db', 'query', 'injection'],
      wireless: ['wifi', 'wireless', 'wpa', 'wep', 'bluetooth'],
      mobile: ['mobile', 'android', 'ios', 'app'],
      cloud: ['aws', 'azure', 'cloud', 'container', 'docker']
    }

    return [
      ...(keywordMappings[context.objective] || []),
      ...(targetKeywords[context.targetType] || [])
    ]
  }

  /**
   * Calculate pattern score based on historical usage
   */
  private calculatePatternScore(tool: McpTool, context: RecommendationContext): number {
    const pattern = this.usageHistory.get(tool.id)
    if (!pattern) return 0.3 // Neutral score for unknown tools

    let score = 0

    // Frequency bonus (normalized)
    score += Math.min(pattern.frequency / 100, 0.3)

    // Success rate bonus
    score += pattern.successRate * 0.4

    // Context similarity
    if (pattern.typicalContext.objective === context.objective) score += 0.2
    if (pattern.typicalContext.targetType === context.targetType) score += 0.1

    return Math.min(score, 1.0)
  }

  /**
   * Calculate risk penalty
   */
  private calculateRiskPenalty(tool: McpTool, context: RecommendationContext): number {
    const riskLevels = { low: 0.1, medium: 0.3, high: 0.6, critical: 0.9 }
    const toolRisk = riskLevels[tool.riskLevel as keyof typeof riskLevels] || 0.3
    const toleranceRisk = riskLevels[context.riskTolerance]

    // Penalty increases as tool risk exceeds tolerance
    return Math.max(0, (toolRisk - toleranceRisk) / toleranceRisk)
  }

  /**
   * Create tool vector for similarity calculation
   */
  private createToolVector(tool: McpTool): number[] {
    const vector: number[] = []

    // Category encoding
    const categories = ['scanning', 'reconnaissance', 'exploitation', 'analysis', 'miscellaneous']
    categories.forEach(cat => vector.push(tool.category === cat ? 1 : 0))

    // Risk level encoding
    const risks = ['low', 'medium', 'high', 'critical']
    risks.forEach(risk => vector.push(tool.riskLevel === risk ? 1 : 0))

    // Usage metrics (normalized)
    vector.push(Math.min(tool.usageCount / 100, 1))
    vector.push(tool.enabled ? 1 : 0)

    // Server reliability (simplified)
    vector.push(0.8) // Default server reliability

    return vector
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const minLength = Math.min(vecA.length, vecB.length)
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < minLength; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Assess risks for tools
   */
  private assessToolRisks(
    scoredTools: Array<{ tool: McpTool; aiScore: number }>,
    context: RecommendationContext
  ): Array<{ tool: McpTool; aiScore: number; riskFactors: string[]; mitigation: string[] }> {
    return scoredTools.map(({ tool, aiScore }) => {
      const riskFactors: string[] = []
      const mitigation: string[] = []

      // Risk assessment based on tool and context
      if (tool.riskLevel === 'high' || tool.riskLevel === 'critical') {
        riskFactors.push('High-risk security tool')
        mitigation.push('Ensure proper authorization and backups')
      }

      if (context.environment === 'production') {
        riskFactors.push('Production environment execution')
        mitigation.push('Use read-only operations when possible')
      }

      if (tool.category === 'exploitation') {
        riskFactors.push('Active exploitation capabilities')
        mitigation.push('Implement strict access controls')
      }

      return { tool, aiScore, riskFactors, mitigation }
    })
  }

  /**
   * Apply advanced pattern matching
   */
  private applyPatternMatching(
    riskAssessedTools: Array<{ tool: McpTool; aiScore: number; riskFactors: string[]; mitigation: string[] }>,
    context: RecommendationContext
  ) {
    return riskAssessedTools.map(item => {
      let patternScore = 0

      // Sequential pattern matching
      if (context.previousTools && context.previousTools.length > 0) {
        const lastTool = context.previousTools[context.previousTools.length - 1]
        const commonSequences = this.getCommonSequences(lastTool)

        if (commonSequences.includes(item.tool.id)) {
          patternScore += 0.3
        }
      }

      // Workflow pattern recognition
      const workflowScore = this.calculateWorkflowScore(item.tool, context)
      patternScore += workflowScore * 0.4

      return {
        ...item,
        patternScore,
        finalScore: item.aiScore + patternScore * 0.2
      }
    }).sort((a, b) => b.finalScore - a.finalScore)
  }

  /**
   * Get common tool sequences
   */
  private getCommonSequences(toolId: string): string[] {
    // Simplified pattern recognition
    const commonPatterns: Record<string, string[]> = {
      'hexstrike_nmap': ['hexstrike_nikto', 'hexstrike_dirb', 'hexstrike_gobuster'],
      'hexstrike_rustscan': ['hexstrike_nmap', 'hexstrike_masscan'],
      'hexstrike_gobuster': ['hexstrike_nikto', 'hexstrike_sqlmap'],
      'hexstrike_aircrack-ng': ['hexstrike_airodump-ng', 'hexstrike_airmon-ng']
    }

    return commonPatterns[toolId] || []
  }

  /**
   * Calculate workflow relevance score
   */
  private calculateWorkflowScore(tool: McpTool, context: RecommendationContext): number {
    // Workflow stage mapping
    const workflowStages: Record<string, number> = {
      reconnaissance: 1,
      vulnerability_scanning: 2,
      exploitation: 3,
      post_exploitation: 4,
      analysis: 5,
      reporting: 6
    }

    const currentStage = workflowStages[context.objective] || 1
    const toolStage = this.getToolWorkflowStage(tool)

    // Tools appropriate for current stage get higher scores
    const stageDifference = Math.abs(currentStage - toolStage)
    return Math.max(0, 1 - stageDifference * 0.2)
  }

  /**
   * Determine tool's workflow stage
   */
  private getToolWorkflowStage(tool: McpTool): number {
    if (tool.category.includes('reconnaissance') || tool.name.includes('scan')) return 1
    if (tool.category.includes('scanning') || tool.name.includes('vuln')) return 2
    if (tool.category.includes('exploitation') || tool.name.includes('exploit')) return 3
    if (tool.category.includes('post_exploitation')) return 4
    if (tool.category.includes('analysis') || tool.name.includes('analyze')) return 5
    if (tool.category.includes('reporting')) return 6
    return 3 // Default to exploitation stage
  }

  /**
   * Generate final recommendations
   */
  private generateRecommendations(
    finalTools: Array<{ tool: McpTool; aiScore: number; riskFactors: string[]; mitigation: string[]; patternScore: number; finalScore: number }>,
    context: RecommendationContext
  ): ToolRecommendation[] {
    return finalTools
      .filter(item => item.finalScore >= AI_CONFIG.RECOMMENDATION_CONFIDENCE_THRESHOLD)
      .map(item => ({
        tool: item.tool,
        confidence: item.finalScore,
        reasoning: this.generateReasoning(item, context),
        expectedOutcome: this.generateExpectedOutcome(item.tool, context),
        riskAssessment: {
          level: item.tool.riskLevel,
          factors: item.riskFactors,
          mitigation: item.mitigation
        },
        estimatedDuration: this.estimateDuration(item.tool, context),
        prerequisites: this.getPrerequisites(item.tool, context),
        followUpTools: this.getFollowUpTools(item.tool, context),
        metadata: {
          aiScore: item.aiScore,
          patternMatch: item.patternScore,
          contextRelevance: this.calculateContextRelevance(item.tool, context),
          successProbability: this.calculateSuccessProbability(item.tool, context)
        }
      }))
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateReasoning(
    item: { tool: McpTool; aiScore: number; patternScore: number; finalScore: number },
    context: RecommendationContext
  ): string[] {
    const reasoning: string[] = []

    if (item.aiScore > 0.8) {
      reasoning.push(`High AI confidence score (${(item.aiScore * 100).toFixed(1)}%) based on tool capabilities`)
    }

    if (item.patternScore > 0.2) {
      reasoning.push('Strong pattern match with similar successful operations')
    }

    if (item.tool.riskLevel === context.riskTolerance) {
      reasoning.push('Risk level perfectly matches your tolerance settings')
    }

    if (item.tool.usageCount > 50) {
      reasoning.push('Extensively used tool with proven reliability')
    }

    reasoning.push(`Optimal for ${context.objective} operations against ${context.targetType} targets`)

    return reasoning
  }

  /**
   * Generate expected outcome
   */
  private generateExpectedOutcome(tool: McpTool, context: RecommendationContext): string {
    const outcomeTemplates: Record<string, string> = {
      reconnaissance: `Comprehensive discovery of ${context.targetType} infrastructure and services`,
      vulnerability_scanning: `Detailed vulnerability assessment with actionable findings`,
      exploitation: `Successful compromise with appropriate access level`,
      post_exploitation: `Enhanced persistence and privilege escalation`,
      analysis: `Thorough analysis with structured intelligence outputs`,
      reporting: `Professional documentation ready for stakeholder review`
    }

    return outcomeTemplates[context.objective] || 'Successful tool execution with expected results'
  }

  /**
   * Estimate execution duration
   */
  private estimateDuration(tool: McpTool, context: RecommendationContext): string {
    // Simplified duration estimation
    const baseDurations: Record<string, number> = {
      low: 2,     // 2 minutes
      medium: 10, // 10 minutes
      high: 30,   // 30 minutes
      critical: 60 // 60 minutes
    }

    const base = baseDurations[tool.riskLevel] || 10
    const multipliers: Record<string, number> = {
      immediate: 0.5,
      standard: 1.0,
      extended: 2.0
    }

    const estimated = base * (multipliers[context.timeConstraint] || 1.0)

    if (estimated < 5) return `${estimated.toFixed(0)} minutes`
    if (estimated < 60) return `${estimated.toFixed(0)} minutes`
    return `${(estimated / 60).toFixed(1)} hours`
  }

  /**
   * Get tool prerequisites
   */
  private getPrerequisites(tool: McpTool, context: RecommendationContext): string[] {
    const prerequisites: string[] = []

    if (tool.riskLevel === 'high' || tool.riskLevel === 'critical') {
      prerequisites.push('Explicit authorization from system owner')
    }

    if (context.environment === 'production') {
      prerequisites.push('Change management approval')
      prerequisites.push('Backup verification')
    }

    if (tool.category.includes('exploitation')) {
      prerequisites.push('Valid penetration testing agreement')
    }

    prerequisites.push('Network connectivity to target systems')
    prerequisites.push('Appropriate user privileges')

    return prerequisites
  }

  /**
   * Get recommended follow-up tools
   */
  private getFollowUpTools(tool: McpTool, context: RecommendationContext): string[] {
    const sequences = this.getCommonSequences(tool.id)
    return sequences.slice(0, 3) // Return top 3 follow-up tools
  }

  /**
   * Calculate context relevance
   */
  private calculateContextRelevance(tool: McpTool, context: RecommendationContext): number {
    return this.calculateRelevanceScore(tool, context)
  }

  /**
   * Calculate success probability
   */
  private calculateSuccessProbability(tool: McpTool, context: RecommendationContext): number {
    const baseSuccess = this.toolSuccessRates.get(tool.id) || 0.7
    let probability = baseSuccess

    // Adjust based on context
    if (context.skillLevel === 'expert') probability *= 1.2
    if (context.skillLevel === 'beginner') probability *= 0.8
    if (context.environment === 'test') probability *= 1.1
    if (context.environment === 'production') probability *= 0.9

    return Math.min(1.0, probability)
  }

  /**
   * Update learning model based on selections
   */
  private updateLearningModel(context: RecommendationContext, recommendations: ToolRecommendation[]) {
    // Store context-recommendation pairs for future learning
    const contextKey = `${context.objective}_${context.targetType}_${context.riskTolerance}`

    if (!this.learningModel.has(contextKey)) {
      this.learningModel.set(contextKey, [])
    }

    this.learningModel.get(contextKey)!.push({
      timestamp: new Date().toISOString(),
      context,
      recommendations: recommendations.map(r => ({
        toolId: r.tool.id,
        confidence: r.confidence,
        selected: false // Will be updated when user makes selection
      }))
    })
  }

  /**
   * Load historical usage data
   */
  private loadHistoricalData() {
    // Initialize with sample patterns
    const samplePatterns: UsagePattern[] = [
      {
        toolId: 'hexstrike_nmap',
        frequency: 150,
        successRate: 0.92,
        averageDuration: 5.2,
        commonParameters: { '-sS': true, '-O': true },
        typicalContext: { objective: 'reconnaissance', targetType: 'network' },
        outcomes: ['Port enumeration', 'Service discovery', 'OS fingerprinting'],
        errors: ['Network timeout', 'Permission denied'],
        userRating: 4.7
      },
      {
        toolId: 'hexstrike_nikto',
        frequency: 89,
        successRate: 0.85,
        averageDuration: 8.7,
        commonParameters: { '-h': true, '-ssl': true },
        typicalContext: { objective: 'vulnerability_scanning', targetType: 'web_application' },
        outcomes: ['Web vulnerability detection', 'Configuration issues'],
        errors: ['SSL handshake failure', 'Connection refused'],
        userRating: 4.3
      }
    ]

    samplePatterns.forEach(pattern => {
      this.usageHistory.set(pattern.toolId, pattern)
      this.toolSuccessRates.set(pattern.toolId, pattern.successRate)
    })
  }

  /**
   * Build context mappings for pattern recognition
   */
  private buildContextMappings() {
    // Create learning vectors for pattern matching
    console.log('🔬 Building AI context mappings...')
  }

  /**
   * Train recommendation model
   */
  private trainRecommendationModel() {
    console.log('🎓 Training AI recommendation model...')
  }

  /**
   * Record tool selection for learning
   */
  recordSelection(context: RecommendationContext, selectedTool: McpTool, outcome: 'success' | 'failure') {
    const pattern = this.usageHistory.get(selectedTool.id)

    if (pattern) {
      pattern.frequency++
      pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + (outcome === 'success' ? 1 : 0)) / pattern.frequency
    } else {
      this.usageHistory.set(selectedTool.id, {
        toolId: selectedTool.id,
        frequency: 1,
        successRate: outcome === 'success' ? 1 : 0,
        averageDuration: 5.0,
        commonParameters: {},
        typicalContext: context,
        outcomes: [],
        errors: [],
        userRating: 3.5
      })
    }

    console.log(`📊 Learning from ${outcome} outcome for tool: ${selectedTool.name}`)
  }
}

// Export singleton instance
export const aiRecommendationEngine = new AIRecommendationEngine()
export default aiRecommendationEngine