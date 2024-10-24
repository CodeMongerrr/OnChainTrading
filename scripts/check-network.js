// scripts/check-network.js
async function main() {
    // Get the network
    const network = await ethers.provider.getNetwork();
    console.log("Current network:", {
        name: network.name,
        chainId: network.chainId
    });

    // Get the signer's address and balance
    const [signer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(signer.address);
    
    console.log("Deploying contract with account:", signer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });