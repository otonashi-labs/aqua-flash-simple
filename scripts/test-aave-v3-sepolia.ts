// SPDX-License-Identifier: MIT

import { ethers } from 'hardhat';
import { ether } from '@1inch/solidity-utils';

/**
 * Script to test Aave V3 FlashLoan on Sepolia testnet
 * 
 * This script measures the gas usage of Aave V3 flash loans
 * for comparison with Aqua flash loans.
 * 
 * Prerequisites:
 * 1. Deploy AaveV3FlashLoanExecutor using: yarn deploy --network sepolia --tags aave
 * 2. Ensure deployer has sufficient Sepolia ETH
 * 
 * Aave V3 Sepolia addresses:
 * - Pool: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
 * - USDC: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
 * - DAI: 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357
 */
async function main() {
    console.log('🚀 Testing Aave V3 FlashLoan on Sepolia\n');

    // Aave V3 Sepolia addresses
    const AAVE_POOL = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951';
    
    // Test tokens available on Aave V3 Sepolia
    const TEST_TOKENS = {
        USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
        DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
        USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    };

    // Get AaveV3FlashLoanExecutor address from deployments
    const deploymentsPath = './deployments/sepolia';
    let executorAddress: string;

    try {
        const executorDeployment = require(`../${deploymentsPath}/AaveV3FlashLoanExecutor.json`);
        executorAddress = executorDeployment.address;

        console.log('📍 Using deployed contracts:');
        console.log('  Aave V3 Pool:', AAVE_POOL);
        console.log('  AaveV3FlashLoanExecutor:', executorAddress);
        console.log('');
    } catch (error) {
        console.error('❌ Could not load AaveV3FlashLoanExecutor deployment.');
        console.error('   Please run: yarn deploy --network sepolia --tags aave');
        process.exit(1);
    }

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log('👤 Deployer:', await deployer.getAddress());
    
    const balance = await ethers.provider.getBalance(await deployer.getAddress());
    console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n');

    if (balance < ethers.parseEther('0.01')) {
        console.warn('⚠️  Warning: Low balance. Get Sepolia ETH from faucet: https://sepoliafaucet.com/\n');
    }

    // Get contract instances
    const executor = await ethers.getContractAt('AaveV3FlashLoanExecutor', executorAddress);
    const pool = await ethers.getContractAt('IAaveV3Pool', AAVE_POOL);

    // Verify pool address
    const executorPool = await executor.getPoolAddress();
    console.log('🔍 Verifying configuration...');
    console.log('   Executor pool address:', executorPool);
    console.log('   Expected pool address:', AAVE_POOL);
    
    if (executorPool.toLowerCase() !== AAVE_POOL.toLowerCase()) {
        console.error('❌ Pool address mismatch!');
        process.exit(1);
    }
    console.log('   ✅ Configuration correct\n');

    // Test with USDC (6 decimals)
    const testToken = TEST_TOKENS.USDC;
    const tokenContract = await ethers.getContractAt('IERC20', testToken);
    
    console.log('🪙 Using test token: USDC');
    console.log('   Address:', testToken);
    console.log('');

    // Check if executor needs tokens for repayment
    // For Aave V3, the premium is 0.05% (5 bps)
    // Using 9.9 USDC to fit within 10 USDC available (including fee)
    const borrowAmount = ethers.parseUnits('9.9', 6); // 9.9 USDC (6 decimals)
    const premium = borrowAmount * 5n / 10000n; // 0.05%
    const repayAmount = borrowAmount + premium;

    console.log('🧮 Flash Loan Details:');
    console.log('   Borrow amount:', ethers.formatUnits(borrowAmount, 6), 'USDC');
    console.log('   Premium (0.05%):', ethers.formatUnits(premium, 6), 'USDC');
    console.log('   Repay amount:', ethers.formatUnits(repayAmount, 6), 'USDC\n');

    // Check executor balance
    const executorBalance = await tokenContract.balanceOf(executorAddress);
    console.log('💰 Executor USDC balance:', ethers.formatUnits(executorBalance, 6), 'USDC');
    
    if (executorBalance < repayAmount) {
        console.error('❌ Executor needs', ethers.formatUnits(repayAmount - executorBalance, 6), 'more USDC for repayment');
        console.error('   Current balance:', ethers.formatUnits(executorBalance, 6), 'USDC');
        console.error('   Required:', ethers.formatUnits(repayAmount, 6), 'USDC');
        console.error('   You can:');
        console.error('   1. Get USDC from Aave Sepolia faucet: https://staging.aave.com/faucet/');
        console.error('   2. Send USDC to executor at:', executorAddress);
        console.error('');
        process.exit(1);
    } else {
        console.log('   ✅ Sufficient balance for repayment\n');
    }

    // Execute flash loan and measure gas
    console.log('⚡ Executing Aave V3 flash loan...');
    console.log('   This will measure the gas consumption\n');

    try {
        const tx = await executor.executeFlashLoan(
            testToken,
            borrowAmount,
            '0x'
        );
        
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

        // Check for FlashLoanReceived event
        console.log('📡 Checking events...');
        const filter = executor.filters.FlashLoanReceived();
        const events = await executor.queryFilter(filter, receipt?.blockNumber, receipt?.blockNumber);
        
        if (events.length > 0) {
            const event = events[0];
            console.log('   Event FlashLoanReceived:');
            console.log('     Asset:', event.args.asset);
            console.log('     Amount:', ethers.formatUnits(event.args.amount, 6), 'USDC');
            console.log('     Premium:', ethers.formatUnits(event.args.premium, 6), 'USDC');
            console.log('     Initiator:', event.args.initiator);
            console.log('');
        }

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
        console.log('Block Explorer:', `https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log('==================================================');
        console.log('\n🎉 Aave V3 FlashLoan is working on Sepolia testnet!');
        console.log('\n💡 Compare this gas usage with Aqua flash loans:');
        console.log('   Run: yarn test:sepolia');
        
    } catch (error: any) {
        console.error('❌ Flash loan execution failed!');
        console.error('\nError details:');
        console.error(error);
        
        if (error.message?.includes('insufficient')) {
            console.error('\n💡 Tips:');
            console.error('   1. Get test USDC from: https://staging.aave.com/faucet/');
            console.error('   2. Send USDC to executor:', executorAddress);
            console.error('   3. Ensure executor has enough for repayment:', ethers.formatUnits(repayAmount, 6), 'USDC');
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

