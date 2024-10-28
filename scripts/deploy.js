const hre = require("hardhat");

async function main() {
  console.log("Deploying BTC and USDT contracts...");

  // Get the contract factories
  const BTC = await hre.ethers.getContractFactory("BTC");
  const USDT = await hre.ethers.getContractFactory("USDT");

  // Deploy BTC
  console.log("Deploying BTC...");
  const btc = await BTC.deploy();
  await btc.waitForDeployment();
  const btcAddress = await btc.getAddress();
  console.log("BTC deployed to:", btcAddress);

  // Deploy USDT
  console.log("Deploying USDT...");
  const usdt = await USDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("USDT deployed to:", usdtAddress);

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("BTC:", btcAddress);
  console.log("USDT:", usdtAddress);

  // Wait for a few block confirmations
  console.log("\nWaiting for block confirmations...");
  await btc.waitForDeployment();
  await usdt.waitForDeployment();

  // Verify contracts on Amoy
  console.log("\nVerifying contracts on Sepolia...");
  try {
    // Verify BTC with specific contract path
    await hre.run("verify:verify", {
      address: btcAddress,
      contract: "contracts/BTC.sol:BTC", // Specify exact contract
      constructorArguments: [],
    });
    console.log("BTC verification complete");
    
    // Verify USDT with specific contract path
    await hre.run("verify:verify", {
      address: usdtAddress,
      contract: "contracts/USDT.sol:USDT", // Specify exact contract
      constructorArguments: [],
    });
    console.log("USDT verification complete");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contracts already verified");
    } else {
      console.log("Error verifying contracts:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });