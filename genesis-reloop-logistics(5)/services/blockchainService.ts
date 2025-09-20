import { ethers } from 'ethers';
import { Job, DWTNRecord, User } from '../types';

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string;
  private contractABI: any[];

  constructor() {
    this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '';
    this.contractABI = this.getContractABI();
    this.initializeProvider();
  }

  // Initialize provider and wallet
  private initializeProvider(): void {
    try {
      const rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      const privateKey = import.meta.env.VITE_PRIVATE_KEY;
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.initializeContract();
      }
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
    }
  }

  // Initialize contract
  private initializeContract(): void {
    if (this.wallet && this.contractAddress) {
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        this.wallet
      );
    }
  }

  // Get contract ABI
  private getContractABI(): any[] {
    return [
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "dwtnNumber",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "supplierDetails",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "driverDetails",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "buyerDetails",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "wasteDetails",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "collectionDetails",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "deliveryDetails",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "complianceData",
            "type": "string"
          }
        ],
        "name": "createDWTN",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "dwtnNumber",
            "type": "string"
          }
        ],
        "name": "getDWTN",
        "outputs": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "dwtnNumber",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "supplierDetails",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "driverDetails",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "buyerDetails",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "wasteDetails",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "collectionDetails",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "deliveryDetails",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "complianceData",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
              },
              {
                "internalType": "address",
                "name": "creator",
                "type": "address"
              }
            ],
            "internalType": "struct GenesisDWTN.DWTNRecord",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "dwtnNumber",
            "type": "string"
          }
        ],
        "name": "verifyDWTN",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "string",
            "name": "dwtnNumber",
            "type": "string"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "name": "DWTNCreated",
        "type": "event"
      }
    ];
  }

  // Create DWTN on blockchain
  async createDWTN(
    job: Job,
    supplier: User,
    driver: User,
    buyer: User
  ): Promise<{ txHash: string; blockNumber: number }> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const dwtnNumber = this.generateDWTNNumber();
      
      const supplierDetails = JSON.stringify({
        id: supplier.id,
        name: supplier.name,
        address: supplier.address,
        phone: supplier.phone,
        email: supplier.email,
        companiesHouseNumber: supplier.companiesHouseNumber,
      });

      const driverDetails = JSON.stringify({
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        licenseNumber: driver.licenseNumber,
        vehicleRegistration: driver.vehicleReg,
        vehicleType: driver.vehicleType,
      });

      const buyerDetails = JSON.stringify({
        id: buyer.id,
        name: buyer.name,
        address: buyer.address,
        phone: buyer.phone,
        email: buyer.email,
        facilityName: buyer.facilityName,
      });

      const wasteDetails = JSON.stringify({
        volume: job.volume,
        confirmedVolume: job.confirmedVolume || job.volume,
        contamination: job.contamination,
        state: job.state,
        description: job.description,
      });

      const collectionDetails = JSON.stringify({
        pickupAddress: job.pickupAddress,
        pickupCoordinates: job.pickupCoordinates,
        actualPickupTime: job.actualPickupTime,
        estimatedPickupTime: job.estimatedPickupTime,
        specialInstructions: job.specialInstructions,
      });

      const deliveryDetails = JSON.stringify({
        deliveryAddress: job.deliveryAddress,
        deliveryCoordinates: job.deliveryCoordinates,
        actualDeliveryTime: job.actualDeliveryTime,
        estimatedDeliveryTime: job.estimatedDeliveryTime,
      });

      const complianceData = JSON.stringify({
        jobId: job.id,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        genesisPointsReward: job.genesisPointsReward,
        paymentAmount: job.paymentAmount,
        paymentStatus: job.paymentStatus,
      });

      const tx = await this.contract.createDWTN(
        dwtnNumber,
        supplierDetails,
        driverDetails,
        buyerDetails,
        wasteDetails,
        collectionDetails,
        deliveryDetails,
        complianceData
      );

      const receipt = await tx.wait();
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('Error creating DWTN:', error);
      throw new Error(`Failed to create DWTN: ${error.message}`);
    }
  }

  // Get DWTN from blockchain
  async getDWTN(dwtnNumber: string): Promise<DWTNRecord | null> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const dwtn = await this.contract.getDWTN(dwtnNumber);
      
      if (!dwtn || dwtn.dwtnNumber === '') {
        return null;
      }

      return {
        id: '', // Will be set by database
        jobId: '', // Will be set by database
        dwtnNumber: dwtn.dwtnNumber,
        blockchainTxHash: '', // Will be set by caller
        blockchainBlockNumber: dwtn.timestamp,
        supplierDetails: JSON.parse(dwtn.supplierDetails),
        driverDetails: JSON.parse(dwtn.driverDetails),
        buyerDetails: JSON.parse(dwtn.buyerDetails),
        wasteDetails: JSON.parse(dwtn.wasteDetails),
        collectionDetails: JSON.parse(dwtn.collectionDetails),
        deliveryDetails: JSON.parse(dwtn.deliveryDetails),
        complianceData: JSON.parse(dwtn.complianceData),
        createdAt: new Date(Number(dwtn.timestamp) * 1000).toISOString(),
        verifiedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error getting DWTN:', error);
      throw new Error(`Failed to get DWTN: ${error.message}`);
    }
  }

  // Verify DWTN exists on blockchain
  async verifyDWTN(dwtnNumber: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      return await this.contract.verifyDWTN(dwtnNumber);
    } catch (error: any) {
      console.error('Error verifying DWTN:', error);
      return false;
    }
  }

  // Generate unique DWTN number
  private generateDWTNNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DWTN-${timestamp}-${random}`;
  }

  // Get current block number
  async getCurrentBlockNumber(): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.getBlockNumber();
    } catch (error: any) {
      console.error('Error getting block number:', error);
      throw new Error(`Failed to get block number: ${error.message}`);
    }
  }

  // Get transaction details
  async getTransactionDetails(txHash: string): Promise<any> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      return {
        transaction: tx,
        receipt: receipt,
      };
    } catch (error: any) {
      console.error('Error getting transaction details:', error);
      throw new Error(`Failed to get transaction details: ${error.message}`);
    }
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.wallet !== null && this.contract !== null;
  }

  // Get wallet address
  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  // Get network info
  async getNetworkInfo(): Promise<{ name: string; chainId: number } | null> {
    if (!this.provider) {
      return null;
    }

    try {
      const network = await this.provider.getNetwork();
      return {
        name: network.name,
        chainId: Number(network.chainId),
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  // Estimate gas for DWTN creation
  async estimateGasForDWTN(
    dwtnNumber: string,
    supplierDetails: string,
    driverDetails: string,
    buyerDetails: string,
    wasteDetails: string,
    collectionDetails: string,
    deliveryDetails: string,
    complianceData: string
  ): Promise<bigint> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.createDWTN.estimateGas(
        dwtnNumber,
        supplierDetails,
        driverDetails,
        buyerDetails,
        wasteDetails,
        collectionDetails,
        deliveryDetails,
        complianceData
      );
    } catch (error: any) {
      console.error('Error estimating gas:', error);
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
