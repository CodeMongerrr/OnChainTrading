// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IArbitrageStrategy {
    // Structs
    struct MarketPrice {
        uint timestamp;
        uint price;
        uint liquidity;
    }
    
    struct StrategyStats {
        uint totalTrades;
        uint profitableTrades;
        uint totalProfit;
        uint totalLoss;
    }
    
    // View functions
    function tokenA() external view returns (address);
    function tokenB() external view returns (address);
    function uniswapPool1() external view returns (address);
    function uniswapPool2() external view returns (address);
    function priceFeed() external view returns (address);
    function profitThreshold() external view returns (uint);
    function maxSlippage() external view returns (uint);
    function maxTradeSize() external view returns (uint);
    function cooldownPeriod() external view returns (uint);
    function lastExecutionTime() external view returns (uint);
    function pool1MarketPrice() external view returns (MarketPrice memory);
    function pool2MarketPrice() external view returns (MarketPrice memory);
    function stats() external view returns (StrategyStats memory);
    
    // External functions
    function executeStrategy() external;
    function updateStrategyParameters(
        uint _profitThreshold,
        uint _maxSlippage,
        uint _maxTradeSize
    ) external;
    function emergencyWithdraw(address token, uint amount) external;
    
    // Events
    event OpportunityFound(uint pool1Price, uint pool2Price, uint profitPercent);
    event TradeFailed(string reason);
    event TradeExecuted(uint profit, uint timestamp);
    event StrategyParametersUpdated(uint profitThreshold, uint maxSlippage, uint maxTradeSize);
}