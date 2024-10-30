// test/basicVerification.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Basic Contract Verification", function() {
    const STRATEGY_ADDRESS = "0x86B21bEe7fF5a5bB3264Ae9fABbf436ba47D8E04";
    let owner;

    before(async function() {
        [owner] = await ethers.getSigners();
        console.log("Testing with account:", owner.address);
    });

    it("Should verify contract exists", async function() {
        const code = await ethers.provider.getCode(STRATEGY_ADDRESS);
        console.log("Contract code exists:", code.length > 2);
        expect(code.length).to.be.gt(2); // More than '0x'
    });

    it("Should connect with minimum ABI", async function() {
        const minimalABI = [
            "function owner() view returns (address)"
        ];

        try {
            const contract = await ethers.getContractAt(minimalABI, STRATEGY_ADDRESS);
            const contractOwner = await contract.owner();
            console.log("Contract owner:", contractOwner);
            expect(ethers.isAddress(contractOwner)).to.be.true;
        } catch (error) {
            console.error("Error connecting to contract:", error.message);
            throw error;
        }
    });

    it("Should try to read contract variables", async function() {
        const basicABI = [
            "function tokenA() view returns (address)",
            "function tokenB() view returns (address)",
            "function profitThreshold() view returns (uint256)",
            "function maxSlippage() view returns (uint256)",
            "function maxTradeSize() view returns (uint256)"
        ];

        try {
            const contract = await ethers.getContractAt(basicABI, STRATEGY_ADDRESS);
            
            console.log("\nReading contract variables:");
            
            try {
                const tokenA = await contract.tokenA();
                console.log("Token A:", tokenA);
            } catch (error) {
                console.log("Failed to read tokenA:", error.message);
            }

            try {
                const tokenB = await contract.tokenB();
                console.log("Token B:", tokenB);
            } catch (error) {
                console.log("Failed to read tokenB:", error.message);
            }

            try {
                const threshold = await contract.profitThreshold();
                console.log("Profit Threshold:", threshold.toString());
            } catch (error) {
                console.log("Failed to read profitThreshold:", error.message);
            }

            try {
                const slippage = await contract.maxSlippage();
                console.log("Max Slippage:", slippage.toString());
            } catch (error) {
                console.log("Failed to read maxSlippage:", error.message);
            }

            try {
                const tradeSize = await contract.maxTradeSize();
                console.log("Max Trade Size:", ethers.formatEther(tradeSize));
            } catch (error) {
                console.log("Failed to read maxTradeSize:", error.message);
            }

        } catch (error) {
            console.error("Error reading contract variables:", error.message);
            throw error;
        }
    });
});