// scripts/interact-with-token.js
async function main() {
    const [owner, recipient] = await ethers.getSigners();
    
    // Get the deployed token contract
    const tokenAddress = "0x6aFfCBF27435C6Ad9326d1baD60E14eC373deEC2"; // Replace with your deployed token address
    const TokenX = await ethers.getContractFactory("TokenX");
    const token = TokenX.attach(tokenAddress);

    // 1. Check initial balances
    console.log("\nInitial balances:");
    const ownerBalance = await token.balanceOf(owner.address);
    console.log("Owner balance:", ethers.formatUnits(ownerBalance, 18));

    // 2. Transfer tokens
    const transferAmount = ethers.parseUnits("1000", 18); // Transfer 1000 tokens
    console.log("\nTransferring", ethers.formatUnits(transferAmount, 18), "tokens to:", recipient.address);
    
    const transferTx = await token.transfer(recipient.address, transferAmount);
    await transferTx.wait();
    
    // 3. Check balances after transfer
    console.log("\nBalances after transfer:");
    const newOwnerBalance = await token.balanceOf(owner.address);
    const recipientBalance = await token.balanceOf(recipient.address);
    console.log("Owner balance:", ethers.formatUnits(newOwnerBalance, 18));
    console.log("Recipient balance:", ethers.formatUnits(recipientBalance, 18));

    // 4. Mint new tokens
    const mintAmount = ethers.parseUnits("5000", 18); // Mint 5000 new tokens
    console.log("\nMinting", ethers.formatUnits(mintAmount, 18), "new tokens to recipient");
    
    const mintTx = await token.mint(recipient.address, mintAmount);
    await mintTx.wait();

    // 5. Final balances
    console.log("\nFinal balances:");
    const finalRecipientBalance = await token.balanceOf(recipient.address);
    console.log("Recipient final balance:", ethers.formatUnits(finalRecipientBalance, 18));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });