require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        holesky: {
            url: process.env.HOLESKY_URL || "",
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
        },
        amoy: {
            url: process.env.AMOY_URL || "",
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
        },
        sepolia:{
            url: process.env.SEPOLIA_URL || "",
            timeout: 60000, // 60 seconds
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
        }
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY
    }
};