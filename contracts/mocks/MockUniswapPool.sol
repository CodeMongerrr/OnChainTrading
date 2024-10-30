// contracts/mocks/MockUniswapPool.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapPool {
    IERC20 public tokenA;
    IERC20 public tokenB;
    uint private reserveA;
    uint private reserveB;
    uint private mockPrice;

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function setReserves(uint _reserveA, uint _reserveB) external {
        reserveA = _reserveA;
        reserveB = _reserveB;
    }

    function setMockPrice(uint _price) external {
        mockPrice = _price;
    }

    function getReserves() external view returns (uint, uint) {
        return (reserveA, reserveB);
    }

    function getTokenAddresses() external view returns (address, address) {
        return (address(tokenA), address(tokenB));
    }

    function swapAForB(uint amountIn) external returns (uint amountOut) {
        require(tokenA.transferFrom(msg.sender, address(this), amountIn), "Transfer failed");
        amountOut = (amountIn * mockPrice) / 1e18;
        require(tokenB.transfer(msg.sender, amountOut), "Transfer failed");
        return amountOut;
    }

    function swapBForA(uint amountIn) external returns (uint amountOut) {
        require(tokenB.transferFrom(msg.sender, address(this), amountIn), "Transfer failed");
        amountOut = (amountIn * 1e18) / mockPrice;
        require(tokenA.transfer(msg.sender, amountOut), "Transfer failed");
        return amountOut;
    }
}