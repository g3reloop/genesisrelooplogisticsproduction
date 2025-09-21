import { ethers } from 'ethers';
import { DWTNRecord, DWTNStatus } from '../types';

// DWTN Contract ABI (simplified for this example)
const DWTN_CONTRACT_ABI = [
  "function mintDWTN(address to, string memory batchId, address origin, uint256 volume, string memory collectionGPS, string memory restaurantDetails, string memory metadataURI) external returns (uint256)",
  "function updateStatus(uint256 tokenId, uint8 newStatus) external",
  "function recordDelivery(uint256 tokenId, address processor, string memory deliveryGPS, string memory processorDetails) external",
  "function verifyDWTN(uint256 tokenId, bool verified) external",
  "function getDWTNData(uint256 tokenId) external view returns (tuple(string batchId, address origin, address collector, address processor, uint256 volume, uint256 collectionTime, uint256 deliveryTime, string collectionGPS, string deliveryGPS, string restaurantDetails, string processorDetails, uint8 status, string metadataURI, bool isVerified))",
  "function getDWTNByBatch(string memory batchId) external view returns (tuple(string batchId, address origin, address collector, address processor, uint256 volume, uint256 collectionTime, uint256 deliveryTime, string collectionGPS, string deliveryGPS, string restaurantDetails, string processorDetails, uint8 status, string metadataURI, bool isVerified))",
  "function getTokensByOwner(address owner) external view returns (uint256[] memory)",
  "function getTokensByStatus(uint8 status) external view returns (uint256[] memory)",
  "function totalSupply() external view returns (uint256)",
  "event DWTNMinted(uint256 indexed tokenId, string batchId, address indexed origin, address indexed collector, uint256 volume)",
  "event DWTNStatusUpdated(uint256 indexed tokenId, uint8 oldStatus, uint8 newStatus)",
  "event DWTNDelivered(uint256 indexed tokenId, address indexed processor, uint256 deliveryTime)",
  "event DWTNVerified(uint256 indexed tokenId, address indexed processor, bool verified)"
];

