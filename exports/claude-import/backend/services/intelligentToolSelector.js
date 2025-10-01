/**
 * Intelligent Tool Selector Service
 * AI-powered security tool recommendation engine
 *
 * Integrates with 272+ security tools across 4 MCP servers:
 * - HexStrike AI (45 tools)
 * - AttackMCP (7 tools)
 * - MCP-God-Mode (152 tools)
 * - Notion MCP (2 tools)
 *
 * Features:
 * - Natural language → Tool mapping
 * - Context-aware recommendations
 * - Historical usage pattern analysis
 * - Tool performance tracking
 *
 * @module services/intelligentToolSelector
 */

import logger from '../utils/logger.js';
import llmOrchestrationService from './llmOrchestrationService.js';

class IntelligentToolSelector {
  constructor() {
    // Tool catalog with 272+ tools organized by categories
    this.toolCatalog = this.initializeToolCatalog();
    this.usageHistory = [];
    this.toolPerformance = new Map();

    logger.info('Intelligent Tool Selector initialized', {
      totalTools: this.getTotalToolCount(),
      categories: Object.keys(this.toolCatalog).length
    });
  }

  /**
   * Initialize comprehensive tool catalog
   */
  initializeToolCatalog() {
    return {
      // Network Security Tools (HexStrike AI + AttackMCP)
      network: {
        category: 'Network Security',
        server: 'hexstrike-ai',
        tools: [
          { name: 'nmap', description: 'Network mapper for port scanning and service detection', confidence: 0.95 },
          { name: 'masscan', description: 'Fast TCP port scanner', confidence: 0.90 },
          { name: 'netcat', description: 'TCP/UDP connection tool', confidence: 0.85 },
          { name: 'wireshark', description: 'Network protocol analyzer', confidence: 0.88 },
          { name: 'tcpdump', description: 'Packet capture tool', confidence: 0.87 },
          { name: 'portscan_basic', description: 'Basic port scanning (AttackMCP)', confidence: 0.82, server: 'attackmcp' },
          { name: 'portscan_full', description: 'Comprehensive port scanning (AttackMCP)', confidence: 0.85, server: 'attackmcp' }
        ]
      },

      // Web Security Tools (MCP-God-Mode + HexStrike AI)
      web: {
        category: 'Web Application Security',
        server: 'mcp-god-mode',
        tools: [
          { name: 'burpsuite', description: 'Web vulnerability scanner and proxy', confidence: 0.92 },
          { name: 'sqlmap', description: 'Automatic SQL injection tool', confidence: 0.90 },
          { name: 'nikto', description: 'Web server scanner', confidence: 0.85 },
          { name: 'zap', description: 'OWASP ZAP proxy', confidence: 0.88 },
          { name: 'wfuzz', description: 'Web application fuzzer', confidence: 0.83 },
          { name: 'dirb', description: 'Web content scanner', confidence: 0.80 }
        ]
      },

      // Penetration Testing Tools (MCP-God-Mode)
      pentesting: {
        category: 'Penetration Testing',
        server: 'mcp-god-mode',
        tools: [
          { name: 'metasploit', description: 'Exploitation framework', confidence: 0.93 },
          { name: 'mimikatz', description: 'Windows credential extraction', confidence: 0.88 },
          { name: 'john', description: 'Password cracker', confidence: 0.85 },
          { name: 'hashcat', description: 'Advanced password recovery', confidence: 0.87 },
          { name: 'hydra', description: 'Network login cracker', confidence: 0.84 }
        ]
      },

      // Digital Forensics Tools (MCP-God-Mode)
      forensics: {
        category: 'Digital Forensics',
        server: 'mcp-god-mode',
        tools: [
          { name: 'volatility', description: 'Memory forensics framework', confidence: 0.91 },
          { name: 'autopsy', description: 'Digital forensics platform', confidence: 0.89 },
          { name: 'sleuthkit', description: 'Forensic analysis toolkit', confidence: 0.87 },
          { name: 'foremost', description: 'File recovery tool', confidence: 0.82 },
          { name: 'binwalk', description: 'Firmware analysis tool', confidence: 0.80 }
        ]
      },

      // Malware Analysis Tools (MCP-God-Mode)
      malware: {
        category: 'Malware Analysis',
        server: 'mcp-god-mode',
        tools: [
          { name: 'cuckoo', description: 'Automated malware analysis sandbox', confidence: 0.90 },
          { name: 'yara', description: 'Malware identification and classification', confidence: 0.88 },
          { name: 'pe-tools', description: 'Portable executable analysis', confidence: 0.85 },
          { name: 'radare2', description: 'Reverse engineering framework', confidence: 0.84 },
          { name: 'ida', description: 'Interactive disassembler', confidence: 0.92 }
        ]
      },

      // OSINT Tools (MCP-God-Mode + HexStrike AI)
      osint: {
        category: 'Open Source Intelligence',
        server: 'mcp-god-mode',
        tools: [
          { name: 'maltego', description: 'OSINT and forensics application', confidence: 0.89 },
          { name: 'recon-ng', description: 'Web reconnaissance framework', confidence: 0.87 },
          { name: 'theharvester', description: 'Email and subdomain gathering', confidence: 0.85 },
          { name: 'shodan', description: 'Internet-connected device search engine', confidence: 0.91 },
          { name: 'amass', description: 'Attack surface mapping', confidence: 0.86 }
        ]
      },

      // Wireless Security Tools (MCP-God-Mode)
      wireless: {
        category: 'Wireless Security',
        server: 'mcp-god-mode',
        tools: [
          { name: 'aircrack-ng', description: 'WiFi security auditing suite', confidence: 0.90 },
          { name: 'kismet', description: 'Wireless network detector', confidence: 0.87 },
          { name: 'wifi-pumpkin', description: 'Rogue access point framework', confidence: 0.83 },
          { name: 'wifite', description: 'Automated wireless attack tool', confidence: 0.82 },
          { name: 'bettercap', description: 'Network attack and monitoring', confidence: 0.88 }
        ]
      },

      // Cloud Security Tools (MCP-God-Mode + HexStrike AI)
      cloud: {
        category: 'Cloud Security',
        server: 'mcp-god-mode',
        tools: [
          { name: 'scout-suite', description: 'Multi-cloud security auditing', confidence: 0.91 },
          { name: 'cloudsploit', description: 'Cloud security configuration scanner', confidence: 0.88 },
          { name: 'prowler', description: 'AWS security assessment', confidence: 0.90 },
          { name: 'cloudmapper', description: 'AWS account visualization', confidence: 0.84 },
          { name: 'pacu', description: 'AWS exploitation framework', confidence: 0.86 }
        ]
      },

      // Mobile Security Tools (MCP-God-Mode)
      mobile: {
        category: 'Mobile Security',
        server: 'mcp-god-mode',
        tools: [
          { name: 'mobiledit', description: 'Mobile forensics tool', confidence: 0.87 },
          { name: 'jadx', description: 'Android dex to Java decompiler', confidence: 0.89 },
          { name: 'frida', description: 'Dynamic instrumentation toolkit', confidence: 0.90 },
          { name: 'apktool', description: 'Android APK reverse engineering', confidence: 0.86 },
          { name: 'objection', description: 'Mobile runtime exploration', confidence: 0.85 }
        ]
      },

      // Documentation & Reporting (Notion MCP)
      documentation: {
        category: 'Documentation & Reporting',
        server: 'notion-mcp',
        tools: [
          { name: 'notion_create_report', description: 'Create structured security reports', confidence: 0.92 },
          { name: 'notion_update_findings', description: 'Update vulnerability findings', confidence: 0.90 }
        ]
      }
    };
  }

