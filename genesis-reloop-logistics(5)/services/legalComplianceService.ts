import { supabase } from '../lib/supabase';

export const legalComplianceService = {
  // Get Terms of Service
  getTermsOfService: async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('content')
        .eq('type', 'terms_of_service')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return data.content;
      }

      // Fallback to default terms
      return `
        <h2>Terms of Service</h2>
        <p>Welcome to Genesis Reloop Logistics. By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
        
        <h3>1. Acceptance of Terms</h3>
        <p>By using the Service, you agree to comply with and be bound by these Terms. If you do not agree to these Terms, you may not use the Service.</p>
        
        <h3>2. Description of Service</h3>
        <p>Genesis Reloop Logistics is a circular economy platform connecting restaurants, waste collectors, and biofuel plants for Used Cooking Oil (UCO) collection and processing.</p>
        
        <h3>3. User Accounts</h3>
        <p>You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account and password.</p>
        
        <h3>4. Digital Waste Transfer Notes (DWTN)</h3>
        <p>All waste transfers are recorded as blockchain-based DWTNs for compliance and transparency.</p>
        
        <h3>5. Genesis Points</h3>
        <p>Drivers earn Genesis Points based on completed jobs, representing a share in platform profits.</p>
        
        <h3>6. Prohibited Conduct</h3>
        <p>You agree not to engage in fraudulent activities, provide false information, or violate any applicable laws.</p>
        
        <h3>7. Termination</h3>
        <p>We may terminate your account for violations of these Terms or for any other reason at our discretion.</p>
        
        <h3>8. Governing Law</h3>
        <p>These Terms are governed by the laws of England and Wales.</p>
      `;
    } catch (error) {
      console.error('Error getting Terms of Service:', error);
      throw error;
    }
  },

  // Get Privacy Policy
  getPrivacyPolicy: async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('content')
        .eq('type', 'privacy_policy')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return data.content;
      }

      // Fallback to default policy
      return `
        <h2>Privacy Policy</h2>
        <p>This Privacy Policy describes how Genesis Reloop Logistics collects, uses, and discloses your information.</p>
        
        <h3>1. Information We Collect</h3>
        <p>We collect personal information (name, email, address), usage data, and blockchain transaction data.</p>
        
        <h3>2. How We Use Your Information</h3>
        <p>We use information to provide services, process transactions, and ensure compliance with regulations.</p>
        
        <h3>3. Information Sharing</h3>
        <p>We may share information with service providers, other users involved in jobs, and legal authorities when required.</p>
        
        <h3>4. Data Security</h3>
        <p>We implement reasonable security measures to protect your information from unauthorized access.</p>
        
        <h3>5. Your Rights</h3>
        <p>You have the right to access, correct, or delete your personal data subject to legal requirements.</p>
        
        <h3>6. Blockchain Data</h3>
        <p>Information recorded on the blockchain is immutable and publicly accessible.</p>
        
        <h3>7. Contact Us</h3>
        <p>For privacy questions, contact us at privacy@genesisreloop.com.</p>
      `;
    } catch (error) {
      console.error('Error getting Privacy Policy:', error);
      throw error;
    }
  },

  // Get Cookie Policy
  getCookiePolicy: async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('content')
        .eq('type', 'cookie_policy')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return data.content;
      }

      // Fallback to default policy
      return `
        <h2>Cookie Policy</h2>
        <p>This Cookie Policy explains how Genesis Reloop Logistics uses cookies and similar technologies.</p>
        
        <h3>1. What Are Cookies</h3>
        <p>Cookies are small text files stored on your device when you visit our website.</p>
        
        <h3>2. Types of Cookies We Use</h3>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
          <li><strong>Analytics Cookies:</strong> Help us understand website usage</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
        </ul>
        
        <h3>3. Managing Cookies</h3>
        <p>You can control cookies through your browser settings, but disabling them may affect website functionality.</p>
        
        <h3>4. Third-Party Cookies</h3>
        <p>We use third-party services (Google Maps, Stripe) that may set their own cookies.</p>
      `;
    } catch (error) {
      console.error('Error getting Cookie Policy:', error);
      throw error;
    }
  },

  // Get Data Protection Officer contact
  getDPOContact: (): { email: string; phone: string; address: string } => {
    return {
      email: 'dpo@genesisreloop.com',
      phone: '+44 20 1234 5678',
      address: '123 Legal Street, London, SW1A 1AA, United Kingdom'
    };
  },

  // Check GDPR compliance
  checkGDPRCompliance: async (userId: string): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check consent status
      if (!user.consentGiven) {
        issues.push('User consent not recorded');
        recommendations.push('Obtain explicit consent for data processing');
      }

      // Check data retention
      const dataAge = new Date().getTime() - new Date(user.created_at).getTime();
      const maxRetention = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years in milliseconds
      
      if (dataAge > maxRetention) {
        issues.push('Data retention period exceeded');
        recommendations.push('Review data retention policy and delete old data');
      }

      // Check right to be forgotten
      if (user.deletedAt && !user.dataDeleted) {
        issues.push('Right to be forgotten not fully implemented');
        recommendations.push('Complete data deletion process');
      }

      return {
        compliant: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error checking GDPR compliance:', error);
      throw error;
    }
  },

  // Process data deletion request
  processDataDeletionRequest: async (userId: string, reason: string): Promise<{
    success: boolean;
    requestId: string;
    estimatedCompletion: string;
  }> => {
    try {
      const requestId = `DEL-${Date.now()}`;
      const estimatedCompletion = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      // Create deletion request record
      const { error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          request_id: requestId,
          reason,
          status: 'pending',
          estimated_completion: estimatedCompletion,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Mark user for deletion
      await supabase
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
          deletion_reason: reason
        })
        .eq('id', userId);

      return {
        success: true,
        requestId,
        estimatedCompletion
      };
    } catch (error) {
      console.error('Error processing data deletion request:', error);
      throw error;
    }
  },

  // Get compliance status
  getComplianceStatus: async (): Promise<{
    gdpr: boolean;
    wasteRegulations: boolean;
    dataProtection: boolean;
    lastAudit: string;
    nextAudit: string;
  }> => {
    try {
      // Mock compliance status
      return {
        gdpr: true,
        wasteRegulations: true,
        dataProtection: true,
        lastAudit: '2024-01-15',
        nextAudit: '2024-07-15'
      };
    } catch (error) {
      console.error('Error getting compliance status:', error);
      throw error;
    }
  },

  // Update legal documents
  updateLegalDocument: async (
    type: 'terms_of_service' | 'privacy_policy' | 'cookie_policy',
    content: string,
    version: string
  ): Promise<void> => {
    try {
      // Deactivate current version
      await supabase
        .from('legal_documents')
        .update({ active: false })
        .eq('type', type)
        .eq('active', true);

      // Insert new version
      const { error } = await supabase
        .from('legal_documents')
        .insert({
          type,
          content,
          version,
          active: true,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating legal document:', error);
      throw error;
    }
  }
};