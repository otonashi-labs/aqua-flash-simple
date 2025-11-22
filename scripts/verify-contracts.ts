// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { run } from 'hardhat';

/**
 * Script to verify deployed contracts on Etherscan
 */
async function main() {
    console.log('🔍 Verifying contracts on Etherscan...\n');

    const deploymentsPath = './deployments/sepolia';

    try {
        // Load deployment addresses
        const aquaDeployment = require(`../${deploymentsPath}/Aqua.json`);
        const xycSwapDeployment = require(`../${deploymentsPath}/XYCSwap.json`);
        const flashLoanDeployment = require(`../${deploymentsPath}/FlashLoan.json`);
        const executorDeployment = require(`../${deploymentsPath}/FlashLoanExecutor.json`);

        // Verify Aqua
        console.log('Verifying Aqua...');
        try {
            await run('verify:verify', {
                address: aquaDeployment.address,
                constructorArguments: [],
            });
            console.log('✅ Aqua verified\n');
        } catch (error: any) {
            if (error.message.includes('Already Verified')) {
                console.log('✅ Aqua already verified\n');
            } else {
                console.error('❌ Error verifying Aqua:', error.message, '\n');
            }
        }

        // Verify XYCSwap
        console.log('Verifying XYCSwap...');
        try {
            await run('verify:verify', {
                address: xycSwapDeployment.address,
                constructorArguments: [aquaDeployment.address],
            });
            console.log('✅ XYCSwap verified\n');
        } catch (error: any) {
            if (error.message.includes('Already Verified')) {
                console.log('✅ XYCSwap already verified\n');
            } else {
                console.error('❌ Error verifying XYCSwap:', error.message, '\n');
            }
        }

        // Verify FlashLoan
        console.log('Verifying FlashLoan...');
        try {
            await run('verify:verify', {
                address: flashLoanDeployment.address,
                constructorArguments: [aquaDeployment.address],
            });
            console.log('✅ FlashLoan verified\n');
        } catch (error: any) {
            if (error.message.includes('Already Verified')) {
                console.log('✅ FlashLoan already verified\n');
            } else {
                console.error('❌ Error verifying FlashLoan:', error.message, '\n');
            }
        }

        // Verify FlashLoanExecutor
        console.log('Verifying FlashLoanExecutor...');
        try {
            await run('verify:verify', {
                address: executorDeployment.address,
                constructorArguments: [],
            });
            console.log('✅ FlashLoanExecutor verified\n');
        } catch (error: any) {
            if (error.message.includes('Already Verified')) {
                console.log('✅ FlashLoanExecutor already verified\n');
            } else {
                console.error('❌ Error verifying FlashLoanExecutor:', error.message, '\n');
            }
        }

        console.log('✅ Verification complete!');

    } catch (error) {
        console.error('❌ Could not load deployment addresses.');
        console.error('   Please run: yarn deploy --network sepolia');
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

