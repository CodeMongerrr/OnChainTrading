const { ethers } = require("ethers");
const { createSmartAccountClient } = require("@biconomy/account");
require('dotenv').config();

async function main() {
    // Your configuration with private key and Biconomy API key
    const config = {
        privateKey: process.env.PRIVATE_KEY,
        bundlerUrl: "https://bundler.biconomy.io/api/v2/11155111/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
        rpcUrl: "https://sepolia.infura.io/v3/5d5516faabeb4fb0a93a745c08807e32",
    };

    // Generate EOA from private key using ethers.js v6
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(config.privateKey, provider);

    try {
        // Create Biconomy Smart Account instance
        const smartWallet = await createSmartAccountClient({
            signer,
            bundlerUrl: config.bundlerUrl,
        });

        const saAddress = await smartWallet.getAccountAddress();
        console.log("SA Address", saAddress);
    } catch (error) {
        console.error("Error:", error);
    }
}

// Execute the main function
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Main error:", error);
        process.exit(1);
    });