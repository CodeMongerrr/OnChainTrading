// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Uniswap is ReentrancyGuard {
    IERC20 public tokenA;
    IERC20 public tokenB;
    uint public reserveA;
    uint public reserveB;
    
    // Minimum liquidity to prevent division by zero
    uint private constant MINIMUM_LIQUIDITY = 1000;
    
    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    // Add initial liquidity
    function addInitialLiquidity(uint amountA, uint amountB) external nonReentrant {
        require(amountA > 0 && amountB > 0, "Invalid amounts");
        
        // Transfer tokens to contract
        require(tokenA.transferFrom(msg.sender, address(this), amountA), "Transfer A failed");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "Transfer B failed");
        
        reserveA = amountA;
        reserveB = amountB;
    }
    
    // Swap tokenA for tokenB
    function swapAForB(uint amountIn) external nonReentrant returns (uint amountOut) {
        require(amountIn > 0, "Invalid input amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        
        // Calculate amount out based on x * y = k
        uint k = reserveA * reserveB;
        uint newReserveA = reserveA + amountIn;
        uint newReserveB = k / newReserveA;
        amountOut = reserveB - newReserveB;
        
        // Apply a 0.3% fee
        amountOut = (amountOut * 997) / 1000;
        
        require(amountOut > 0, "Insufficient output amount");
        
        // Transfer tokens
        require(tokenA.transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(tokenB.transfer(msg.sender, amountOut), "Transfer out failed");
        
        // Update reserves
        reserveA = reserveA + amountIn;
        reserveB = reserveB - amountOut;
    }
    
    // Swap tokenB for tokenA
    function swapBForA(uint amountIn) external nonReentrant returns (uint amountOut) {
        require(amountIn > 0, "Invalid input amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        
        // Calculate amount out based on x * y = k
        uint k = reserveA * reserveB;
        uint newReserveB = reserveB + amountIn;
        uint newReserveA = k / newReserveB;
        amountOut = reserveA - newReserveA;
        
        // Apply a 0.3% fee
        amountOut = (amountOut * 997) / 1000;
        
        require(amountOut > 0, "Insufficient output amount");
        
        // Transfer tokens
        require(tokenB.transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(tokenA.transfer(msg.sender, amountOut), "Transfer out failed");
        
        // Update reserves
        reserveB = reserveB + amountIn;
        reserveA = reserveA - amountOut;
    }
    
    // View functions
    function getReserves() external view returns (uint _reserveA, uint _reserveB) {
        return (reserveA, reserveB);
    }
    
    function getTokenAddresses() external view returns (address _tokenA, address _tokenB) {
        return (address(tokenA), address(tokenB));
    }
}