// scripts/interact-with-token.js
async function main() {
    try {
        // Get the signers (your wallet accounts)
        const [owner, recipient] = await ethers.getSigners();
        console.log("Interacting using account:", owner.address);
        
        // The address where your token is deployed
        const tokenAddress = "0x6aFfCBF27435C6Ad9326d1baD60E14eC373deEC2"; // Replace this with your deployed address
        
        // Get the contract interface and attach it to the deployed address
        const tokenContract = await ethers.getContractAt("TokenX", tokenAddress);
        const recipientAddress = "0x09B7b2b2a7C398a3Be0700213ba2B9b247aF68Df";
        // Now we can interact with the token
        
        // 1. Check your token balance
        const myBalance = await tokenContract.balanceOf(owner.address);
        console.log("\nMy token balance:", ethers.formatUnits(myBalance, 18));
        
        // 2. Send tokens to someone
        console.log("Check 1");
        const amountToSend = ethers.parseUnits("100", 18); // Sending 100 tokens
        console.log("Check 2");
        console.log(recipient);
        console.log("\nSending", ethers.formatUnits(amountToSend, 18), "tokens to:", recipientAddress);
        console.log("Check 3")
        const sendTx = await tokenContract.transfer(recipientAddress, amountToSend);
        console.log("Transaction hash:", sendTx.hash);
        await sendTx.wait();
        console.log("Transfer completed!");
        
        // 3. Check balances after transfer
        const newBalance = await tokenContract.balanceOf(owner.address);
        const recipientBalance = await tokenContract.balanceOf(recipientAddress);
        
        console.log("\nNew balances:");
        console.log("My balance:", ethers.formatUnits(newBalance, 18));
        console.log("Recipient balance:", ethers.formatUnits(recipientBalance, 18));
        
        // 4. Mint new tokens (only works if you're the owner)
        console.log("\nTrying to mint new tokens...");
        const mintAmount = ethers.parseUnits("1000", 18);
        const mintTx = await tokenContract.mint(owner.address, mintAmount);
        await mintTx.wait();
        console.log("Minted", ethers.formatUnits(mintAmount, 18), "new tokens!");
        
    } catch (error) {
        console.error("\nError:", error.message);
        // If you get contract-related errors, they'll show up here
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });