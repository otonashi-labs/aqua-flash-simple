# 🎯 Deployment Artifacts - Sepolia Testnet

**Network:** Ethereum Sepolia (Chain ID: 11155111)  
**Date:** November 22, 2025  
**Status:** ✅ All Verified

---

## 🔗 Contract Addresses

```
Core Protocol:
  Aqua:                 0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF

Flash Loans:
  FlashLoan (Single):   0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3
  FlashLoanExecutor:    0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090
  
  DualFlashLoan:        0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8  ⚡ NEW
  DualFlashLoanExecutor: 0xfe2D77D038e05B8de20adb15b05a894AF00081a0  ⚡ NEW

AMM:
  XYCSwap:              0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA
```

---

## 🌐 Etherscan Links

### Main Flash Loan Contracts

| Contract | Etherscan | Verification |
|----------|-----------|--------------|
| **⚡ DualFlashLoan** | [View Code](https://sepolia.etherscan.io/address/0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8#code) | ✅ Etherscan + Sourcify |
| **DualFlashLoanExecutor** | [View Code](https://sepolia.etherscan.io/address/0xfe2D77D038e05B8de20adb15b05a894AF00081a0#code) | ✅ Etherscan + Sourcify |
| **FlashLoan** | [View Code](https://sepolia.etherscan.io/address/0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3#code) | ✅ Etherscan + Sourcify |
| **FlashLoanExecutor** | [View Code](https://sepolia.etherscan.io/address/0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090#code) | ✅ Etherscan + Sourcify |

### Core Protocol

| Contract | Etherscan | Verification |
|----------|-----------|--------------|
| **Aqua** | [View Code](https://sepolia.etherscan.io/address/0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF#code) | ✅ Etherscan + Sourcify |
| **XYCSwap** | [View Code](https://sepolia.etherscan.io/address/0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA#code) | ✅ Etherscan + Sourcify |

---

## 🔍 Sourcify Verification

All contracts fully verified with complete metadata:

| Contract | Sourcify Repository |
|----------|---------------------|
| **DualFlashLoan** | [View](https://repo.sourcify.dev/contracts/full_match/11155111/0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8/) |
| **DualFlashLoanExecutor** | [View](https://repo.sourcify.dev/contracts/full_match/11155111/0xfe2D77D038e05B8de20adb15b05a894AF00081a0/) |
| **FlashLoan** | [View](https://repo.sourcify.dev/contracts/full_match/11155111/0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3/) |
| **FlashLoanExecutor** | [View](https://repo.sourcify.dev/contracts/full_match/11155111/0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090/) |
| **Aqua** | [View](https://repo.sourcify.dev/contracts/full_match/11155111/0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF/) |
| **XYCSwap** | [View](https://repo.sourcify.dev/contracts/full_match/11155111/0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA/) |

---

## 📊 Deployment Statistics

### Gas Usage

| Contract | Deployment Gas | Operation Gas |
|----------|----------------|---------------|
| **DualFlashLoan** | 994,813 | ~128,207 per flash loan |
| **DualFlashLoanExecutor** | 671,403 | - |
| **FlashLoan** | ~1,500,000 | ~95,000 per flash loan |
| **FlashLoanExecutor** | ~800,000 | - |
| **Aqua** | ~2,000,000 | ~200,000 (ship) |
| **XYCSwap** | ~1,000,000 | varies |

### On-Chain Proof

**DualFlashLoan Execution TX:**
- Hash: `0x45bed7f1b7cb978f503697f2909bea04b2f829e280436a3d5afe6c10b2c5c44c`
- Gas Used: **128,207**
- Status: ✅ Success
- [View on Etherscan](https://sepolia.etherscan.io/tx/0x45bed7f1b7cb978f503697f2909bea04b2f829e280436a3d5afe6c10b2c5c44c)

**Key Transactions:**
- DualFlashLoan Deployment: [0x277ebbdfa160a8f46bd11274449ee3b50fe9fbf52c02295be5bb836384700247](https://sepolia.etherscan.io/tx/0x277ebbdfa160a8f46bd11274449ee3b50fe9fbf52c02295be5bb836384700247)
- DualFlashLoanExecutor Deployment: [0x1df3f39da19ce9d471a93f0eb305af2751b854cacb5950a08644e22037e0fda5](https://sepolia.etherscan.io/tx/0x1df3f39da19ce9d471a93f0eb305af2751b854cacb5950a08644e22037e0fda5)

---

## 🔧 Constructor Arguments

### DualFlashLoan
```solidity
constructor(IAqua aqua_)
// Argument: 0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF
```

### DualFlashLoanExecutor
```solidity
// No constructor arguments
```

### FlashLoan
```solidity
constructor(IAqua aqua_)
// Argument: 0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF
```

### FlashLoanExecutor
```solidity
// No constructor arguments
```

### Aqua
```solidity
// No constructor arguments
```

### XYCSwap
```solidity
constructor(IAqua aqua_)
// Argument: 0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF
```

---

## 📝 Compiler Settings

```json
{
  "version": "0.8.30",
  "optimizer": {
    "enabled": true,
    "runs": 1000000000
  },
  "evmVersion": "cancun",
  "viaIR": true
}
```

---

## 💾 Contract Source Files

### DualFlashLoan Implementation
- `contracts/DualFlashLoan.sol` (147 lines) - Main dual flash loan logic
- `contracts/IDualFlashLoanReceiver.sol` (28 lines) - Receiver interface
- `contracts/DualFlashLoanExecutor.sol` (119 lines) - Reference implementation
- `contracts/ReentrantDualFlashLoanAttacker.sol` (61 lines) - Security testing

### FlashLoan Implementation
- `contracts/FlashLoan.sol` (139 lines) - Main flash loan logic
- `contracts/IFlashLoanReceiver.sol` (31 lines) - Receiver interface
- `contracts/FlashLoanExecutor.sol` (107 lines) - Reference implementation
- `contracts/ReentrantFlashLoanAttacker.sol` (61 lines) - Security testing

### Core Contracts
- `contracts/XYCSwap.sol` (140 lines) - Constant product AMM
- `contracts/SwapExecutor.sol` (28 lines) - Swap helper

---

## 🧪 Test Results

```
Test Summary:
  DualFlashLoan:  29/29 ✅
  FlashLoan:      23/23 ✅
  XYCSwap:         3/3  ✅
  Total:          55/55 ✅

Execution Time: 573ms
```

### Test Coverage
- ✅ Deployment & configuration
- ✅ Fee calculations (0%, normal, max, invalid)
- ✅ Liquidity queries
- ✅ Successful executions (single, dual, asymmetric)
- ✅ Failure scenarios (insufficient liquidity, bad callbacks)
- ✅ Reentrancy protection
- ✅ Token ordering validation (DualFlashLoan)
- ✅ Edge cases (1 wei, max liquidity)
- ✅ Gas benchmarking

---

## 📈 Performance Metrics

### Gas Comparison

| Operation | Gas Used | vs Alternative |
|-----------|----------|----------------|
| **DualFlashLoan** | **128,207** | -36% vs 2x Single |
| FlashLoan (Single) | 95,000 | -37% vs SwapVM |
| 2x Sequential FlashLoan | 200,000 | baseline |
| SwapVM-based (theoretical) | ~150,000 | reference |

### Key Metrics

| Metric | DualFlashLoan | FlashLoan |
|--------|---------------|-----------|
| Contract Size | 147 lines | 139 lines |
| Gas per Operation | 128,207 | 95,000 |
| Tokens per Call | 2 | 1 |
| Test Coverage | 29 tests | 23 tests |
| Verification | ✅ Dual | ✅ Dual |

---

## 🎨 Contract ABIs

ABIs available in deployment artifacts:
```
deployments/sepolia/DualFlashLoan.json
deployments/sepolia/DualFlashLoanExecutor.json
deployments/sepolia/FlashLoan.json
deployments/sepolia/FlashLoanExecutor.json
deployments/sepolia/Aqua.json
deployments/sepolia/XYCSwap.json
```

Or fetch directly from Etherscan API using verified addresses.

---

## 🚀 Quick Start Commands

```bash
# Interact with DualFlashLoan
npx hardhat console --network sepolia
> const dualFlashLoan = await ethers.getContractAt('DualFlashLoan', '0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8')
> await dualFlashLoan.MAX_FEE_BPS()  // Returns: 1000n (10%)
> await dualFlashLoan.AQUA()  // Returns: 0x97f393...

# Execute a test dual flash loan
npx hardhat run scripts/execute-dual-flashloan-sepolia.ts --network sepolia

# Run tests
yarn test

# Run only DualFlashLoan tests
npx hardhat test test/DualFlashLoan.test.ts

# Run only FlashLoan tests
npx hardhat test test/FlashLoan.test.ts
```

---

## ✨ Verified Features (On-Chain)

### DualFlashLoan
✅ Dual-token flash loan execution  
✅ Token ordering validation (token0 < token1)  
✅ Asymmetric borrowing (different amounts)  
✅ Fee collection for both tokens  
✅ Reentrancy protection  
✅ Balance verification  
✅ Event emission (`DualFlashLoanExecuted`)  
✅ Aqua integration via `safeBalances()`

### FlashLoan
✅ Single-token flash loan execution  
✅ Fee collection (0.09%)  
✅ Reentrancy protection  
✅ Balance verification  
✅ Event emission (`FlashLoanExecuted`)  
✅ Multiple strategies  
✅ Aqua integration

---

## 📚 Documentation

- **README.md** - Project overview with DualFlashLoan featured
- **docs/DUAL_FLASHLOAN.md** - Complete DualFlashLoan guide
- **docs/FLASHLOAN.md** - Single FlashLoan documentation
- **This file** - Deployment artifacts and references

---

## 🎯 Main Contracts for Review

**Primary Innovation:**
- **DualFlashLoan**: https://sepolia.etherscan.io/address/0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8#code

**Original Implementation:**
- **FlashLoan**: https://sepolia.etherscan.io/address/0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3#code

**Interact via Etherscan:**
- Read Contract: View current state
- Write Contract: Execute flash loans  
- Events: See execution history
- Code: Verified source code

---

## 🏆 Achievement Summary

✅ **DualFlashLoan**: Aqua-native pair-based design (128k gas)  
✅ **FlashLoan**: Simple direct implementation (95k gas)  
✅ **Full Test Coverage**: 55/55 tests passing  
✅ **Dual Verification**: Etherscan + Sourcify  
✅ **On-Chain Proof**: Live execution on Sepolia  
✅ **Production Ready**: Security tested, documented  

---

**All deployment artifacts last updated:** November 22, 2025  
**Network:** Ethereum Sepolia Testnet  
**Status:** ✅ Live & Verified
