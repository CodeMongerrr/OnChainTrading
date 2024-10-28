const hre = require("hardhat");

async function main() {
    const WPOL_ADDRESS = "0xdf51A79ae943c891Ce8417e688F670611d5C7c1F";
    const USDT_ADDRESS = "0x5a71e67147a3ea5ee9A491773Bf6001915475ff4";
    const UNISWAP_ADDRESS = "0xd2875Df6EB0B0672cA977ac64A2b4A1C04EF1a4a";
    const USDT_DESIRED = hre.ethers.parseUnits("50", 6); // 50 USDT with 6 decimals

    try {
        const [signer] = await hre.ethers.getSigners();
        console.log("Using account:", signer.address);

        // Get contract instances
        const wpol = await hre.ethers.getContractAt("WPOL", WPOL_ADDRESS);
        const usdt = await hre.ethers.getContractAt("USDT", USDT_ADDRESS);
        const uniswap = await hre.ethers.getContractAt("Uniswap", UNISWAP_ADDRESS);

        // Get initial reserves
        const [reserveWPOL, reserveUSDT] = await uniswap.getReserves();
        console.log("\nCurrent pool reserves:");
        console.log("WPOL reserve:", hre.ethers.formatEther(reserveWPOL));
        console.log("USDT reserve:", hre.ethers.formatUnits(reserveUSDT, 6));

        // Calculate required WPOL amount (including 0.3% fee)
        // Using formula: x = (y * rA) / (rB - y)
        // Where:
        // x = WPOL amount needed
        // y = USDT amount desired
        // rA = WPOL reserve
        // rB = USDT reserve
        // Adding 0.3% to account for fee
        const numerator = USDT_DESIRED * 1000n * reserveWPOL;
        const denominator = (reserveUSDT - USDT_DESIRED) * 997n;
        const wpolNeeded = (numerator / denominator) + 1n; // Add 1 wei to handle rounding

        console.log("\nCalculated swap amounts:");
        console.log("WPOL to spend:", hre.ethers.formatEther(wpolNeeded));
        console.log("USDT to receive:", hre.ethers.formatUnits(USDT_DESIRED, 6));

        // Check WPOL balance
        const wpolBalance = await wpol.balanceOf(signer.address);
        console.log("\nCurrent WPOL balance:", hre.ethers.formatEther(wpolBalance));

        if (wpolBalance < wpolNeeded) {
            // If not enough WPOL, wrap some POL
            const wrapAmount = wpolNeeded - wpolBalance;
            console.log("\nWrapping additional POL:", hre.ethers.formatEther(wrapAmount));
            const wrapTx = await wpol.deposit({ value: wrapAmount });
            await wrapTx.wait();
            console.log("POL wrapped successfully");
        }

        // Approve WPOL spending
        console.log("\nApproving WPOL...");
        const approveTx = await wpol.approve(UNISWAP_ADDRESS, wpolNeeded);
        await approveTx.wait();
        console.log("WPOL approved");

        // Get balances before swap
        const beforeWPOL = await wpol.balanceOf(signer.address);
        const beforeUSDT = await usdt.balanceOf(signer.address);
        console.log("\nBalances before swap:");
        console.log("WPOL:", hre.ethers.formatEther(beforeWPOL));
        console.log("USDT:", hre.ethers.formatUnits(beforeUSDT, 6));

        // Execute swap
        console.log("\nExecuting swap...");
        const swapTx = await uniswap.swapAForB(wpolNeeded, {
            gasLimit: 300000
        });
        
        console.log("Swap transaction hash:", swapTx.hash);
        await swapTx.wait();
        console.log("Swap completed!");

        // Get final balances
        const afterWPOL = await wpol.balanceOf(signer.address);
        const afterUSDT = await usdt.balanceOf(signer.address);
        console.log("\nBalances after swap:");
        console.log("WPOL:", hre.ethers.formatEther(afterWPOL));
        console.log("USDT:", hre.ethers.formatUnits(afterUSDT, 6));

        // Calculate and display changes
        const wpolSpent = beforeWPOL - afterWPOL;
        const usdtReceived = afterUSDT - beforeUSDT;
        console.log("\nSwap summary:");
        console.log("WPOL spent:", hre.ethers.formatEther(wpolSpent));
        console.log("USDT received:", hre.ethers.formatUnits(usdtReceived, 6));

        // Get final reserves
        const [finalReserveWPOL, finalReserveUSDT] = await uniswap.getReserves();
        console.log("\nFinal pool reserves:");
        console.log("WPOL reserve:", hre.ethers.formatEther(finalReserveWPOL));
        console.log("USDT reserve:", hre.ethers.formatUnits(finalReserveUSDT, 6));

    } catch (error) {
        console.error("\nError occurred:");
        if (error.data) {
            console.error("Error data:", error.data);
        }
        if (error.reason) {
            console.error("Error reason:", error.reason);
        }
        if (error.code) {
            console.error("Error code:", error.code);
        }
        if (error.transaction) {
            console.error("\nTransaction details:");
            console.error("To:", error.transaction.to);
            console.error("From:", error.transaction.from);
            console.error("Data:", error.transaction.data);
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