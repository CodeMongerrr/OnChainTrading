async function main() {
    // Get the contract factory
    const TokenX = await ethers.getContractFactory("TokenX");

    // Deploy the contract
    const tokenX = await TokenX.deploy();
    await tokenX.waitForDeployment();

    // Get the deployed contract address
    const tokenAddress = await tokenX.getAddress();
    console.log("TokenX deployed to:", tokenAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });