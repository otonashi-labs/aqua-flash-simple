// Simple Aave V3 test without hardhat-deploy dependencies
import * as dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';

const AAVE_POOL = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951';
const USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';
const EXECUTOR_ADDRESS = '0x615532E1E69d0f2b94761Cc0c7a3395aE4e14538';

const AaveV3FlashLoanExecutorABI = [
    "function executeFlashLoan(address asset, uint256 amount, bytes calldata params) external",
    "function getPoolAddress() external view returns (address)",
    "event FlashLoanReceived(address asset, uint256 amount, uint256 premium, address initiator)"
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

async function main() {
    console.log('🚀 Testing Aave V3 FlashLoan on Sepolia (Simplified)\n');

    // Setup provider and signer
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!rpcUrl || !privateKey) {
        console.error('❌ Missing SEPOLIA_RPC_URL or PRIVATE_KEY in .env');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet('0x' + privateKey, provider);
    
    console.log('👤 Signer:', await signer.getAddress());
    const balance = await provider.getBalance(await signer.getAddress());
    console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n');

    // Get contract instances
    const executor = new ethers.Contract(EXECUTOR_ADDRESS, AaveV3FlashLoanExecutorABI, signer);
    const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);

    console.log('📍 Contracts:');
    console.log('  Aave V3 Pool:', AAVE_POOL);
    console.log('  USDC:', USDC);
    console.log('  Executor:', EXECUTOR_ADDRESS);
    console.log('');

    // Verify executor configuration
    const poolAddress = await executor.getPoolAddress();
    console.log('🔍 Verifying configuration...');
    console.log('   Executor pool address:', poolAddress);
    if (poolAddress.toLowerCase() !== AAVE_POOL.toLowerCase()) {
        console.error('❌ Pool address mismatch!');
        process.exit(1);
    }
    console.log('   ✅ Configuration correct\n');

    // Check executor USDC balance
    const executorBalance = await usdc.balanceOf(EXECUTOR_ADDRESS);
    console.log('💰 Executor USDC balance:', ethers.formatUnits(executorBalance, 6), 'USDC');

    // Calculate borrow amount and premium
    const borrowAmount = ethers.parseUnits('9.9', 6); // 9.9 USDC
    const premium = borrowAmount * 5n / 10000n; // 0.05%
    const repayAmount = borrowAmount + premium;

    console.log('\n🧮 Flash Loan Details:');
    console.log('   Borrow amount:', ethers.formatUnits(borrowAmount, 6), 'USDC');
    console.log('   Premium (0.05%):', ethers.formatUnits(premium, 6), 'USDC');
    console.log('   Repay amount:', ethers.formatUnits(repayAmount, 6), 'USDC');
    console.log('');

    // Check if executor has enough balance
    if (executorBalance < repayAmount) {
        console.error('❌ Insufficient balance!');
        console.error('   Current:', ethers.formatUnits(executorBalance, 6), 'USDC');
        console.error('   Required:', ethers.formatUnits(repayAmount, 6), 'USDC');
        console.error('   Send', ethers.formatUnits(repayAmount - executorBalance, 6), 'more USDC to:', EXECUTOR_ADDRESS);
        process.exit(1);
    }
    console.log('   ✅ Sufficient balance for repayment\n');

    // Execute flash loan
    console.log('⚡ Executing Aave V3 flash loan...');
    console.log('   This will measure the gas consumption\n');

    try {
        const tx = await executor.executeFlashLoan(USDC, borrowAmount, '0x');
        
        console.log('   📡 Transaction sent:', tx.hash);
        console.log('   ⏳ Waiting for confirmation...\n');
        
        const receipt = await tx.wait();
        
        console.log('   ✅ Flash loan executed successfully!\n');
        
        // Display gas metrics
        console.log('⛽ Gas Metrics:');
        console.log('==================================================');
        console.log('Gas Used:', receipt?.gasUsed.toString());
        console.log('Gas Price:', ethers.formatUnits(receipt?.gasPrice || 0, 'gwei'), 'gwei');
        const totalCost = (receipt?.gasUsed || 0n) * (receipt?.gasPrice || 0n);
        console.log('Total Cost:', ethers.formatEther(totalCost), 'ETH');
        console.log('==================================================\n');

        // Parse events
        console.log('📡 Events:');
        const iface = new ethers.Interface(AaveV3FlashLoanExecutorABI);
        for (const log of receipt?.logs || []) {
            try {
                if (log.address.toLowerCase() === EXECUTOR_ADDRESS.toLowerCase()) {
                    const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
                    if (parsed?.name === 'FlashLoanReceived') {
                        console.log('   FlashLoanReceived:');
                        console.log('     Asset:', parsed.args.asset);
                        console.log('     Amount:', ethers.formatUnits(parsed.args.amount, 6), 'USDC');
                        console.log('     Premium:', ethers.formatUnits(parsed.args.premium, 6), 'USDC');
                        console.log('     Initiator:', parsed.args.initiator);
                    }
                }
            } catch (e) {
                // Skip logs we can't parse
            }
        }
        console.log('');

        // Final summary
        console.log('✅ Test completed successfully!');
        console.log('\n📝 Summary:');
        console.log('==================================================');
        console.log('Protocol: Aave V3');
        console.log('Network: Sepolia');
        console.log('Test Token: USDC');
        console.log('Flash Loan Amount:', ethers.formatUnits(borrowAmount, 6), 'USDC');
        console.log('Premium Paid:', ethers.formatUnits(premium, 6), 'USDC');
        console.log('Premium Rate: 0.05% (5 basis points)');
        console.log('Total Gas Used:', receipt?.gasUsed.toString());
        console.log('Transaction Hash:', tx.hash);
        console.log('Block Explorer: https://sepolia.etherscan.io/tx/' + tx.hash);
        console.log('==================================================');
        console.log('\n🎉 Aave V3 FlashLoan is working on Sepolia testnet!');
        console.log('\n💡 Compare this gas usage with Aqua flash loans:');
        console.log('   Run: yarn test:sepolia');
        
    } catch (error: any) {
        console.error('❌ Flash loan execution failed!');
        console.error('\nError:', error.message);
        if (error.data) {
            console.error('Error data:', error.data);
        }
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

