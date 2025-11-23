// Check USDC balances for both tokens
import * as dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';

const USDC_AAVE = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8'; // Aave V3 USDC
const USDC_CIRCLE = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // Circle USDC
const EXECUTOR_ADDRESS = '0x615532E1E69d0f2b94761Cc0c7a3395aE4e14538';

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
];

async function main() {
    console.log('🔍 Checking USDC Balances\n');

    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!rpcUrl || !privateKey) {
        console.error('❌ Missing SEPOLIA_RPC_URL or PRIVATE_KEY in .env');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet('0x' + privateKey, provider);
    const walletAddress = await signer.getAddress();
    
    console.log('👤 Wallet:', walletAddress);
    console.log('🤖 Executor:', EXECUTOR_ADDRESS);
    console.log('');
    
    // Check both USDC tokens
    const usdcAave = new ethers.Contract(USDC_AAVE, ERC20_ABI, provider);
    const usdcCircle = new ethers.Contract(USDC_CIRCLE, ERC20_ABI, provider);
    
    try {
        console.log('═══════════════════════════════════════════════════');
        console.log('📊 AAVE V3 USDC (Required for Aave Flash Loan)');
        console.log('═══════════════════════════════════════════════════');
        console.log('Contract:', USDC_AAVE);
        const nameAave = await usdcAave.name();
        console.log('Name:', nameAave);
        
        const walletBalanceAave = await usdcAave.balanceOf(walletAddress);
        const executorBalanceAave = await usdcAave.balanceOf(EXECUTOR_ADDRESS);
        
        console.log('');
        console.log('Your Balance:', ethers.formatUnits(walletBalanceAave, 6), 'USDC');
        console.log('Executor Balance:', ethers.formatUnits(executorBalanceAave, 6), 'USDC');
        
        if (walletBalanceAave > 0n) {
            console.log('✅ You have Aave USDC!');
        } else {
            console.log('❌ You need Aave USDC from: https://staging.aave.com/faucet/');
        }
        
        console.log('');
        console.log('═══════════════════════════════════════════════════');
        console.log('📊 CIRCLE USDC (Your USDC)');
        console.log('═══════════════════════════════════════════════════');
        console.log('Contract:', USDC_CIRCLE);
        const nameCircle = await usdcCircle.name();
        console.log('Name:', nameCircle);
        
        const walletBalanceCircle = await usdcCircle.balanceOf(walletAddress);
        const executorBalanceCircle = await usdcCircle.balanceOf(EXECUTOR_ADDRESS);
        
        console.log('');
        console.log('Your Balance:', ethers.formatUnits(walletBalanceCircle, 6), 'USDC');
        console.log('Executor Balance:', ethers.formatUnits(executorBalanceCircle, 6), 'USDC');
        
        if (walletBalanceCircle > 0n) {
            console.log('✅ You have Circle USDC!');
            console.log('⚠️  This USDC cannot be used with Aave V3');
        }
        
        console.log('');
        console.log('═══════════════════════════════════════════════════');
        console.log('💡 Summary');
        console.log('═══════════════════════════════════════════════════');
        
        if (walletBalanceAave >= ethers.parseUnits('10', 6)) {
            console.log('✅ You can proceed with the Aave flash loan test!');
            console.log('   Run: npx ts-node scripts/send-usdc-to-executor.ts');
        } else {
            console.log('❌ You need to get Aave V3 USDC');
            console.log('');
            console.log('📥 How to get Aave V3 USDC:');
            console.log('   1. Visit: https://staging.aave.com/faucet/');
            console.log('   2. Connect wallet:', walletAddress);
            console.log('   3. Select USDC and click "Faucet"');
            console.log('   4. Wait for transaction to confirm');
            console.log('');
            console.log('💡 Note: Your Circle USDC is a different token and');
            console.log('   cannot be used with Aave V3 Protocol on Sepolia.');
        }
        
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

