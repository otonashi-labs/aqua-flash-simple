// Send USDC to the executor
import * as dotenv from 'dotenv';
dotenv.config();

import { ethers } from 'ethers';

const USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';
const EXECUTOR_ADDRESS = '0x615532E1E69d0f2b94761Cc0c7a3395aE4e14538';

const ERC20_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

async function main() {
    console.log('💸 Sending 10 USDC to AaveV3FlashLoanExecutor\n');

    // Setup provider and signer
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!rpcUrl || !privateKey) {
        console.error('❌ Missing SEPOLIA_RPC_URL or PRIVATE_KEY in .env');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet('0x' + privateKey, provider);
    
    console.log('👤 Sender:', await signer.getAddress());
    const ethBalance = await provider.getBalance(await signer.getAddress());
    console.log('💰 ETH Balance:', ethers.formatEther(ethBalance), 'ETH');
    
    // Get USDC contract
    const usdc = new ethers.Contract(USDC, ERC20_ABI, signer);
    
    // Check sender's USDC balance
    const senderBalance = await usdc.balanceOf(await signer.getAddress());
    console.log('💰 USDC Balance:', ethers.formatUnits(senderBalance, 6), 'USDC\n');
    
    const amountToSend = ethers.parseUnits('10', 6); // 10 USDC
    
    if (senderBalance < amountToSend) {
        console.error('❌ Insufficient USDC balance!');
        console.error('   You have:', ethers.formatUnits(senderBalance, 6), 'USDC');
        console.error('   You need:', ethers.formatUnits(amountToSend, 6), 'USDC');
        console.error('\n💡 Get USDC from Aave faucet: https://staging.aave.com/faucet/');
        process.exit(1);
    }
    
    console.log('📤 Sending USDC...');
    console.log('   To:', EXECUTOR_ADDRESS);
    console.log('   Amount:', ethers.formatUnits(amountToSend, 6), 'USDC\n');
    
    try {
        const tx = await usdc.transfer(EXECUTOR_ADDRESS, amountToSend);
        console.log('   📡 Transaction sent:', tx.hash);
        console.log('   ⏳ Waiting for confirmation...\n');
        
        const receipt = await tx.wait();
        console.log('   ✅ Transfer successful!\n');
        
        // Check executor balance
        const executorBalance = await usdc.balanceOf(EXECUTOR_ADDRESS);
        console.log('💰 Executor USDC balance:', ethers.formatUnits(executorBalance, 6), 'USDC');
        console.log('🔗 View on Etherscan: https://sepolia.etherscan.io/tx/' + tx.hash);
        console.log('\n✅ Ready to run the flash loan test!');
        console.log('   Run: yarn test:aave:sepolia');
        
    } catch (error: any) {
        console.error('❌ Transfer failed!');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

