/**
 * AI Service for Genesis Reloop Logistics
 * Integrates with OpenRouter API for AI-powered features
 */

export interface AIJobMatch {
  driverId: string;
  matchScore: number;
  reasoning: string;
}

export interface AIRouteOptimization {
  optimizedRoute: {
    waypoints: Array<{ lat: number; lng: number; address: string }>;
    totalDistance: number;
    totalDuration: number;
  };
  savingsPercentage: number;
  reasoning: string;
}

export interface AIMassBalanceInsights {
  efficiency: number;
  recommendations: string[];
  trends: {
    inputTrend: 'increasing' | 'decreasing' | 'stable';
    outputTrend: 'increasing' | 'decreasing' | 'stable';
    wasteTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface AIFraudAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
  recommendations: string[];
  confidence: number;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = (typeof window !== 'undefined' && (window as unknown as { VITE_OPENROUTER_API_KEY?: string }).VITE_OPENROUTER_API_KEY) || '';
  }

  private async makeRequest(prompt: string, model: string = 'meta-llama/llama-3.1-8b-instruct:free') {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Genesis Reloop Logistics'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for Genesis Reloop Logistics, a waste-to-energy platform. Provide helpful, accurate, and professional responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * AI-powered job matching for drivers
   */
  async matchJobToDrivers(job: Record<string, unknown>, drivers: Record<string, unknown>[]): Promise<AIJobMatch[]> {
    const prompt = `
    Analyze this job and match it with the best drivers:
    
    Job Details:
    - Title: ${job.title}
    - Volume: ${job.volume} liters
    - Pickup: ${job.pickupAddress}
    - Delivery: ${job.deliveryAddress}
    - Contamination: ${job.contamination}
    - Priority: ${job.priority}
    
    Available Drivers:
    ${drivers.map((driver, index) => `
    Driver ${index + 1}:
    - Name: ${driver.name}
    - Vehicle Capacity: ${driver.vehicleCapacity || 'Unknown'} liters
    - Rating: ${driver.rating || 'N/A'}
    - Location: ${driver.address || 'Unknown'}
    - Completed Jobs: ${driver.completedJobs || 0}
    `).join('\n')}
    
    Return a JSON array of matches with driverId, matchScore (0-100), and reasoning.
    `;

    try {
      const response = await this.makeRequest(prompt);
      const matches = JSON.parse(response);
      return Array.isArray(matches) ? matches : [];
    } catch (error) {
      console.error('AI job matching failed:', error);
      return [];
    }
  }

  /**
   * AI-powered route optimization
   */
  async optimizeRoute(originalRoute: Record<string, unknown>): Promise<AIRouteOptimization> {
    const prompt = `
    Optimize this delivery route for efficiency:
    
    Original Route:
    - Waypoints: ${JSON.stringify(originalRoute.waypoints)}
    - Total Distance: ${originalRoute.totalDistance || 'Unknown'} km
    - Total Duration: ${originalRoute.totalDuration || 'Unknown'} minutes
    
    Consider:
    - Traffic patterns
    - Fuel efficiency
    - Time windows
    - Vehicle capacity
    - Road conditions
    
    Return JSON with optimizedRoute, savingsPercentage, and reasoning.
    `;

    try {
      const response = await this.makeRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('AI route optimization failed:', error);
      return {
        optimizedRoute: {
          waypoints: [],
          totalDistance: 0,
          totalDuration: 0
        },
        savingsPercentage: 0,
        reasoning: 'AI optimization unavailable'
      };
    }
  }

  /**
   * Generate mass balance insights
   */
  async generateMassBalanceInsights(userId: string, data: Record<string, unknown>[]): Promise<AIMassBalanceInsights> {
    const prompt = `
    Analyze this mass balance data and provide insights:
    
    Data: ${JSON.stringify(data)}
    
    Calculate efficiency, identify trends, and provide recommendations for improvement.
    Return JSON with efficiency percentage, recommendations array, and trends object.
    `;

    try {
      const response = await this.makeRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('AI mass balance analysis failed:', error);
      return {
        efficiency: 85,
        recommendations: ['Continue current practices'],
        trends: {
          inputTrend: 'stable',
          outputTrend: 'stable',
          wasteTrend: 'stable'
        }
      };
    }
  }

  /**
   * Analyze fraud risk
   */
  async analyzeFraudRisk(userId: string, transactions: Record<string, unknown>[]): Promise<AIFraudAnalysis> {
    const prompt = `
    Analyze these transactions for fraud risk:
    
    Transactions: ${JSON.stringify(transactions)}
    
    Assess risk level, provide reasoning, and suggest recommendations.
    Return JSON with riskLevel, reasoning, recommendations array, and confidence (0-100).
    `;

    try {
      const response = await this.makeRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('AI fraud analysis failed:', error);
      return {
        riskLevel: 'LOW',
        reasoning: 'AI analysis unavailable',
        recommendations: ['Continue monitoring'],
        confidence: 50
      };
    }
  }

  /**
   * Generate customer support response
   */
  async generateSupportResponse(message: string, context: Record<string, unknown> = {}): Promise<string> {
    const prompt = `
    Respond to this customer support message:
    
    Message: "${message}"
    Context: ${JSON.stringify(context)}
    
    Provide a helpful, professional response for Genesis Reloop Logistics.
    `;

    try {
      return await this.makeRequest(prompt);
    } catch (error) {
      console.error('AI support response failed:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again later or contact our support team directly.';
    }
  }

  /**
   * Generate compliance insights
   */
  async generateComplianceInsights(data: Record<string, unknown>): Promise<string> {
    const prompt = `
    Analyze this compliance data and provide insights:
    
    Data: ${JSON.stringify(data)}
    
    Focus on ISCC compliance, regulatory requirements, and best practices.
    `;

    try {
      return await this.makeRequest(prompt);
    } catch (error) {
      console.error('AI compliance analysis failed:', error);
      return 'Compliance analysis is currently unavailable. Please consult with our compliance team.';
    }
  }

  /**
   * Generate automated documentation
   */
  async generateDocumentation(type: string, data: Record<string, unknown>): Promise<string> {
    const prompt = `
    Generate ${type} documentation for Genesis Reloop Logistics:
    
    Data: ${JSON.stringify(data)}
    
    Create professional, compliant documentation suitable for regulatory purposes.
    `;

    try {
      return await this.makeRequest(prompt);
    } catch (error) {
      console.error('AI documentation generation failed:', error);
      return 'Documentation generation is currently unavailable. Please contact our support team.';
    }
  }
}

export const aiService = new AIService();
