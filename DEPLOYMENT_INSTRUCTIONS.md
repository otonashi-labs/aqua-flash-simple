# DualFlashLoan Deployment Instructions

## 🚀 Deploying to Sepolia Testnet

### Prerequisites

Make sure your `.env` file contains:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**Note**: `PRIVATE_KEY` should be without the `0x` prefix.

### Existing Deployments

Your current contracts on Sepolia:

```
Aqua:                0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF
XYCSwap:             0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA
FlashLoan:           0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3
FlashLoanExecutor:   0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090
```

### Step 1: Build Contracts

```bash
npx hardhat compile
```

### Step 2: Deploy DualFlashLoan Contracts

```bash
npx hardhat deploy --network sepolia --tags DualFlashLoan
```

This will:
- ✅ Deploy `DualFlashLoan` (using existing Aqua at 0x97f393...)
- ✅ Deploy `DualFlashLoanExecutor`
- ✅ Automatically verify both contracts on Etherscan

### Expected Output

```
Starting DualFlashLoan deployment...

Network: 11155111
Deployer address: 0x...

Using existing Aqua at: 0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF

🚀 Deploying DualFlashLoan contract...
✅ DualFlashLoan deployed to: 0x...

🚀 Deploying DualFlashLoanExecutor contract...
✅ DualFlashLoanExecutor deployed to: 0x...

✅ Deployment completed successfully!

📝 Deployment Summary:
==================================================
Existing Contracts:
  Aqua:                0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF
  XYCSwap:             0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA
  FlashLoan:           0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3
  FlashLoanExecutor:   0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090

Newly Deployed:
  DualFlashLoan:       0x...
  DualFlashLoanExecutor: 0x...
==================================================
```

### Step 3: Verify Deployment

Check the contracts on Sepolia Etherscan:
- https://sepolia.etherscan.io/address/[DualFlashLoan_ADDRESS]
- https://sepolia.etherscan.io/address/[DualFlashLoanExecutor_ADDRESS]

### Manual Verification (If Needed)

If automatic verification fails, use these commands:

**DualFlashLoan:**
```bash
npx hardhat verify --network sepolia <DUAL_FLASHLOAN_ADDRESS> 0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF
```

**DualFlashLoanExecutor:**
```bash
npx hardhat verify --network sepolia <DUAL_FLASHLOAN_EXECUTOR_ADDRESS>
```

### Troubleshooting

#### "Insufficient funds" error
Make sure your deployer wallet has enough Sepolia ETH. Get free testnet ETH from:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

#### "Invalid API Key" error
Double-check your `ETHERSCAN_API_KEY` in `.env`:
1. Go to https://etherscan.io/myapikey
2. Create a new API key
3. Copy it to your `.env` file

#### "Already verified" message
This is normal! It means the contract was already verified (good news).

#### Verification pending
Sometimes Etherscan verification is slow. Wait a few minutes and check:
```bash
npx hardhat verify --network sepolia <ADDRESS> <CONSTRUCTOR_ARGS>
```

### Testing After Deployment

Once deployed, you can test the DualFlashLoan contract:

```typescript
// Using ethers.js
const dualFlashLoan = await ethers.getContractAt(
    'DualFlashLoan',
    '<DEPLOYED_ADDRESS>'
);

// Check if it's connected to the right Aqua
const aquaAddress = await dualFlashLoan.AQUA();
console.log('Aqua:', aquaAddress); // Should be 0x97f393...

// Check max fee
const maxFee = await dualFlashLoan.MAX_FEE_BPS();
console.log('Max Fee:', maxFee.toString()); // Should be 1000 (10%)
```

### Gas Costs (Estimated)

| Contract | Deployment Gas | Cost @ 50 gwei |
|----------|----------------|----------------|
| DualFlashLoan | ~2.5M gas | ~0.125 ETH |
| DualFlashLoanExecutor | ~1.5M gas | ~0.075 ETH |
| **Total** | **~4M gas** | **~0.2 ETH** |

**Note**: Actual costs may vary based on network congestion.

### Next Steps

After successful deployment:

1. ✅ Save the deployed addresses
2. ✅ Verify contracts on Etherscan
3. ✅ Update your documentation with new addresses
4. ✅ Test basic functionality (getAvailableLiquidity, etc.)
5. ✅ Share addresses with your team

### Contract Addresses Template

Once deployed, fill this in:

```
Sepolia Testnet - Contract Addresses
====================================

Core Protocol:
  Aqua:                0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF

AMM:
  XYCSwap:             0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA

Flash Loans:
  FlashLoan:           0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3
  FlashLoanExecutor:   0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090
  DualFlashLoan:       [TO BE FILLED]
  DualFlashLoanExecutor: [TO BE FILLED]
```

### Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Hardhat console output for specific errors
3. Verify your `.env` variables are correct
4. Ensure you have sufficient Sepolia ETH

---

**Ready to deploy?** Run: `npx hardhat deploy --network sepolia --tags DualFlashLoan`

