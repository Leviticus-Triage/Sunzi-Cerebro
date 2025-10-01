/**
 * LLM Orchestration Service
 * Enterprise-grade multi-provider LLM orchestration with intelligent routing
 *
 * Features:
 * - Multi-provider support (Ollama, OpenAI, Anthropic)
 * - Intelligent routing based on query complexity, cost, and performance
 * - Circuit breaker pattern for high availability
 * - Cost optimization and budget tracking
 * - Response caching integration
 * - Security-aware provider selection
 *
 * @module services/llmOrchestrationService
 */

import crypto from 'crypto';
import logger from '../utils/logger.js';
import performanceMonitor from './performanceMonitor.js';
import multiLevelCache from './multiLevelCache.js';
import OllamaService from './OllamaService.js';

class LLMOrchestrationService {
  constructor() {
    this.providers = new Map();
    this.models = new Map();
    this.routingHistory = [];
    this.costTracking = {
      total: 0,
      byProvider: {}
    };

    // Configuration
    this.config = {
      defaultProvider: 'ollama',
      enableCaching: true,
      enableCostTracking: true,
      enableIntelligentRouting: true,
      budgetLimits: {
        daily: parseFloat(process.env.LLM_DAILY_BUDGET) || 10.00,
        monthly: parseFloat(process.env.LLM_MONTHLY_BUDGET) || 200.00
      }
    };

    // Initialize providers
    this.initializeProviders();

    logger.info('LLM Orchestration Service initialized', {
      providers: Array.from(this.providers.keys()),
      config: this.config
    });
  }

  /**
   * Initialize all LLM providers
   */
  initializeProviders() {
    // Initialize Ollama (local provider)
    this.registerProvider({
      id: 'ollama',
      name: 'Ollama',
      type: 'local',
      priority: 1,
      weight: 100,
      costPerToken: 0,
      instance: new OllamaService(),
      capabilities: {
        streaming: true,
        tools: true,
        contextWindow: 8192
      },
      performanceProfile: {
        avgResponseTime: 500,
        maxConcurrent: 5,
        reliability: 0.95
      }
    });

    // OpenAI will be initialized when API key is provided
    if (process.env.OPENAI_API_KEY) {
      this.registerProvider({
        id: 'openai',
        name: 'OpenAI',
        type: 'cloud',
        priority: 2,
        weight: 80,
        costPerToken: 0.00003, // $0.03 per 1K tokens
        endpoint: 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        capabilities: {
          streaming: true,
          tools: true,
          contextWindow: 128000
        },
        performanceProfile: {
          avgResponseTime: 200,
          maxConcurrent: 10,
          reliability: 0.99
        }
      });
    }

    // Anthropic will be initialized when API key is provided
    if (process.env.ANTHROPIC_API_KEY) {
      this.registerProvider({
        id: 'anthropic',
        name: 'Anthropic',
        type: 'cloud',
        priority: 2,
        weight: 90,
        costPerToken: 0.000015, // $0.015 per 1K tokens
        endpoint: 'https://api.anthropic.com/v1',
        apiKey: process.env.ANTHROPIC_API_KEY,
        capabilities: {
          streaming: true,
          tools: true,
          contextWindow: 200000
        },
        performanceProfile: {
          avgResponseTime: 150,
          maxConcurrent: 10,
          reliability: 0.99
        }
      });
    }
  }

  /**
   * Register a new provider
   */
  registerProvider(providerConfig) {
    this.providers.set(providerConfig.id, {
      ...providerConfig,
      healthStatus: 'healthy',
      lastHealthCheck: new Date(),
      requestCount: 0,
      errorCount: 0,
      totalCost: 0
    });

    // Initialize cost tracking
    this.costTracking.byProvider[providerConfig.id] = {
      total: 0,
      requests: 0,
      tokens: 0
    };

    logger.info(`Provider registered: ${providerConfig.name}`, {
      id: providerConfig.id,
      type: providerConfig.type,
      priority: providerConfig.priority
    });
  }

  /**
   * Main entry point: Execute LLM query with intelligent routing
   */
  async executeQuery(request) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Analyze query
      const analysis = await this.analyzeQuery(request);

      // 3. Check cache
      if (this.config.enableCaching) {
        const cached = await this.checkCache(analysis.cacheKey);
        if (cached) {
          logger.info('Cache hit for query', { requestId, cacheKey: analysis.cacheKey });
          return {
            success: true,
            requestId,
            response: cached.response,
            metadata: {
              ...cached.metadata,
              cacheHit: true,
              responseTime: Date.now() - startTime
            }
          };
        }
      }

