// contracts/mocks/MockPriceFeed.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockPriceFeed {
    int private price;
    
    constructor() {
        price = 100000000; // Default $1.00
    }

    function setPrice(int _price) external {
        price = _price;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int answer,
        uint startedAt,
        uint updatedAt,
        uint80 answeredInRound
    ) {
        return (
            1,              // roundId
            price,          // answer
            block.timestamp,// startedAt
            block.timestamp,// updatedAt
            1              // answeredInRound
        );
    }

    function decimals() external pure returns (uint8) {
        return 8;  // Chainlink typically uses 8 decimals
    }
}