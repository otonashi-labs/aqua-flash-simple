# Sepolia Testnet - Deployed Contracts

**Network**: Sepolia (Chain ID: 11155111)  
**Deployment Date**: November 22, 2025  
**Deployer**: 0x11111111F37bAaa4c10B14aFdc124C1bbd64dA95

---

## 📦 All Contract Addresses

### Core Protocol

| Contract | Address | Verified |
|----------|---------|----------|
| **Aqua** | `0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF` | ✅ |

### AMM (XYC Constant Product)

| Contract | Address | Verified |
|----------|---------|----------|
| **XYCSwap** | `0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA` | ✅ |

### Single Flash Loans

| Contract | Address | Verified |
|----------|---------|----------|
| **FlashLoan** | `0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3` | ✅ |
| **FlashLoanExecutor** | `0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090` | ✅ |

### Dual Flash Loans ✨ NEW

| Contract | Address | Verified |
|----------|---------|----------|
| **DualFlashLoan** | `0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8` | ✅ ✅ |
| **DualFlashLoanExecutor** | `0xfe2D77D038e05B8de20adb15b05a894AF00081a0` | ✅ ✅ |

---

## 🔗 Etherscan Links

### Core
- [Aqua](https://sepolia.etherscan.io/address/0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF#code)

### AMM
- [XYCSwap](https://sepolia.etherscan.io/address/0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA#code)

### Single Flash Loans
- [FlashLoan](https://sepolia.etherscan.io/address/0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3#code)
- [FlashLoanExecutor](https://sepolia.etherscan.io/address/0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090#code)

### Dual Flash Loans
- [**DualFlashLoan**](https://sepolia.etherscan.io/address/0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8#code) ⭐
- [**DualFlashLoanExecutor**](https://sepolia.etherscan.io/address/0xfe2D77D038e05B8de20adb15b05a894AF00081a0#code) ⭐

---

## 🔍 Sourcify Verification

Both new contracts are also verified on Sourcify for maximum transparency:

- [DualFlashLoan on Sourcify](https://repo.sourcify.dev/contracts/full_match/11155111/0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8/)
- [DualFlashLoanExecutor on Sourcify](https://repo.sourcify.dev/contracts/full_match/11155111/0xfe2D77D038e05B8de20adb15b05a894AF00081a0/)

---

## 📊 Deployment Statistics

| Contract | Gas Used | TX Hash |
|----------|----------|---------|
| **DualFlashLoan** | 994,813 | [0x277ebbdfa160a8f46bd11274449ee3b50fe9fbf52c02295be5bb836384700247](https://sepolia.etherscan.io/tx/0x277ebbdfa160a8f46bd11274449ee3b50fe9fbf52c02295be5bb836384700247) |
| **DualFlashLoanExecutor** | 671,403 | [0x1df3f39da19ce9d471a93f0eb305af2751b854cacb5950a08644e22037e0fda5](https://sepolia.etherscan.io/tx/0x1df3f39da19ce9d471a93f0eb305af2751b854cacb5950a08644e22037e0fda5) |
| **Total** | 1,666,216 | - |

---

## 🧪 Quick Test

Test that DualFlashLoan is connected to the correct Aqua:

```bash
npx hardhat console --network sepolia
```

```javascript
const dualFlashLoan = await ethers.getContractAt(
    'DualFlashLoan',
    '0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8'
);

// Should return the Aqua address
await dualFlashLoan.AQUA();
// Expected: 0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF

// Should return 1000 (10% max fee)
await dualFlashLoan.MAX_FEE_BPS();
// Expected: 1000n
```

---

## 📋 Contract Interfaces

### DualFlashLoan

**Constructor:**
```solidity
constructor(IAqua aqua_)
```

**Main Function:**
```solidity
function dualFlashLoan(
    Strategy calldata strategy,
    uint256 amount0,
    uint256 amount1,
    address receiver,
    bytes calldata params
) external
```

**View Functions:**
```solidity
function calculateFee(Strategy calldata strategy, uint256 amount) 
    external pure returns (uint256 fee)

function getAvailableLiquidity(Strategy calldata strategy) 
    external view returns (uint256 liquidity0, uint256 liquidity1)
```

**Strategy Struct:**
```solidity
struct Strategy {
    address maker;      // Liquidity provider
    address token0;     // First token (must be < token1)
    address token1;     // Second token (must be > token0)
    uint256 feeBps;     // Fee in basis points (0-1000)
    bytes32 salt;       // Unique identifier
}
```

---

## 💡 Usage Example

```javascript
const { ethers } = require('hardhat');

// Get contract instance
const dualFlashLoan = await ethers.getContractAt(
    'DualFlashLoan',
    '0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8'
);

// Token addresses (ensure token0 < token1)
const USDC = '0x...'; // Your token0
const WETH = '0x...'; // Your token1

// Create strategy
const strategy = {
    maker: makerAddress,
    token0: USDC,
    token1: WETH,
    feeBps: 9,  // 0.09%
    salt: ethers.ZeroHash
};

// Execute dual flash loan
await dualFlashLoan.dualFlashLoan(
    strategy,
    ethers.parseUnits('1000', 6),  // 1000 USDC
    ethers.parseEther('1'),         // 1 WETH
    receiverAddress,
    '0x' // params
);
```

---

## 🔒 Security Notes

1. ✅ **Verified on Etherscan** - Source code publicly available
2. ✅ **Verified on Sourcify** - Full metadata match
3. ✅ **Reentrancy Protected** - Uses transient storage locks
4. ✅ **Token Ordering Enforced** - Requires token0 < token1
5. ✅ **Fee Validation** - Maximum 10% cap (1000 bps)
6. ✅ **Comprehensive Tests** - 29 passing tests

---

## 📚 Documentation

- **Main Guide**: [docs/DUAL_FLASHLOAN.md](./docs/DUAL_FLASHLOAN.md)
- **Gas Analysis**: [GAS_COMPARISON.md](./GAS_COMPARISON.md)
- **Summary**: [DUAL_FLASHLOAN_SUMMARY.md](./DUAL_FLASHLOAN_SUMMARY.md)
- **Quick Start**: [README_DUALFLASHLOAN.md](./README_DUALFLASHLOAN.md)

---

## 🎯 Key Features

- ⚡ **36% Gas Savings** vs sequential single flash loans (~128k vs 200k gas)
- 🔄 **Dual Token Support** - Borrow two tokens atomically
- 🎯 **Aqua-Native** - Uses `safeBalances()` for optimal pair queries
- 🔒 **Security First** - Reentrancy protected, tested extensively
- 📊 **Production Ready** - Full test coverage, verified contracts

---

## ✅ Deployment Checklist

- [x] Contracts compiled successfully
- [x] DualFlashLoan deployed
- [x] DualFlashLoanExecutor deployed
- [x] Both contracts verified on Etherscan
- [x] Both contracts verified on Sourcify
- [x] Connected to existing Aqua deployment
- [x] Deployment artifacts saved
- [x] Etherscan links working
- [x] Documentation updated

---

**Status**: ✅ **LIVE ON SEPOLIA**

**Gas Efficient**: 36% cheaper than alternatives  
**Fully Verified**: Etherscan + Sourcify  
**Production Ready**: 29/29 tests passing

---

*Last Updated: November 22, 2025*

