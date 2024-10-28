const { ethers } = require("hardhat");

async function verifyPoolAddresses(poolAddress) {
  try {
    const pool = await ethers.getContractAt("IUniswap", poolAddress);
    const [tokenA, tokenB] = await pool.getTokenAddresses();
    console.log(`Pool ${poolAddress} tokens:`, { tokenA, tokenB });
    return true;
  } catch (error) {
    console.log(`Failed to verify pool ${poolAddress}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log("Starting deployment of ArbitrageStrategy...");

    // Configuration
    const config = {
      tokenA: "0x487B596960548292A67D2f2a872B45C131ccE2f8", // BTC
      tokenB: "0x5a71e67147a3ea5ee9A491773Bf6001915475ff4", // USDT
      uniswapPool1: "0xbD2a3F7DF4333E4A3DF02Af985d437D533E60539", // First pool
      uniswapPool2: "0x86B21bEe7fF5a5bB3264Ae9fABbf436ba47D8E04", // Second pool
      priceFeed: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43" // Price feed
    };

    // Verify ERC20 tokens
    console.log("\nVerifying tokens...");
    const tokenA = await ethers.getContractAt("IERC20", config.tokenA);
    const tokenB = await ethers.getContractAt("IERC20", config.tokenB);
    
    try {
      const symbolA = await tokenA.symbol();
      const symbolB = await tokenB.symbol();
      console.log("Token A Symbol:", symbolA);
      console.log("Token B Symbol:", symbolB);
    } catch (error) {
      console.log("Warning: Could not fetch token symbols:", error.message);
    }

    // Verify pools
    console.log("\nVerifying Uniswap pools...");
    const pool1Valid = await verifyPoolAddresses(config.uniswapPool1);
    const pool2Valid = await verifyPoolAddresses(config.uniswapPool2);

    if (!pool1Valid || !pool2Valid) {
      console.log("Warning: Pool verification failed. Proceeding anyway...");
    }

    // Get the contract factory
    const ArbitrageStrategy = await ethers.getContractFactory("ArbitrageStrategy");

    console.log("\nDeploying contract...");
    const arbitrageStrategy = await ArbitrageStrategy.deploy(
      config.tokenA,
      config.tokenB,
      config.uniswapPool1,
      config.uniswapPool2,
      config.priceFeed,
      {
        gasLimit: 5000000
      }
    );

    // Wait for deployment using the new syntax
    await arbitrageStrategy.waitForDeployment();
    const strategyAddress = await arbitrageStrategy.getAddress();
    
    console.log("ArbitrageStrategy deployed to:", strategyAddress);

    // Wait for some block confirmations
    console.log("\nWaiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay

    // Verify the contract
    console.log("\nVerifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: strategyAddress,
        constructorArguments: [
          config.tokenA,
          config.tokenB,
          config.uniswapPool1,
          config.uniswapPool2,
          config.priceFeed
        ],
        contract: "contracts/ArbitrageStrategy.sol:ArbitrageStrategy"
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification error:", error.message);
    }

    // Try to call some view functions to verify deployment
    try {
      const deployedStrategy = await ethers.getContractAt("ArbitrageStrategy", strategyAddress);
      const tokenAAddress = await deployedStrategy.tokenA();
      const tokenBAddress = await deployedStrategy.tokenB();
      console.log("\nContract state verification:");
      console.log("Configured Token A:", tokenAAddress);
      console.log("Configured Token B:", tokenBAddress);
    } catch (error) {
      console.log("Warning: Could not verify contract state:", error.message);
    }

    // Print deployment summary
    console.log("\nDeployment Summary:");
    console.log("===================");
    console.log("Network:", network.name);
    console.log("ArbitrageStrategy:", strategyAddress);
    console.log("Token A:", config.tokenA);
    console.log("Token B:", config.tokenB);
    console.log("Uniswap Pool 1:", config.uniswapPool1);
    console.log("Uniswap Pool 2:", config.uniswapPool2);
    console.log("Price Feed:", config.priceFeed);

    return {
      address: strategyAddress,
      config: config
    };

  } catch (error) {
    console.error("\nCritical Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });