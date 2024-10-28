const hre = require("hardhat");

async function main() {
    const BTC_ADDRESS = "0x5a71e67147a3ea5ee9A491773Bf6001915475ff4";
    const USDT_ADDRESS = "0x487B596960548292A67D2f2a872B45C131ccE2f8";
    const UNISWAP_ADDRESS = "0x86B21bEe7fF5a5bB3264Ae9fABbf436ba47D8E04";

    try {
        const [deployer] = await hre.ethers.getSigners();
        console.log("Using account:", deployer.address);

        // Get contract instances
        const uniswap = await hre.ethers.getContractAt("Uniswap", UNISWAP_ADDRESS);
        const btc = await hre.ethers.getContractAt("BTC", BTC_ADDRESS);
        const usdt = await hre.ethers.getContractAt("USDT", USDT_ADDRESS);

        // Check current reserves
        console.log("\nChecking current Uniswap pool reserves...");
        const [reserveA, reserveB] = await uniswap.getReserves();
        console.log("BTC reserve:", hre.ethers.formatUnits(reserveA, 6));  // Using 6 decimals
        console.log("USDT reserve:", hre.ethers.formatUnits(reserveB, 6));

        // Check balances with correct decimals
        const btcBalance = await btc.balanceOf(deployer.address);
        const usdtBalance = await usdt.balanceOf(deployer.address);
        
        console.log("\nCurrent balances:");
        console.log("BTC balance:", hre.ethers.formatUnits(btcBalance, 6));  // Using 6 decimals
        console.log("USDT balance:", hre.ethers.formatUnits(usdtBalance, 6));

        // Amounts to add (using 6 decimals)
        const btcAmount = hre.ethers.parseUnits("1000", 6);  // 100,000 BTC
        const usdtAmount = hre.ethers.parseUnits("10000", 6); // 100,000 USDT

        console.log("\nAmount to add to liquidity:");
        console.log("BTC:", hre.ethers.formatUnits(btcAmount, 6));
        console.log("USDT:", hre.ethers.formatUnits(usdtAmount, 6));

        // Verify sufficient balance
        if (btcBalance < btcAmount) {
            throw new Error(`Insufficient BTC balance. Have: ${hre.ethers.formatUnits(btcBalance, 6)}, Need: ${hre.ethers.formatUnits(btcAmount, 6)}`);
        }

        if (usdtBalance < usdtAmount) {
            throw new Error(`Insufficient USDT balance. Have: ${hre.ethers.formatUnits(usdtBalance, 6)}, Need: ${hre.ethers.formatUnits(usdtAmount, 6)}`);
        }

        // Approve tokens
        console.log("\nApproving tokens for Uniswap...");
        
        console.log("Approving BTC...");
        const btcApprovalTx = await btc.approve(UNISWAP_ADDRESS, btcAmount);
        await btcApprovalTx.wait();
        console.log("BTC approved");

        console.log("Approving USDT...");
        const usdtApprovalTx = await usdt.approve(UNISWAP_ADDRESS, usdtAmount);
        await usdtApprovalTx.wait();
        console.log("USDT approved");

        // Add liquidity
        console.log("\nAdding initial liquidity to Uniswap pool...");
        const addLiquidityTx = await uniswap.addInitialLiquidity(
            btcAmount,
            usdtAmount,
            {
                gasLimit: 500000
            }
        );
        
        console.log("Transaction sent. Hash:", addLiquidityTx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await addLiquidityTx.wait();
        console.log("Liquidity added successfully in block:", receipt.blockNumber);

        // Verify final state
        const [finalReserveA, finalReserveB] = await uniswap.getReserves();
        console.log("\nFinal Uniswap pool reserves:");
        console.log("BTC reserve:", hre.ethers.formatUnits(finalReserveA, 6));
        console.log("USDT reserve:", hre.ethers.formatUnits(finalReserveB, 6));

    } catch (error) {
        console.error("\nDetailed Error Information:");
        console.error("-------------------------");
        
        if (error.error) {
            console.error("Error message:", error.error.message || error.message);
        }
        
        if (error.transaction) {
            console.error("\nTransaction details:");
            console.error("To:", error.transaction.to);
            console.error("From:", error.transaction.from);
            console.error("Data:", error.transaction.data);
            console.error("Value:", error.transaction.value?.toString());
        }
        
        if (error.receipt) {
            console.error("\nTransaction receipt:");
            console.error("Status:", error.receipt.status);
            console.error("Gas used:", error.receipt.gasUsed.toString());
            console.error("Block number:", error.receipt.blockNumber);
        }
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });