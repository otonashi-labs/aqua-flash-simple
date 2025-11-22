// Script to verify deployment environment is ready

import * as dotenv from 'dotenv';
dotenv.config();

async function checkDeploymentReady() {
    console.log('🔍 Checking deployment environment...\n');
    
    let allGood = true;
    
    // Check RPC URL
    if (process.env.SEPOLIA_RPC_URL) {
        console.log('✅ SEPOLIA_RPC_URL is set');
        console.log(`   ${process.env.SEPOLIA_RPC_URL.substring(0, 30)}...`);
    } else {
        console.log('❌ SEPOLIA_RPC_URL is NOT set');
        allGood = false;
    }
    
    // Check Private Key
    if (process.env.PRIVATE_KEY) {
        console.log('✅ PRIVATE_KEY is set');
        console.log(`   ${process.env.PRIVATE_KEY.substring(0, 10)}...`);
    } else {
        console.log('❌ PRIVATE_KEY is NOT set');
        allGood = false;
    }
    
    // Check Etherscan API Key
    if (process.env.ETHERSCAN_API_KEY) {
        console.log('✅ ETHERSCAN_API_KEY is set');
        console.log(`   ${process.env.ETHERSCAN_API_KEY.substring(0, 10)}...`);
    } else {
        console.log('⚠️  ETHERSCAN_API_KEY is NOT set (verification will fail)');
        console.log('   Get one from: https://etherscan.io/myapikey');
    }
    
    console.log('\n📋 Existing Sepolia Deployments:');
    console.log('  Aqua:              0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF');
    console.log('  XYCSwap:           0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA');
    console.log('  FlashLoan:         0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3');
    console.log('  FlashLoanExecutor: 0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090');
    
    console.log('\n🚀 Will Deploy:');
    console.log('  - DualFlashLoan');
    console.log('  - DualFlashLoanExecutor');
    
    if (allGood) {
        console.log('\n✅ Environment is ready for deployment!');
        console.log('\n📝 To deploy, run:');
        console.log('   npx hardhat deploy --network sepolia --tags DualFlashLoan');
    } else {
        console.log('\n❌ Please fix the issues above before deploying.');
        console.log('\n📝 Add missing variables to your .env file:');
        console.log('   See .env.example for reference');
    }
}

checkDeploymentReady().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});