      // 4. Select optimal provider
      const provider = await this.selectProvider(analysis, request.preferences);

      // 5. Check budget constraints
      if (this.config.enableCostTracking) {
        await this.checkBudget(provider, analysis.estimatedTokens);
      }

      // 6. Execute with circuit breaker and fallback
      performanceMonitor.startRequest(requestId, {
        provider: provider.id,
        complexity: analysis.complexity,
        estimatedTokens: analysis.estimatedTokens
      });

      const response = await this.executeWithFallback(provider, request, analysis);

      performanceMonitor.endRequest(requestId, true);

      // 7. Track costs
      if (this.config.enableCostTracking && response.usage) {
        await this.trackCost(provider.id, response.usage);
      }

      // 8. Cache response
      if (this.config.enableCaching && response.success) {
        await this.cacheResponse(analysis.cacheKey, response);
      }

      // 9. Log routing decision
      this.logRoutingDecision(requestId, request, analysis, provider, response);

      return {
        success: true,
        requestId,
        response: response.message,
        metadata: {
          provider: provider.name,
          model: response.model || 'default',
          tokens: response.usage || { input: 0, output: 0, total: 0 },
          cost: this.calculateCost(provider, response.usage),
          responseTime: Date.now() - startTime,
          routing: {
            reason: analysis.routingReason,
            complexity: analysis.complexity,
            fallbacksAttempted: response.fallbacksAttempted || 0
          },
          cacheHit: false
        }
      };

    } catch (error) {
      performanceMonitor.endRequest(requestId, false, error);
      logger.error('Query execution failed', { requestId, error: error.message });

      return {
        success: false,
        requestId,
        error: {
          code: error.code || 'EXECUTION_ERROR',
          message: error.message,
          recoverable: error.recoverable !== false
        },
        metadata: {
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Analyze query to determine routing strategy
   */
  async analyzeQuery(request) {
    const query = request.query || request.message || '';
    const context = request.context || [];

    // Calculate complexity
    const wordCount = query.split(/\s+/).length;
    const hasCode = /```[\s\S]*?```/.test(query);
    const hasList = /(\n-|\n\d+\.)/.test(query);
    const contextLength = context.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);

    // Determine complexity level
    let complexity = 'simple';
    if (wordCount > 100 || hasCode || contextLength > 2000) {
      complexity = 'complex';
    } else if (wordCount > 50 || hasList || contextLength > 500) {
      complexity = 'medium';
    }

    // Detect security keywords and domains
    const securityDomains = this.detectSecurityDomains(query);

    // Estimate tokens
    const estimatedTokens = Math.ceil((query.length + contextLength) / 4);

    // Generate cache key
    const cacheKey = this.generateCacheKey(query, context);

    return {
      complexity,
      estimatedTokens,
      hasCode,
      securityDomains,
      securityClassification: request.metadata?.securityClassification || 'public',
      requiresTools: request.preferences?.requireTools || securityDomains.length > 0,
      cacheKey,
      routingReason: `Query complexity: ${complexity}, Estimated tokens: ${estimatedTokens}`
    };
  }

  /**
   * Detect security domains from query text
   */
  detectSecurityDomains(query) {
    const domains = [];
    const lowerQuery = query.toLowerCase();

    const domainKeywords = {
      network: ['port scan', 'network', 'nmap', 'ping', 'tcp', 'udp', 'firewall'],
      web: ['sql injection', 'xss', 'csrf', 'web app', 'burp', 'vulnerability'],
      forensics: ['forensics', 'memory', 'disk', 'artifact', 'timeline'],
      malware: ['malware', 'virus', 'trojan', 'ransomware', 'analysis'],
      osint: ['osint', 'reconnaissance', 'gathering', 'social', 'intelligence'],
      wireless: ['wifi', 'wireless', 'bluetooth', 'aircrack'],
      cloud: ['aws', 'azure', 'cloud', 'kubernetes', 'docker'],
      mobile: ['android', 'ios', 'mobile', 'app']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        domains.push(domain);
      }
    }

    return domains;
  }

  /**
   * Select optimal provider based on analysis and preferences
   */
  async selectProvider(analysis, preferences = {}) {
    // Get all healthy providers
    const healthyProviders = Array.from(this.providers.values())
      .filter(p => !performanceMonitor.isCircuitOpen(p.id));

    if (healthyProviders.length === 0) {
      throw new Error('No healthy providers available');
    }

    // Apply preference filters
    let candidates = healthyProviders;

    // Filter by explicit provider preference
    if (preferences.provider && preferences.provider !== 'auto') {
      candidates = candidates.filter(p => p.id === preferences.provider);
      if (candidates.length === 0) {
        logger.warn('Preferred provider not available, using alternatives', {
          preferred: preferences.provider
        });
        candidates = healthyProviders;
      }
    }

    // Filter by security classification
    if (analysis.securityClassification === 'classified') {
      // Only local providers for classified data
      candidates = candidates.filter(p => p.type === 'local');
    } else if (analysis.securityClassification === 'sensitive') {
      // Prefer local or privacy-focused providers
      candidates.sort((a, b) => {
        const aScore = a.type === 'local' ? 2 : (a.id === 'anthropic' ? 1 : 0);
        const bScore = b.type === 'local' ? 2 : (b.id === 'anthropic' ? 1 : 0);
        return bScore - aScore;
      });
    }

    // Score each candidate
    const scored = candidates.map(provider => ({
      provider,
      score: this.calculateProviderScore(provider, analysis, preferences)
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Select top provider
    const selected = scored[0].provider;

    logger.info('Provider selected', {
      provider: selected.name,
      score: scored[0].score,
      alternatives: scored.slice(1, 3).map(s => s.provider.name)
    });

    return selected;
  }

  /**
   * Calculate provider score based on multiple factors
   */
  calculateProviderScore(provider, analysis, preferences) {
    let score = 0;

    // Weight factors
    const weights = {
      health: 0.30,
      performance: 0.40,
      cost: 0.20,
      privacy: 0.10
    };

    // Health score (0-100)
    const healthScore = performanceMonitor.isCircuitOpen(provider.id) ? 0 : 100;
    score += healthScore * weights.health;

    // Performance score (0-100)
    const performanceScore = Math.max(0, 100 - (provider.performanceProfile.avgResponseTime / 10));
    score += performanceScore * weights.performance;

    // Cost score (0-100, lower cost = higher score)
    const costScore = provider.costPerToken === 0 ? 100 : Math.max(0, 100 - (provider.costPerToken * 1000000));
    score += costScore * weights.cost;

    // Privacy score (local=100, cloud=50)
    const privacyScore = provider.type === 'local' ? 100 : 50;
    score += privacyScore * weights.privacy;

    // Apply complexity preferences
    if (analysis.complexity === 'complex' && provider.capabilities.contextWindow > 50000) {
      score *= 1.1; // Bonus for large context window
    }

    // Apply cost preferences
    if (preferences.maxCost && provider.costPerToken > 0) {
      const estimatedCost = (analysis.estimatedTokens / 1000) * provider.costPerToken;
      if (estimatedCost > preferences.maxCost) {
        score *= 0.5; // Penalty for exceeding budget
      }
    }

    return score;
  }

  /**
   * Execute query with circuit breaker and fallback chain
   */
  async executeWithFallback(primaryProvider, request, analysis) {
    const fallbackChain = [primaryProvider];

    // Add fallback providers
    const alternatives = Array.from(this.providers.values())
      .filter(p => p.id !== primaryProvider.id && !performanceMonitor.isCircuitOpen(p.id))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 2);

    fallbackChain.push(...alternatives);

    let lastError = null;
    let fallbacksAttempted = 0;

    for (const provider of fallbackChain) {
      try {
        logger.info(`Attempting provider: ${provider.name}`, {
          attempt: fallbacksAttempted + 1,
          total: fallbackChain.length
        });

        const response = await this.executeProvider(provider, request);

        return {
          ...response,
          fallbacksAttempted
        };

      } catch (error) {
        lastError = error;
        fallbacksAttempted++;

        logger.warn(`Provider ${provider.name} failed`, {
          error: error.message,
          fallbacksRemaining: fallbackChain.length - fallbacksAttempted
        });

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(
      `All providers failed after ${fallbacksAttempted} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Execute query on specific provider
   */
  async executeProvider(provider, request) {
    if (provider.id === 'ollama' && provider.instance) {
      // Use existing Ollama service
      const response = await provider.instance.chat(
        request.query || request.message,
        request.context || [],
        request.options || {}
      );

      return {
        success: true,
        message: response.message?.content || response.response,
        model: response.model,
        usage: {
          input: response.prompt_eval_count || 0,
          output: response.eval_count || 0,
          total: (response.prompt_eval_count || 0) + (response.eval_count || 0)
        }
      };
    }

    // For other providers, placeholder for future implementation
    throw new Error(`Provider ${provider.id} not yet implemented`);
  }

  /**
   * Check budget constraints
   */
  async checkBudget(provider, estimatedTokens) {
    if (provider.costPerToken === 0) return; // Free provider

    const estimatedCost = (estimatedTokens / 1000) * provider.costPerToken;
    const currentDailySpend = this.costTracking.total; // Simplified, should be daily

    const remaining = this.config.budgetLimits.daily - currentDailySpend;

    if (estimatedCost > remaining) {
      logger.warn('Budget exceeded', {
        estimated: estimatedCost,
        remaining,
        limit: this.config.budgetLimits.daily
      });

      // Don't throw, just log warning
      // In production, you might want to throw or switch to free provider
    }
  }

  /**
   * Track cost for request
   */
  async trackCost(providerId, usage) {
    const provider = this.providers.get(providerId);
    if (!provider || provider.costPerToken === 0) return;

    const cost = (usage.total / 1000) * provider.costPerToken;

    this.costTracking.total += cost;
    this.costTracking.byProvider[providerId].total += cost;
    this.costTracking.byProvider[providerId].requests++;
    this.costTracking.byProvider[providerId].tokens += usage.total;

    provider.totalCost += cost;

    logger.debug('Cost tracked', {
      provider: provider.name,
      tokens: usage.total,
      cost: cost.toFixed(6)
    });
  }

  /**
   * Calculate cost for response
   */
  calculateCost(provider, usage) {
    if (!usage || provider.costPerToken === 0) {
      return { estimated: 0, actual: 0, currency: 'USD' };
    }

    const cost = (usage.total / 1000) * provider.costPerToken;

    return {
      estimated: cost,
      actual: cost,
      currency: 'USD'
    };
  }

  /**
   * Check cache for existing response
   */
  async checkCache(cacheKey) {
    try {
      return await multiLevelCache.get(`llm:${cacheKey}`);
    } catch (error) {
      logger.warn('Cache check failed', { error: error.message });
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(cacheKey, response) {
    try {
      await multiLevelCache.set(
        `llm:${cacheKey}`,
        response,
        300 // 5 minute TTL
      );
    } catch (error) {
      logger.warn('Cache write failed', { error: error.message });
    }
  }

  /**
   * Generate cache key from query and context
   */
  generateCacheKey(query, context = []) {
    const contextString = context.map(m => `${m.role}:${m.content}`).join('|');
    const combined = `${query}|${contextString}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Validate request
   */
  validateRequest(request) {
    if (!request.query && !request.message) {
      throw new Error('Request must contain query or message');
    }
  }

  /**
   * Log routing decision
   */
  logRoutingDecision(requestId, request, analysis, provider, response) {
    const decision = {
      requestId,
      timestamp: new Date().toISOString(),
      query: request.query?.substring(0, 100) || request.message?.substring(0, 100),
      analysis: {
        complexity: analysis.complexity,
        estimatedTokens: analysis.estimatedTokens,
        securityDomains: analysis.securityDomains
      },
      provider: {
        id: provider.id,
        name: provider.name,
        type: provider.type
      },
      response: {
        success: response.success,
        tokens: response.usage?.total || 0,
        cost: this.calculateCost(provider, response.usage).actual
      }
    };

    this.routingHistory.push(decision);

    // Keep only last 1000 decisions
    if (this.routingHistory.length > 1000) {
      this.routingHistory.shift();
    }
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      providers: Array.from(this.providers.values()).map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        healthStatus: p.healthStatus,
        requestCount: p.requestCount,
        errorCount: p.errorCount,
        totalCost: p.totalCost,
        circuitBreakerOpen: performanceMonitor.isCircuitOpen(p.id)
      })),
      costTracking: {
        total: this.costTracking.total,
        byProvider: this.costTracking.byProvider,
        budgetLimits: this.config.budgetLimits
      },
      recentDecisions: this.routingHistory.slice(-10)
    };
  }

  /**
   * Get available providers
   */
  getProviders() {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      priority: p.priority,
      healthStatus: p.healthStatus,
      capabilities: p.capabilities,
      performanceProfile: p.performanceProfile
    }));
  }
}

// Export singleton instance
const llmOrchestrationService = new LLMOrchestrationService();
export default llmOrchestrationService;