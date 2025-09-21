# Smart Contract Deployment Guide

This guide explains how to deploy the Digital Waste Transfer Note (DWTN) smart contract to the Polygon network.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **MetaMask** wallet with MATIC tokens
4. **Hardhat** or **Truffle** for deployment
5. **Polygon RPC URL** (Mumbai testnet or mainnet)

## Environment Setup

1. Install dependencies:
```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npm install @openzeppelin/contracts
```

2. Create a `.env` file in the project root:
```env
# Polygon Mumbai Testnet
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_wallet_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here

# Polygon Mainnet (for production)
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com
```

## Hardhat Configuration

Create `hardhat.config.js`:

```javascript
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 20000000000, // 20 gwei
    },
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 30000000000, // 30 gwei
    }
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
    }
  }
};
```

## Deployment Script

Create `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DWTN Contract...");

  const DWTNContract = await ethers.getContractFactory("DWTNContract");
  const dwtnContract = await DWTNContract.deploy();

  await dwtnContract.deployed();

  console.log("DWTN Contract deployed to:", dwtnContract.address);
  console.log("Transaction hash:", dwtnContract.deployTransaction.hash);

  // Verify contract on PolygonScan
  if (network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await dwtnContract.deployTransaction.wait(6);
    
    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: dwtnContract.address,
        constructorArguments: [],
      });
      console.log("Contract verified on PolygonScan!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  return dwtnContract.address;
}

main()
  .then((address) => {
    console.log("Deployment completed successfully!");
    console.log("Contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
```

## Deployment Steps

### 1. Deploy to Mumbai Testnet

```bash
# Compile contracts
npx hardhat compile

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.js --network mumbai
```

### 2. Deploy to Polygon Mainnet

```bash
# Deploy to Polygon mainnet
npx hardhat run scripts/deploy.js --network polygon
```

## Contract Verification

After deployment, verify the contract on PolygonScan:

```bash
# Verify on Mumbai
npx hardhat verify --network mumbai <CONTRACT_ADDRESS>

# Verify on Polygon
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

## Frontend Integration

Update your environment variables:

```env
# Add to .env.local
VITE_DWTN_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
```

## Contract Functions

### Core Functions

1. **mintDWTN** - Mint a new DWTN NFT
2. **updateStatus** - Update DWTN status
3. **recordDelivery** - Record delivery to processor
4. **verifyDWTN** - Verify DWTN by processor
5. **getDWTNData** - Get DWTN data by token ID
6. **getDWTNByBatch** - Get DWTN data by batch ID

### View Functions

1. **getTokensByOwner** - Get tokens owned by address
2. **getTokensByStatus** - Get tokens by status
3. **totalSupply** - Get total number of minted tokens

## Gas Optimization

The contract is optimized for gas efficiency:

- Uses `uint256` for token IDs (cheaper than `uint32`)
- Implements efficient storage patterns
- Uses events for off-chain indexing
- Minimal external calls

## Security Considerations

1. **Access Control**: Only authorized users can mint/update DWTNs
2. **Input Validation**: All inputs are validated
3. **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
4. **Pausable**: Contract can be paused in emergencies

## Monitoring

Set up monitoring for:

1. **Contract Events**: Monitor minting, transfers, and status updates
2. **Gas Usage**: Track gas consumption patterns
3. **Error Rates**: Monitor failed transactions
4. **User Activity**: Track user interactions

## Upgrade Path

For future upgrades:

1. Use proxy patterns (OpenZeppelin Upgradeable)
2. Implement versioning in contract
3. Plan migration strategies
4. Maintain backward compatibility

## Testing

Run comprehensive tests:

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/DWTNContract.test.js

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test
```

## Troubleshooting

### Common Issues

1. **Out of Gas**: Increase gas limit
2. **Nonce Issues**: Reset MetaMask nonce
3. **Network Issues**: Check RPC URL
4. **Verification Fails**: Wait for block confirmations

### Debug Commands

```bash
# Check contract state
npx hardhat console --network mumbai
> const contract = await ethers.getContractAt("DWTNContract", "CONTRACT_ADDRESS")
> await contract.totalSupply()

# Check transaction
npx hardhat verify --network mumbai --show-stack-traces <CONTRACT_ADDRESS>
```

## Production Checklist

- [ ] Contract deployed to Polygon mainnet
- [ ] Contract verified on PolygonScan
- [ ] Frontend updated with contract address
- [ ] Environment variables configured
- [ ] Monitoring set up
- [ ] Documentation updated
- [ ] Team trained on contract functions
- [ ] Backup deployment strategy ready

## Support

For issues or questions:

1. Check PolygonScan for transaction status
2. Review contract source code
3. Check gas prices on Polygon Gas Station
4. Contact development team

## Contract Addresses

### Mumbai Testnet
- DWTN Contract: `TBD` (Update after deployment)

### Polygon Mainnet
- DWTN Contract: `TBD` (Update after deployment)

Remember to update these addresses in your frontend configuration after deployment.
