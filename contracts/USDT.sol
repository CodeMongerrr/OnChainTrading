// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDT is ERC20 {
    constructor() ERC20("Tether USD", "USDT") {
        _mint(msg.sender, 1000000 * 10**6); // 1 million USDT with 6 decimals
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}