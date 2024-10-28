const hre = require("hardhat");

async function main() {
  console.log("Deploying Uniswap contract on Sepolia...");

  // Deployed token addresses on Sepolia
  const BTC_ADDRESS = "0x5a71e67147a3ea5ee9A491773Bf6001915475ff4";
  const USDT_ADDRESS = "0x487B596960548292A67D2f2a872B45C131ccE2f8";

  // Get the contract factory
  const Uniswap = await hre.ethers.getContractFactory("Uniswap");

  // Deploy Uniswap with BTC and USDT addresses
  console.log("\nDeploying Uniswap with the following parameters:");
  console.log("BTC:", BTC_ADDRESS);
  console.log("USDT:", USDT_ADDRESS);

  const uniswap = await Uniswap.deploy(BTC_ADDRESS, USDT_ADDRESS);
  await uniswap.waitForDeployment();
  
  const ammAddress = await uniswap.getAddress();
  console.log("\nUniswap deployed to:", ammAddress);

  // Wait for some block confirmations before verification
  console.log("Waiting for block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay

  // Verify contract on Sepolia with more detailed error handling
  console.log("\nAttempting contract verification on Sepolia...");
  try {
    await hre.run("verify:verify", {
      address: ammAddress,
      constructorArguments: [BTC_ADDRESS, USDT_ADDRESS],
      contract: "contracts/Uniswap.sol:Uniswap",
      noCompile: true
    });
    console.log("✅ Contract verification successful!");
  } catch (error) {
    console.log("❌ Verification error:", error.message);
    
    // If first attempt fails, try again with force flag
    console.log("\nAttempting verification again with force flag...");
    try {
      await hre.run("verify:verify", {
        address: ammAddress,
        constructorArguments: [BTC_ADDRESS, USDT_ADDRESS],
        contract: "contracts/Uniswap.sol:Uniswap",
        noCompile: true,
        force: true
      });
      console.log("✅ Contract verification successful on second attempt!");
    } catch (secondError) {
      console.log("❌ Second verification attempt failed:", secondError.message);
      console.log("\nTo verify manually on Etherscan:");
      console.log("1. Go to:", `https://sepolia.etherscan.io/address/${ammAddress}#code`);
      console.log("2. Select 'Verify & Publish'");
      console.log("3. Use the following parameters:");
      console.log("   - Contract Name: Uniswap");
      console.log("   - Constructor Arguments:", [BTC_ADDRESS, USDT_ADDRESS]);
    }
  }

  // Rest of your code...
  const [tokenA, tokenB] = await uniswap.getTokenAddresses();
  console.log("\nVerifying configured token addresses:");
  console.log("TokenA (BTC):", tokenA);
  console.log("TokenB (USDT):", tokenB);

  if (tokenA.toLowerCase() === BTC_ADDRESS.toLowerCase() && 
      tokenB.toLowerCase() === USDT_ADDRESS.toLowerCase()) {
    console.log("✅ Token addresses correctly configured!");
  } else {
    console.log("⚠️ Token addresses mismatch!");
  }

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("Network: Sepolia");
  console.log("Uniswap:", ammAddress);
  console.log("BTC:", BTC_ADDRESS);
  console.log("USDT:", USDT_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });