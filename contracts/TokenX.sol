// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenX is ERC20, Ownable {
    constructor() ERC20("TokenX", "TKX") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Initial supply: 1 million tokens
    }

    // Function to mint new tokens (only owner can call this)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Optional: Add a function to let users burn their tokens
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}