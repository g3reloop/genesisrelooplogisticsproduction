/**
 * QR Code Generation Utility for DWTN
 * This utility generates QR codes for Digital Waste Transfer Notes
 */

export interface QRCodeData {
  batchId: string;
  verificationUrl: string;
  tokenId: number;
  timestamp: string;
}

export class QRCodeGenerator {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.VITE_APP_URL || 'https://genesisreloop.com';
  }

  /**
   * Generate QR code data for a DWTN
   */
  generateDWTNQRData(batchId: string, tokenId: number): QRCodeData {
    return {
      batchId,
      verificationUrl: `${this.baseUrl}/verify/${batchId}`,
      tokenId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate QR code URL using qrserver.com API
   */
  generateQRCodeURL(data: QRCodeData, size: number = 300): string {
    const qrData = JSON.stringify(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}`;
  }

  /**
   * Generate simple QR code URL with just the verification link
   */
  generateSimpleQRCodeURL(batchId: string, size: number = 300): string {
    const verificationUrl = `${this.baseUrl}/verify/${batchId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(verificationUrl)}`;
  }

  /**
   * Generate QR code for printing on collection manifests
   */
  generateManifestQRCode(batchId: string, tokenId: number): {
    qrCodeUrl: string;
    qrCodeData: QRCodeData;
    printData: {
      batchId: string;
      tokenId: number;
      verificationUrl: string;
      qrCodeUrl: string;
    };
  } {
    const qrCodeData = this.generateDWTNQRData(batchId, tokenId);
    const qrCodeUrl = this.generateQRCodeURL(qrCodeData, 200);

    return {
      qrCodeUrl,
      qrCodeData,
      printData: {
        batchId,
        tokenId,
        verificationUrl: qrCodeData.verificationUrl,
        qrCodeUrl
      }
    };
  }

  /**
   * Generate QR code for mobile scanning
   */
  generateMobileQRCode(batchId: string, tokenId: number): {
    qrCodeUrl: string;
    qrCodeData: QRCodeData;
  } {
    const qrCodeData = this.generateDWTNQRData(batchId, tokenId);
    const qrCodeUrl = this.generateQRCodeURL(qrCodeData, 400);

    return {
      qrCodeUrl,
      qrCodeData
    };
  }

  /**
   * Parse QR code data from scanned content
   */
  parseQRCodeData(qrContent: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrContent);
      
      // Validate required fields
      if (data.batchId && data.verificationUrl && data.tokenId && data.timestamp) {
        return data as QRCodeData;
      }
      
      // If it's just a URL, extract batch ID
      if (qrContent.includes('/verify/')) {
        const batchId = qrContent.split('/verify/')[1];
        return {
          batchId,
          verificationUrl: qrContent,
          tokenId: 0, // Will be fetched from blockchain
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      return null;
    }
  }

  /**
   * Generate QR code for batch verification
   */
  generateBatchVerificationQR(batchId: string): {
    qrCodeUrl: string;
    verificationUrl: string;
  } {
    const verificationUrl = `${this.baseUrl}/verify/${batchId}`;
    const qrCodeUrl = this.generateSimpleQRCodeURL(batchId, 300);

    return {
      qrCodeUrl,
      verificationUrl
    };
  }

  /**
   * Generate QR code for driver collection
   */
  generateCollectionQR(batchId: string, tokenId: number, collectionAddress: string): {
    qrCodeUrl: string;
    qrCodeData: QRCodeData & { collectionAddress: string };
  } {
    const baseData = this.generateDWTNQRData(batchId, tokenId);
    const extendedData = {
      ...baseData,
      collectionAddress
    };

    const qrCodeUrl = this.generateQRCodeURL(extendedData, 300);

    return {
      qrCodeUrl,
      qrCodeData: extendedData
    };
  }

  /**
   * Generate QR code for processor verification
   */
  generateProcessorVerificationQR(batchId: string, processorId: string): {
    qrCodeUrl: string;
    qrCodeData: QRCodeData & { processorId: string };
  } {
    const baseData = this.generateDWTNQRData(batchId, 0);
    const extendedData = {
      ...baseData,
      processorId
    };

    const qrCodeUrl = this.generateQRCodeURL(extendedData, 300);

    return {
      qrCodeUrl,
      qrCodeData: extendedData
    };
  }
}

// Export singleton instance
export const qrCodeGenerator = new QRCodeGenerator();
export default qrCodeGenerator;
