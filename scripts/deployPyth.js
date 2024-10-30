const { ethers } = require("hardhat");

async function main() {
    try {
        // Pyth Network addresses for different networks
        const PYTH_ADDRESSES = {
            mainnet: "0x4305FB66699C3B2702D4d05CF36551390A4c69C6",
            sepolia: "0x2880aB155794e7179c9eE2e38200202908C17B43"
        };

        // Get the network
        const network = hre.network.name;
        const pythAddress = PYTH_ADDRESSES[network];

        if (!pythAddress) {
            throw new Error(`No Pyth address configured for network: ${network}`);
        }

        console.log("\nDeployment Started...");
        console.log("Network:", network);
        console.log("Pyth Address:", pythAddress);

        // Deploy contract
        const PythPriceOracle = await ethers.getContractFactory("PythPriceOracle");
        const oracle = await PythPriceOracle.deploy(pythAddress);
        await oracle.waitForDeployment();

        const contractAddress = await oracle.getAddress();
        console.log("\nPythPriceOracle deployed to:", contractAddress);

        // Wait for some block confirmations
        console.log("\nWaiting for block confirmations...");
        await sleep(30000); // Wait 30 seconds

        // Verify contract
        console.log("\nVerifying contract...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [pythAddress],
            });
            console.log("Contract verified successfully!");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("Contract is already verified!");
            } else {
                console.error("Verification error:", error);
            }
        }

        // Get initial price reading
        console.log("\nFetching initial price...");
        try {
            const price = await oracle.getHumanReadablePrice();
            console.log("Current BTC/USD Price:", price.toString());
        } catch (error) {
            console.log("Note: Price needs to be updated first using updatePriceFeeds()");
        }

        console.log("\nDeployment completed successfully!");
        return contractAddress;

    } catch (error) {
        console.error("\nDeployment failed:", error);
        throw error;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main };