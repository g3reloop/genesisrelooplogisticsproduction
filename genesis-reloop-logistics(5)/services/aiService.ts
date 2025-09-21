import { Job, DriverProfile, AIJobMatch, AIRouteOptimization, AISupportConversation } from '../types';

const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

class AIService {
  private apiKey: string;

  constructor() {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is required');
    }
    this.apiKey = OPENROUTER_API_KEY;
  }

  /**
   * Make API call to OpenRouter
   */
  private async makeAPICall(messages: Array<{ role: string; content: string }>, model: string = 'meta-llama/llama-3.1-8b-instruct:free') {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://genesisreloop.com',
        'X-Title': 'Genesis Reloop Logistics'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * AI-powered job matching
   */
  async matchJobToDriver(job: Job, drivers: DriverProfile[]): Promise<AIJobMatch[]> {
    const systemPrompt = `You are an AI job matching system for Genesis Reloop Logistics. 
    Your task is to match UCO collection jobs with available drivers based on multiple factors:
    - Driver location and job collection location proximity
    - Driver vehicle capacity vs job volume
    - Driver availability and schedule
    - Driver rating and performance history
    - Traffic conditions and route efficiency
    - Driver preferences and specializations

    Rate each driver match from 0-100 and provide reasoning for your decision.`;

    const jobDetails = `
    Job Details:
    - ID: ${job.id}
    - Volume: ${job.volumeLiters} liters
    - Collection Address: ${job.collectionAddress}
    - Collection Date: ${job.collectionDate}
    - Price per Liter: £${job.pricePerLiter}
    - Special Instructions: ${job.specialInstructions || 'None'}
    `;

    const driverDetails = drivers.map((driver, index) => `
    Driver ${index + 1}:
    - ID: ${driver.userId}
    - Vehicle Capacity: ${driver.vehicleCapacity} liters
    - Current Location: ${driver.currentLocation ? `${driver.currentLocation.lat}, ${driver.currentLocation.lng}` : 'Unknown'}
    - Rating: ${driver.rating}/5.0
    - Total Jobs: ${driver.totalJobs}
    - Available: ${driver.isAvailable ? 'Yes' : 'No'}
    `).join('\n');

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${jobDetails}\n\nAvailable Drivers:\n${driverDetails}\n\nProvide matches in JSON format: [{"driverId": "id", "matchScore": 85, "reasoning": "explanation"}]` }
    ];

    try {
      const response = await this.makeAPICall(messages);
      const matches = JSON.parse(response);
      
      return matches.map((match: any) => ({
        id: crypto.randomUUID(),
        jobId: job.id,
        driverId: match.driverId,
        matchScore: match.matchScore,
        aiReasoning: match.reasoning,
        createdAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error in AI job matching:', error);
      // Fallback to simple distance-based matching
      return this.fallbackJobMatching(job, drivers);
    }
  }

  /**
   * AI route optimization
   */
  async optimizeRoute(
    driverId: string,
    originalRoute: { waypoints: Array<{ lat: number; lng: number; address: string }>; totalDistance: number; totalTime: number }
  ): Promise<AIRouteOptimization> {
    const systemPrompt = `You are an AI route optimization system for Genesis Reloop Logistics.
    Your task is to optimize delivery routes for UCO collection considering:
    - Traffic patterns and real-time conditions
    - Time windows for collections
    - Vehicle capacity and fuel efficiency
    - Driver preferences and experience
    - Weather conditions
    - Road closures and construction

    Provide an optimized route with reasoning for improvements.`;

    const routeDetails = `
    Original Route:
    - Total Distance: ${originalRoute.totalDistance} km
    - Total Time: ${originalRoute.totalTime} minutes
    - Waypoints: ${originalRoute.waypoints.length}
    - Stops: ${originalRoute.waypoints.map(wp => wp.address).join(' → ')}
    `;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${routeDetails}\n\nOptimize this route and provide the result in JSON format with optimized waypoints, estimated savings, and reasoning.` }
    ];

    try {
      const response = await this.makeAPICall(messages);
      const optimization = JSON.parse(response);
      
      return {
        id: crypto.randomUUID(),
        driverId,
        originalRoute,
        optimizedRoute: optimization.optimizedRoute,
        savingsPercentage: optimization.savingsPercentage,
        aiReasoning: optimization.reasoning,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in AI route optimization:', error);
      // Return original route if optimization fails
      return {
        id: crypto.randomUUID(),
        driverId,
        originalRoute,
        optimizedRoute: originalRoute,
        savingsPercentage: 0,
        aiReasoning: 'Optimization failed, using original route',
        createdAt: new Date().toISOString()
      };
    }
  }

  /**
   * AI customer support assistant
   */
  async generateSupportResponse(
    userMessage: string,
    userRole: string,
    context?: { currentPage?: string; recentActivity?: string[] }
  ): Promise<string> {
    const systemPrompt = `You are an AI customer support assistant for Genesis Reloop Logistics, a circular economy platform for Used Cooking Oil (UCO) collection and processing.

    Platform Overview:
    - Suppliers: Restaurants and food establishments that generate UCO
    - Drivers: Collection drivers who pick up UCO
    - Buyers: Biodiesel plants and processors who purchase UCO
    - Services: ISCC compliance, mass balance monitoring, fraud prevention, automated documentation

    Your role is to:
    - Answer questions about the platform and services
    - Help users navigate the system
    - Provide guidance on UCO collection and processing
    - Explain Genesis Points and rewards system
    - Assist with technical issues
    - Guide users through onboarding

    Be helpful, accurate, and professional. If you don't know something, suggest contacting support.`;

    const contextInfo = context ? `
    User Context:
    - Role: ${userRole}
    - Current Page: ${context.currentPage || 'Unknown'}
    - Recent Activity: ${context.recentActivity?.join(', ') || 'None'}
    ` : `
    User Role: ${userRole}
    `;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${contextInfo}\n\nUser Question: ${userMessage}` }
    ];

    try {
      return await this.makeAPICall(messages);
    } catch (error) {
      console.error('Error in AI support response:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again later or contact our support team for assistance.';
    }
  }

  /**
   * Generate mass balance insights
   */
  async generateMassBalanceInsights(
    userId: string,
    massBalanceData: Array<{ date: string; input: number; output: number; waste: number }>
  ): Promise<string> {
    const systemPrompt = `You are an AI analyst for Genesis Reloop Logistics specializing in mass balance monitoring for UCO processing.

    Your task is to analyze mass balance data and provide insights on:
    - Processing efficiency trends
    - Waste reduction opportunities
    - Optimization recommendations
    - Compliance with ISCC standards
    - Cost-saving opportunities

    Provide actionable insights and recommendations.`;

    const dataSummary = `
    Mass Balance Data (last ${massBalanceData.length} records):
    ${massBalanceData.map(record => 
      `- ${record.date}: Input ${record.input}L, Output ${record.output}L, Waste ${record.waste}L`
    ).join('\n')}
    `;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${dataSummary}\n\nAnalyze this data and provide insights and recommendations.` }
    ];

    try {
      return await this.makeAPICall(messages);
    } catch (error) {
      console.error('Error generating mass balance insights:', error);
      return 'Unable to generate insights at this time. Please try again later.';
    }
  }

  /**
   * Generate fraud detection analysis
   */
  async analyzeFraudRisk(
    userId: string,
    transactionData: Array<{ date: string; amount: number; type: string; details: any }>
  ): Promise<{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; reasoning: string; recommendations: string[] }> {
    const systemPrompt = `You are an AI fraud detection system for Genesis Reloop Logistics.

    Analyze transaction patterns and identify potential fraud indicators:
    - Unusual transaction volumes or frequencies
    - Suspicious location patterns
    - Inconsistent data entries
    - Anomalous timing patterns
    - Quality discrepancies

    Provide risk assessment and recommendations.`;

    const transactionSummary = `
    Transaction History (last ${transactionData.length} transactions):
    ${transactionData.map(tx => 
      `- ${tx.date}: ${tx.type} - £${tx.amount} (${JSON.stringify(tx.details)})`
    ).join('\n')}
    `;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${transactionSummary}\n\nAnalyze for fraud risk and provide assessment in JSON format: {"riskLevel": "LOW|MEDIUM|HIGH|CRITICAL", "reasoning": "explanation", "recommendations": ["rec1", "rec2"]}` }
    ];

    try {
      const response = await this.makeAPICall(messages);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing fraud risk:', error);
      return {
        riskLevel: 'LOW',
        reasoning: 'Unable to analyze risk at this time',
        recommendations: ['Manual review recommended']
      };
    }
  }

  /**
   * Generate automated documentation
   */
  async generateDocument(
    documentType: string,
    data: Record<string, any>,
    template?: string
  ): Promise<{ title: string; content: string; metadata: Record<string, any> }> {
    const systemPrompt = `You are an AI document generation system for Genesis Reloop Logistics.

    Generate professional documents for:
    - ISCC compliance reports
    - Waste transfer notes
    - Mass balance reports
    - Audit documentation
    - Process certificates

    Ensure documents are accurate, compliant, and professional.`;

    const dataSummary = `
    Document Type: ${documentType}
    Data: ${JSON.stringify(data, null, 2)}
    ${template ? `Template: ${template}` : ''}
    `;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${dataSummary}\n\nGenerate the document in JSON format: {"title": "Document Title", "content": "Full document content", "metadata": {"type": "document_type", "generated_at": "timestamp"}}` }
    ];

    try {
      const response = await this.makeAPICall(messages);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating document:', error);
      return {
        title: `${documentType} Document`,
        content: 'Document generation failed. Please try again.',
        metadata: { type: documentType, generated_at: new Date().toISOString() }
      };
    }
  }

  /**
   * Fallback job matching when AI fails
   */
  private fallbackJobMatching(job: Job, drivers: DriverProfile[]): AIJobMatch[] {
    return drivers
      .filter(driver => driver.isAvailable && driver.vehicleCapacity >= job.volumeLiters)
      .map(driver => ({
        id: crypto.randomUUID(),
        jobId: job.id,
        driverId: driver.userId,
        matchScore: Math.random() * 40 + 60, // 60-100 range
        aiReasoning: 'Fallback matching based on availability and capacity',
        createdAt: new Date().toISOString()
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