// Polygon Mumbai Testnet configuration
const POLYGON_MUMBAI_RPC = 'https://rpc-mumbai.maticvigil.com';
const DWTN_CONTRACT_ADDRESS = process.env.VITE_DWTN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(POLYGON_MUMBAI_RPC);
    this.contract = new ethers.Contract(DWTN_CONTRACT_ADDRESS, DWTN_CONTRACT_ABI, this.provider);
  }

  /**
   * Connect wallet and set signer
   */
  async connectWallet(): Promise<string> {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.signer = this.provider.getSigner(accounts[0]);
      this.contract = this.contract.connect(this.signer);
      return accounts[0];
    }
    throw new Error('MetaMask not found');
  }

  /**
   * Mint a new DWTN NFT
   */
  async mintDWTN(dwtData: {
    to: string;
    batchId: string;
    origin: string;
    volume: number;
    collectionGPS: string;
    restaurantDetails: string;
    metadataURI: string;
  }): Promise<{ tokenId: number; txHash: string }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.contract.mintDWTN(
        dwtData.to,
        dwtData.batchId,
        dwtData.origin,
        ethers.utils.parseEther(dwtData.volume.toString()),
        dwtData.collectionGPS,
        dwtData.restaurantDetails,
        dwtData.metadataURI
      );

      const receipt = await tx.wait();
      const tokenId = receipt.events[0].args.tokenId.toNumber();

      return {
        tokenId,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error minting DWTN:', error);
      throw new Error('Failed to mint DWTN');
    }
  }

  /**
   * Update DWTN status
   */
  async updateDWTNStatus(tokenId: number, status: DWTNStatus): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.contract.updateStatus(tokenId, status);
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error updating DWTN status:', error);
      throw new Error('Failed to update DWTN status');
    }
  }

  /**
   * Record delivery to processor
   */
  async recordDelivery(
    tokenId: number,
    processor: string,
    deliveryGPS: string,
    processorDetails: string
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.contract.recordDelivery(
        tokenId,
        processor,
        deliveryGPS,
        processorDetails
      );
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error recording delivery:', error);
      throw new Error('Failed to record delivery');
    }
  }

  /**
   * Verify DWTN by processor
   */
  async verifyDWTN(tokenId: number, verified: boolean): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.contract.verifyDWTN(tokenId, verified);
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error verifying DWTN:', error);
      throw new Error('Failed to verify DWTN');
    }
  }

  /**
   * Get DWTN data by token ID
   */
  async getDWTNData(tokenId: number): Promise<DWTNRecord> {
    try {
      const data = await this.contract.getDWTNData(tokenId);
      
      return {
        id: tokenId.toString(),
        tokenId,
        batchId: data.batchId,
        originId: data.origin,
        collectorId: data.collector,
        processorId: data.processor !== ethers.constants.AddressZero ? data.processor : undefined,
        volumeLiters: parseFloat(ethers.utils.formatEther(data.volume)),
        collectionTime: new Date(data.collectionTime.toNumber() * 1000).toISOString(),
        deliveryTime: data.deliveryTime.toNumber() > 0 ? new Date(data.deliveryTime.toNumber() * 1000).toISOString() : undefined,
        collectionGps: this.parseGPS(data.collectionGPS),
        deliveryGps: data.deliveryGPS ? this.parseGPS(data.deliveryGPS) : undefined,
        restaurantDetails: JSON.parse(data.restaurantDetails),
        processorDetails: data.processorDetails ? JSON.parse(data.processorDetails) : undefined,
        status: this.mapStatus(data.status),
        metadataUri: data.metadataURI,
        isVerified: data.isVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching DWTN data:', error);
      throw new Error('Failed to fetch DWTN data');
    }
  }

  /**
   * Get DWTN data by batch ID
   */
  async getDWTNByBatch(batchId: string): Promise<DWTNRecord> {
    try {
      const data = await this.contract.getDWTNByBatch(batchId);
      
      return {
        id: data.tokenId.toString(),
        tokenId: data.tokenId.toNumber(),
        batchId: data.batchId,
        originId: data.origin,
        collectorId: data.collector,
        processorId: data.processor !== ethers.constants.AddressZero ? data.processor : undefined,
        volumeLiters: parseFloat(ethers.utils.formatEther(data.volume)),
        collectionTime: new Date(data.collectionTime.toNumber() * 1000).toISOString(),
        deliveryTime: data.deliveryTime.toNumber() > 0 ? new Date(data.deliveryTime.toNumber() * 1000).toISOString() : undefined,
        collectionGps: this.parseGPS(data.collectionGPS),
        deliveryGps: data.deliveryGPS ? this.parseGPS(data.deliveryGPS) : undefined,
        restaurantDetails: JSON.parse(data.restaurantDetails),
        processorDetails: data.processorDetails ? JSON.parse(data.processorDetails) : undefined,
        status: this.mapStatus(data.status),
        metadataUri: data.metadataURI,
        isVerified: data.isVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching DWTN by batch:', error);
      throw new Error('Failed to fetch DWTN by batch');
    }
  }

  /**
   * Get tokens owned by an address
   */
  async getTokensByOwner(owner: string): Promise<number[]> {
    try {
      const tokens = await this.contract.getTokensByOwner(owner);
      return tokens.map((token: any) => token.toNumber());
    } catch (error) {
      console.error('Error fetching tokens by owner:', error);
      throw new Error('Failed to fetch tokens by owner');
    }
  }

  /**
   * Get tokens by status
   */
  async getTokensByStatus(status: DWTNStatus): Promise<number[]> {
    try {
      const tokens = await this.contract.getTokensByStatus(status);
      return tokens.map((token: any) => token.toNumber());
    } catch (error) {
      console.error('Error fetching tokens by status:', error);
      throw new Error('Failed to fetch tokens by status');
    }
  }

  /**
   * Get total supply of DWTN tokens
   */
  async getTotalSupply(): Promise<number> {
    try {
      const total = await this.contract.totalSupply();
      return total.toNumber();
    } catch (error) {
      console.error('Error fetching total supply:', error);
      throw new Error('Failed to fetch total supply');
    }
  }

  /**
   * Generate QR code data for DWTN
   */
  generateQRCodeData(batchId: string): string {
    const baseUrl = process.env.VITE_APP_URL || 'https://genesisreloop.com';
    return `${baseUrl}/verify/${batchId}`;
  }

  /**
   * Parse GPS coordinates from string
   */
  private parseGPS(gpsString: string): { lat: number; lng: number } | undefined {
    if (!gpsString) return undefined;
    
    try {
      const [lat, lng] = gpsString.split(',').map(coord => parseFloat(coord.trim()));
      return { lat, lng };
    } catch (error) {
      console.error('Error parsing GPS coordinates:', error);
      return undefined;
    }
  }

  /**
   * Map blockchain status to DWTNStatus enum
   */
  private mapStatus(status: number): DWTNStatus {
    const statusMap = {
      0: DWTNStatus.MINTED,
      1: DWTNStatus.IN_TRANSIT,
      2: DWTNStatus.DELIVERED,
      3: DWTNStatus.VERIFIED,
      4: DWTNStatus.COMPLETED
    };
    return statusMap[status as keyof typeof statusMap] || DWTNStatus.MINTED;
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.signer !== null;
  }

  /**
   * Get current account address
   */
  async getCurrentAccount(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;