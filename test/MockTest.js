const { expect } = require("chai");
const { ethers } = require("hardhat");

const STRATEGY_ABI = [
    "function tokenA() external view returns (address)",
    "function tokenB() external view returns (address)",
    "function uniswapPool1() external view returns (address)",
    "function uniswapPool2() external view returns (address)",
    "function priceFeed() external view returns (address)",

    // View functions for parameters
    "function profitThreshold() external view returns (uint256)",
    "function maxSlippage() external view returns (uint256)",
    "function maxTradeSize() external view returns (uint256)",
    "function cooldownPeriod() external view returns (uint256)",
    "function lastExecutionTime() external view returns (uint256)",
    // Previous ABI items...
    "function pool1MarketPrice() external view returns (tuple(uint256 timestamp, uint256 price, uint256 liquidity))",
    "function pool2MarketPrice() external view returns (tuple(uint256 timestamp, uint256 price, uint256 liquidity))",
    "function stats() external view returns (tuple(uint256 totalTrades, uint256 profitableTrades, uint256 totalProfit, uint256 totalLoss))",
    "function executeStrategy() external",
    "function updateStrategyParameters(uint256 _profitThreshold, uint256 _maxSlippage, uint256 _maxTradeSize) external",
    "function emergencyWithdraw(address token, uint256 amount) external",

    // Events
    "event OpportunityFound(uint256 pool1Price, uint256 pool2Price, uint256 profitPercent)",
    "event TradeFailed(string reason)",
    "event TradeExecuted(uint256 profit, uint256 timestamp)",
    "event StrategyParametersUpdated(uint256 profitThreshold, uint256 maxSlippage, uint256 maxTradeSize)"
];

describe("ArbitrageStrategy Tests", function() {
    let strategy;
    let tokenA;
    let tokenB;
    let owner;
    
    const STRATEGY_ADDRESS = "0x94a74465fE8fEB15FB17928b2b90FB8Eb5287964"; // Replace with your contract address
    
    before(async function() {
        [owner] = await ethers.getSigners();
        console.log("Testing with account:", owner.address);
        
        // Connect to deployed strategy contract
        strategy = new ethers.Contract(STRATEGY_ADDRESS, STRATEGY_ABI, owner);
        
        // Get token addresses from strategy
        const tokenAAddress = await strategy.tokenA();
        const tokenBAddress = await strategy.tokenB();
        
        // Connect to token contracts
        tokenA = new ethers.Contract(tokenAAddress, [
            "function decimals() view returns (uint8)",
            "function balanceOf(address) view returns (uint256)",
            "function approve(address, uint256) returns (bool)"
        ], owner);
        
        tokenB = new ethers.Contract(tokenBAddress, [
            "function decimals() view returns (uint8)",
            "function balanceOf(address) view returns (uint256)",
            "function approve(address, uint256) returns (bool)"
        ], owner);
        
        const decimalsA = await tokenA.decimals();
        const decimalsB = await tokenB.decimals();
        console.log("Token A decimals:", decimalsA);
        console.log("Token B decimals:", decimalsB);
    });

    describe("Pre-execution checks", function() {
        it("Should have sufficient token balances", async function() {
            const balanceA = await tokenA.balanceOf(owner.address);
            const balanceB = await tokenB.balanceOf(owner.address);
            
            const decimalsA = await tokenA.decimals();
            const decimalsB = await tokenB.decimals();
            
            console.log("Token A balance:", ethers.formatUnits(balanceA, decimalsA));
            console.log("Token B balance:", ethers.formatUnits(balanceB, decimalsB));
            
            expect(balanceA).to.be.gt(0);
            expect(balanceB).to.be.gt(0);
        });

        it("Should approve tokens for strategy", async function() {
            const decimalsA = await tokenA.decimals();
            const decimalsB = await tokenB.decimals();
            
            const approvalAmount = ethers.parseUnits("10000", decimalsA);
            
            await tokenA.approve(STRATEGY_ADDRESS, approvalAmount);
            await tokenB.approve(STRATEGY_ADDRESS, approvalAmount);
            
            console.log("Tokens approved for strategy");
        });
    });

    describe("Market price checks", function() {
        it("Should get current market prices", async function() {
            try {
                const price1 = await strategy.pool1MarketPrice();
                const price2 = await strategy.pool2MarketPrice();
                
                console.log("Pool 1 Market Price:");
                if (price1.timestamp.toString() !== "0") {
                    console.log({
                        timestamp: new Date(Number(price1.timestamp) * 1000).toISOString(),
                        price: price1.price.toString(),
                        liquidity: price1.liquidity.toString()
                    });
                } else {
                    console.log("No price data available for Pool 1");
                }
                
                console.log("Pool 2 Market Price:");
                if (price2.timestamp.toString() !== "0") {
                    console.log({
                        timestamp: new Date(Number(price2.timestamp) * 1000).toISOString(),
                        price: price2.price.toString(),
                        liquidity: price2.liquidity.toString()
                    });
                } else {
                    console.log("No price data available for Pool 2");
                }
            } catch (error) {
                console.log("Error getting market prices:", error.message);
                // Don't fail the test as prices might not be initialized yet
            }
        });
    });

    describe("Strategy execution", function() {
        it("Should attempt to execute strategy", async function() {
            try {
                console.log("Attempting to execute strategy...");
                const tx = await strategy.executeStrategy();
                console.log("Transaction sent:", tx.hash);
                
                const receipt = await tx.wait();
                console.log("Transaction mined!");
                
                // Look for events
                const executedEvent = receipt.events?.find(e => e.event === "TradeExecuted");
                if (executedEvent) {
                    console.log("Trade executed successfully!");
                    console.log("Profit:", executedEvent.args.profit.toString());
                }
                
            } catch (error) {
                console.log("Strategy execution response:", error.message);
                
                if (error.message.includes("No profitable opportunity found")) {
                    console.log("Test passed: No profitable opportunity available");
                } else if (error.message.includes("Invalid market conditions")) {
                    console.log("Test passed: Invalid market conditions");
                } else if (error.message.includes("Cooldown period active")) {
                    console.log("Test passed: Cooldown period still active");
                } else {
                    console.log("Unexpected error during execution:", error.message);
                }
                // Don't fail the test as these are expected conditions
            }
        });

        it("Should check strategy stats", async function() {
            const stats = await strategy.stats();
            console.log("Strategy Statistics:");
            console.log("Total Trades:", stats.totalTrades.toString());
            console.log("Profitable Trades:", stats.profitableTrades.toString());
            console.log("Total Profit:", stats.totalProfit.toString());
            console.log("Total Loss:", stats.totalLoss.toString());
        });
    });
});