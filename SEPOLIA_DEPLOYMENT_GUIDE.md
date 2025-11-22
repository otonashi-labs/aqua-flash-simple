# Sepolia Testnet Deployment Guide

Step-by-step guide to deploy and test FlashLoan on Sepolia testnet.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js and Yarn installed
- Sepolia testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Alchemy or Infura RPC endpoint
- Etherscan API key (optional, for verification)

### 2. Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.template .env
```

Edit `.env` with your credentials:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_private_key_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Important Security Notes:**
- ⚠️ Never commit `.env` to git (it's already in .gitignore)
- ⚠️ Use a test wallet, never use mainnet wallet with real funds
- ⚠️ Keep your private key secure

### 3. Get Sepolia ETH

You'll need at least 0.05 ETH on Sepolia for deployment and testing (~0.08 ETH recommended).

**Faucets:**
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

### 4. Deploy Contracts

```bash
# Build contracts first
yarn build

# Deploy to Sepolia
yarn deploy:sepolia
```

This will deploy:
- ✅ Aqua
- ✅ XYCSwap
- ✅ FlashLoan
- ✅ FlashLoanExecutor

Deployment addresses will be saved in `deployments/sepolia/`.

**Expected output:**
```
Starting Aqua deployment...

Network: 11155111
Deployer address: 0x...

Deploying Aqua contract...
Aqua deployed to: 0x...

Deploying XYCSwap contract...
XYCSwap deployed to: 0x...

Deploying FlashLoan contract...
FlashLoan deployed to: 0x...

Deploying FlashLoanExecutor contract...
FlashLoanExecutor deployed to: 0x...

✅ Deployment completed successfully!
```

### 5. Test Flash Loans

Run the test script:

```bash
yarn test:sepolia
```

This will:
1. Deploy a test token (or use existing if TEST_TOKEN_ADDRESS is set)
2. Mint tokens for testing
3. Create a flash loan strategy
4. Ship liquidity to Aqua
5. Execute a test flash loan
6. Verify results

**Expected output:**
```
🚀 Testing FlashLoan on Sepolia

📍 Using deployed contracts:
  Aqua: 0x...
  FlashLoan: 0x...
  FlashLoanExecutor: 0x...

👤 Deployer: 0x...
💰 Balance: 0.5 ETH

🪙 Deploying test token...
   Test token deployed to: 0x...

🏦 Minting tokens...
   Minted 10000.0 TEST tokens to deployer
   Minted 10000.0 TEST tokens to executor

✅ Approving Aqua...
   Approved

📋 Flash Loan Strategy:
   Maker: 0x...
   Token: 0x...
   Fee: 9 bps (0.09%)

🚢 Shipping liquidity to Aqua...
   Amount: 1000.0 TEST
   ✅ Liquidity shipped

💧 Available liquidity: 1000.0 TEST

🧮 Flash Loan Test:
   Borrow amount: 100.0 TEST
   Fee: 0.09 TEST
   Repay amount: 100.09 TEST

⚡ Executing flash loan...
   ✅ Flash loan executed successfully!
   Gas used: ~95000
   Fee earned by maker: 0.09 TEST

✅ All tests passed successfully!

🎉 FlashLoan is working on Sepolia testnet!
```

### 6. Verify Contracts (Optional)

Verify contracts on Etherscan:

```bash
yarn verify:sepolia
```

This makes your contracts readable on Etherscan with source code.

## 📋 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Deploy | `yarn deploy:sepolia` | Deploy all contracts to Sepolia |
| Test | `yarn test:sepolia` | Run flash loan test on Sepolia |
| Verify | `yarn verify:sepolia` | Verify contracts on Etherscan |

## 🔍 Monitoring on Etherscan

After deployment, you can view your contracts on Sepolia Etherscan:

- **Aqua**: `https://sepolia.etherscan.io/address/YOUR_AQUA_ADDRESS`
- **FlashLoan**: `https://sepolia.etherscan.io/address/YOUR_FLASHLOAN_ADDRESS`