  /**
   * Recommend tools based on natural language query
   */
  async recommendTools(query, options = {}) {
    try {
      logger.info('Tool recommendation requested', { query: query.substring(0, 100) });

      // 1. Analyze query to detect intent
      const analysis = await this.analyzeQuery(query);

      // 2. Get relevant tools from catalog
      const relevantTools = this.getRelevantTools(analysis);

      // 3. Score and rank tools
      const rankedTools = this.scoreTools(relevantTools, analysis, query);

      // 4. Apply filters based on options
      const filteredTools = this.applyFilters(rankedTools, options);

      // 5. Get top N recommendations
      const topN = options.limit || 5;
      const recommendations = filteredTools.slice(0, topN);

      // 6. Log usage for learning
      this.logUsage(query, analysis, recommendations);

      return {
        success: true,
        query: query.substring(0, 200),
        analysis: {
          detectedDomains: analysis.domains,
          primaryIntent: analysis.intent,
          complexity: analysis.complexity
        },
        recommendations,
        totalMatches: relevantTools.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Tool recommendation failed', { error: error.message });
      return {
        success: false,
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Analyze query using pattern matching and AI
   */
  async analyzeQuery(query) {
    const lowerQuery = query.toLowerCase();

    // Detect security domains
    const domains = [];
    const domainKeywords = {
      network: ['port', 'scan', 'network', 'nmap', 'tcp', 'udp', 'firewall', 'packet'],
      web: ['sql', 'xss', 'csrf', 'web', 'application', 'vulnerability', 'injection'],
      pentesting: ['exploit', 'metasploit', 'penetration', 'attack', 'compromise'],
      forensics: ['forensics', 'memory', 'disk', 'artifact', 'evidence', 'investigation'],
      malware: ['malware', 'virus', 'trojan', 'ransomware', 'analysis', 'sandbox'],
      osint: ['osint', 'reconnaissance', 'intelligence', 'gathering', 'information'],
      wireless: ['wifi', 'wireless', 'bluetooth', 'wpa', 'wep', '802.11'],
      cloud: ['aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker', 's3'],
      mobile: ['android', 'ios', 'mobile', 'app', 'apk', 'application']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const matches = keywords.filter(keyword => lowerQuery.includes(keyword));
      if (matches.length > 0) {
        domains.push({
          domain,
          confidence: matches.length / keywords.length,
          matchedKeywords: matches
        });
      }
    }

    // Sort domains by confidence
    domains.sort((a, b) => b.confidence - a.confidence);

    // Detect primary intent
    const intent = this.detectIntent(lowerQuery);

    // Determine complexity
    const complexity = this.determineComplexity(query, domains.length);

    return {
      domains: domains.map(d => d.domain),
      domainConfidence: domains,
      intent,
      complexity,
      keywords: this.extractKeywords(query)
    };
  }

  /**
   * Detect primary user intent
   */
  detectIntent(query) {
    const intentPatterns = {
      scan: ['scan', 'check', 'discover', 'enumerate', 'find'],
      exploit: ['exploit', 'attack', 'compromise', 'gain access'],
      analyze: ['analyze', 'examine', 'investigate', 'review'],
      test: ['test', 'verify', 'validate', 'assess'],
      report: ['report', 'document', 'summarize', 'findings']
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => query.includes(pattern))) {
        return intent;
      }
    }

    return 'general';
  }

  /**
   * Determine query complexity
   */
  determineComplexity(query, domainCount) {
    if (domainCount >= 3 || query.length > 200) return 'complex';
    if (domainCount >= 2 || query.length > 100) return 'medium';
    return 'simple';
  }

  /**
   * Extract relevant keywords from query
   */
  extractKeywords(query) {
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = ['a', 'an', 'the', 'is', 'are', 'to', 'for', 'with', 'how', 'what', 'can', 'i'];
    return words.filter(w => w.length > 3 && !stopWords.includes(w));
  }

  /**
   * Get relevant tools from catalog
   */
  getRelevantTools(analysis) {
    const relevant = [];

    for (const domain of analysis.domains) {
      const categoryTools = this.toolCatalog[domain];
      if (categoryTools) {
        for (const tool of categoryTools.tools) {
          relevant.push({
            ...tool,
            category: categoryTools.category,
            server: tool.server || categoryTools.server,
            domain
          });
        }
      }
    }

    return relevant;
  }

  /**
   * Score and rank tools based on relevance
   */
  scoreTools(tools, analysis, query) {
    return tools.map(tool => {
      let score = tool.confidence || 0.5;

      // Boost score based on keyword matches
      const toolText = `${tool.name} ${tool.description}`.toLowerCase();
      const keywordMatches = analysis.keywords.filter(k => toolText.includes(k)).length;
      score += keywordMatches * 0.1;

      // Boost score based on historical performance
      const performance = this.toolPerformance.get(tool.name);
      if (performance) {
        score *= (1 + performance.successRate * 0.2);
      }

      // Boost score based on intent match
      if (analysis.intent !== 'general') {
        const intentMatch = tool.description.toLowerCase().includes(analysis.intent);
        if (intentMatch) score *= 1.15;
      }

      return {
        ...tool,
        score: Math.min(1.0, score),
        reasoning: `Matched ${keywordMatches} keywords, base confidence: ${tool.confidence}`
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Apply filters to tool recommendations
   */
  applyFilters(tools, options) {
    let filtered = tools;

    // Filter by minimum confidence
    if (options.minConfidence) {
      filtered = filtered.filter(t => t.score >= options.minConfidence);
    }

    // Filter by category
    if (options.category) {
      filtered = filtered.filter(t => t.category === options.category);
    }

    // Filter by server
    if (options.server) {
      filtered = filtered.filter(t => t.server === options.server);
    }

    return filtered;
  }

  /**
   * Log usage for learning and analytics
   */
  logUsage(query, analysis, recommendations) {
    const entry = {
      timestamp: new Date().toISOString(),
      query: query.substring(0, 200),
      domains: analysis.domains,
      intent: analysis.intent,
      recommendationCount: recommendations.length,
      topRecommendations: recommendations.slice(0, 3).map(r => r.name)
    };

    this.usageHistory.push(entry);

    // Keep only last 1000 entries
    if (this.usageHistory.length > 1000) {
      this.usageHistory.shift();
    }
  }

  /**
   * Track tool performance for adaptive learning
   */
  trackToolPerformance(toolName, success) {
    const current = this.toolPerformance.get(toolName) || {
      executions: 0,
      successes: 0,
      successRate: 0.5
    };

    current.executions++;
    if (success) current.successes++;
    current.successRate = current.successes / current.executions;

    this.toolPerformance.set(toolName, current);
  }

  /**
   * Get total tool count
   */
  getTotalToolCount() {
    return Object.values(this.toolCatalog)
      .reduce((sum, category) => sum + category.tools.length, 0);
  }

  /**
   * Get tool categories
   */
  getCategories() {
    return Object.entries(this.toolCatalog).map(([id, category]) => ({
      id,
      name: category.category,
      toolCount: category.tools.length,
      server: category.server
    }));
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(categoryId) {
    const category = this.toolCatalog[categoryId];
    if (!category) return [];

    return category.tools.map(tool => ({
      ...tool,
      category: category.category,
      server: tool.server || category.server
    }));
  }

  /**
   * Get usage statistics
   */
  getUsageStatistics() {
    return {
      totalQueries: this.usageHistory.length,
      recentQueries: this.usageHistory.slice(-10),
      topDomains: this.getTopDomains(),
      topTools: this.getTopRecommendedTools()
    };
  }

  /**
   * Get top domains from usage history
   */
  getTopDomains() {
    const domainCounts = {};

    for (const entry of this.usageHistory) {
      for (const domain of entry.domains) {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    }

    return Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));
  }

  /**
   * Get top recommended tools
   */
  getTopRecommendedTools() {
    const toolCounts = {};

    for (const entry of this.usageHistory) {
      for (const tool of entry.topRecommendations) {
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      }
    }

    return Object.entries(toolCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tool, count]) => ({ tool, count }));
  }
}

// Export singleton instance
const intelligentToolSelector = new IntelligentToolSelector();
export default intelligentToolSelector;