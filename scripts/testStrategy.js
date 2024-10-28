const hre = require("hardhat");

async function main() {
    // Contract addresses
    const STRATEGY_ADDRESS = "0x49Fc851A04Ea73FF35822cd11e71FBD5cFE815B4";
    const BTC_ADDRESS = "0x487B596960548292A67D2f2a872B45C131ccE2f8";
    const USDT_ADDRESS = "0x5a71e67147a3ea5ee9A491773Bf6001915475ff4";

    try {
        const [deployer] = await hre.ethers.getSigners();
        console.log("Testing with account:", deployer.address);

        // Get contract instances
        const strategy = await hre.ethers.getContractAt("ArbitrageStrategy", STRATEGY_ADDRESS);
        const btc = await hre.ethers.getContractAt("BTC", BTC_ADDRESS);
        const usdt = await hre.ethers.getContractAt("USDT", USDT_ADDRESS);

        // Check strategy parameters
        console.log("\nChecking strategy parameters...");
        const profitThreshold = await strategy.profitThreshold();
        const maxSlippage = await strategy.maxSlippage();
        const maxTradeSize = await strategy.maxTradeSize();
        console.log("Profit Threshold:", profitThreshold.toString(), "basis points");
        console.log("Max Slippage:", maxSlippage.toString(), "basis points");
        console.log("Max Trade Size:", hre.ethers.formatUnits(maxTradeSize, 6));

        // Get pool addresses from strategy
        const pool1Address = await strategy.uniswapPool1();
        const pool2Address = await strategy.uniswapPool2();
        console.log("\nPool addresses:");
        console.log("Pool 1:", pool1Address);
        console.log("Pool 2:", pool2Address);

        // Create pool contract instances
        const pool1 = await hre.ethers.getContractAt("IUniswap", pool1Address);
        const pool2 = await hre.ethers.getContractAt("IUniswap", pool2Address);

        // Check pool reserves
        console.log("\nChecking pool reserves...");
        const [reserve1A, reserve1B] = await pool1.getReserves();
        const [reserve2A, reserve2B] = await pool2.getReserves();
        
        console.log("Pool 1 Reserves:");
        console.log("Token A:", hre.ethers.formatUnits(reserve1A, 6));
        console.log("Token B:", hre.ethers.formatUnits(reserve1B, 6));
        
        console.log("\nPool 2 Reserves:");
        console.log("Token A:", hre.ethers.formatUnits(reserve2A, 6));
        console.log("Token B:", hre.ethers.formatUnits(reserve2B, 6));

        // Check strategy token balances
        const strategyBtcBalance = await btc.balanceOf(STRATEGY_ADDRESS);
        const strategyUsdtBalance = await usdt.balanceOf(STRATEGY_ADDRESS);
        console.log("\nStrategy Contract Balances:");
        console.log("BTC:", hre.ethers.formatUnits(strategyBtcBalance, 6));
        console.log("USDT:", hre.ethers.formatUnits(strategyUsdtBalance, 6));

        // Fund strategy if needed
        const requiredBalance = hre.ethers.parseUnits("1000", 6); // 1000 tokens
        if (strategyBtcBalance < requiredBalance) {
            console.log("\nFunding strategy with BTC...");
            const btcTransferTx = await btc.transfer(STRATEGY_ADDRESS, requiredBalance);
            await btcTransferTx.wait();
            console.log("BTC transferred to strategy");
        }

        if (strategyUsdtBalance < requiredBalance) {
            console.log("\nFunding strategy with USDT...");
            const usdtTransferTx = await usdt.transfer(STRATEGY_ADDRESS, requiredBalance);
            await usdtTransferTx.wait();
            console.log("USDT transferred to strategy");
        }

        // Execute strategy
        console.log("\nExecuting strategy...");
        const executeTx = await strategy.executeStrategy({
            gasLimit: 1000000
        });
        console.log("Transaction hash:", executeTx.hash);
        
        const receipt = await executeTx.wait();
        console.log("Strategy execution completed in block:", receipt.blockNumber);

        // Parse events
        for (const event of receipt.logs) {
            try {
                const parsedLog = strategy.interface.parseLog(event);
                if (parsedLog) {
                    console.log("\nEvent:", parsedLog.name);
                    for (const [key, value] of Object.entries(parsedLog.args)) {
                        if (isNaN(key)) { // Skip numeric indices
                            console.log(`${key}:`, value.toString());
                        }
                    }
                }
            } catch (e) {
                // Skip logs that can't be parsed
                continue;
            }
        }

        // Get final stats
        const stats = await strategy.stats();
        console.log("\nStrategy Statistics:");
        console.log("Total Trades:", stats.totalTrades.toString());
        console.log("Profitable Trades:", stats.profitableTrades.toString());
        console.log("Total Profit:", hre.ethers.formatUnits(stats.totalProfit, 6));
        console.log("Total Loss:", hre.ethers.formatUnits(stats.totalLoss, 6));

    } catch (error) {
        console.error("\nError Details:");
        console.error("-------------");
        if (error.error) {
            console.error("Error message:", error.error.message || error.message);
        }
        if (error.transaction) {
            console.error("\nTransaction details:");
            console.error("To:", error.transaction.to);
            console.error("From:", error.transaction.from);
            console.error("Data:", error.transaction.data);
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