Check the deployment addresses in `deployments/sepolia/*.json`

## 🧪 Manual Testing

If you want to interact manually with the contracts:

### Using Hardhat Console

```bash
npx hardhat console --network sepolia
```

Then in the console:

```javascript
// Get contract instances
const Aqua = await ethers.getContractFactory('Aqua');
const aqua = Aqua.attach('YOUR_AQUA_ADDRESS');

const FlashLoan = await ethers.getContractFactory('FlashLoan');
const flashLoan = FlashLoan.attach('YOUR_FLASHLOAN_ADDRESS');

// Check available liquidity
const strategy = {
  maker: 'MAKER_ADDRESS',
  token: 'TOKEN_ADDRESS',
  feeBps: 9,
  salt: ethers.ZeroHash
};

const liquidity = await flashLoan.getAvailableLiquidity(strategy);
console.log('Available:', ethers.formatEther(liquidity));
```

### Using Etherscan (After Verification)

1. Go to your FlashLoan contract on Etherscan
2. Click "Contract" tab
3. Click "Write Contract"
4. Connect your wallet
5. Call functions like `flashLoan()`, `calculateFee()`, etc.

## 🐛 Troubleshooting

### Error: "Insufficient funds"
- Get more Sepolia ETH from faucets
- Check your wallet balance

### Error: "Cannot find deployment addresses"
- Run `yarn deploy:sepolia` first
- Check that `deployments/sepolia/` directory exists

### Error: "Network error"
- Check your RPC URL in `.env`
- Try a different RPC provider (Alchemy, Infura, QuickNode)

### Error: "Nonce too high"
- Reset your MetaMask account (Settings → Advanced → Clear activity data)
- Or wait a few minutes

### Gas Estimation Failed
- Make sure you have enough ETH
- Check that contracts are deployed correctly
- Try increasing gas limit manually

## 💡 Tips

### Save Gas
- Use a higher gas price for faster deployment
- Deploy during low network usage (weekends)
- Batch transactions when possible

### Reuse Test Token
After first run, save the test token address:
```env
TEST_TOKEN_ADDRESS=0x...
```

This avoids deploying a new token each time.

### Multiple Strategies
You can create multiple flash loan strategies with different:
- Tokens
- Fee rates
- Makers (liquidity providers)

## 🔐 Security Reminders

- ✅ Test on Sepolia before mainnet
- ✅ Use small amounts initially
- ✅ Verify all transactions on Etherscan
- ✅ Keep private keys secure
- ✅ Use hardware wallet for mainnet
- ❌ Never share your private key
- ❌ Never commit `.env` to git

## 📊 Expected Costs

Approximate gas costs on Sepolia (at 10 gwei):

| Action | Gas Used | Cost (ETH) |
|--------|----------|------------|
| Deploy Aqua | ~2,000,000 | 0.02 |
| Deploy FlashLoan | ~1,500,000 | 0.015 |
| Deploy FlashLoanExecutor | ~800,000 | 0.008 |
| Ship Liquidity | ~200,000 | 0.002 |
| Execute Flash Loan | ~95,000 | 0.00095 |
| **Total** | ~4,595,000 | **~0.046 ETH** |

Get at least **0.05-0.08 ETH** to be safe.

## 🎯 Next Steps

After successful Sepolia testing:

1. **Audit** - Get code audited before mainnet
2. **Optimize** - Fine-tune gas optimizations
3. **Monitor** - Set up monitoring and alerts
4. **Scale** - Add more features if needed
5. **Mainnet** - Deploy to Ethereum mainnet

## 🆘 Getting Help

If you encounter issues:

1. Check the error message carefully
2. Search in Hardhat/Ethers documentation
3. Check Sepolia block explorer for transaction details
4. Review contract events and logs
5. Try with different RPC providers

## 📚 Resources

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Hardhat Documentation](https://hardhat.org/)
- [1inch Aqua Documentation](https://github.com/1inch/aqua)

---

**Happy Testing! 🚀**

