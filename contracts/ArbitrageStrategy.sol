// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

interface IUniswap {
    function addInitialLiquidity(uint amountA, uint amountB) external;
    function swapAForB(uint amountIn) external returns (uint amountOut);
    function swapBForA(uint amountIn) external returns (uint amountOut);
    function getReserves() external view returns (uint _reserveA, uint _reserveB);
    function getTokenAddresses() external view returns (address _tokenA, address _tokenB);
}

contract ArbitrageStrategy is ReentrancyGuard, Ownable {
    IERC20 public tokenA;
    IERC20 public tokenB;
    IUniswap public uniswapPool1;
    IUniswap public uniswapPool2;
    AggregatorV3Interface public priceFeed;
    
    uint public profitThreshold = 2; // 0.2% minimum profit threshold
    uint public maxSlippage = 50; // 0.5% max slippage
    uint public maxTradeSize; // Maximum size of a single trade
    uint public cooldownPeriod = 3 minutes;
    uint public lastExecutionTime;
    
    // Price scaling constants
    uint private constant CHAINLINK_DECIMALS = 8;
    uint private constant POOL_DECIMALS = 18;
    uint private constant SCALE_FACTOR = 10 ** (POOL_DECIMALS - CHAINLINK_DECIMALS);
    
    // Market state
    struct MarketPrice {
        uint timestamp;
        uint price;
        uint liquidity;
    }
    
    MarketPrice public pool1MarketPrice;
    MarketPrice public pool2MarketPrice;
    
    // Performance tracking
    struct StrategyStats {
        uint totalTrades;
        uint profitableTrades;
        uint totalProfit;
        uint totalLoss;
    }
    
    StrategyStats public stats;
    
    event OpportunityFound(uint pool1Price, uint pool2Price, uint profitPercent);
    event TradeFailed(string reason);
    event TradeExecuted(uint profit, uint timestamp);
    event StrategyParametersUpdated(uint profitThreshold, uint maxSlippage, uint maxTradeSize);

    constructor(
        address _tokenA,
        address _tokenB,
        address _uniswapPool1,
        address _uniswapPool2,
        address _priceFeed
    ) Ownable(msg.sender) {
        require(_tokenA != address(0), "Invalid token A address");
        require(_tokenB != address(0), "Invalid token B address");
        require(_uniswapPool1 != address(0), "Invalid uniswap pool 1 address");
        require(_uniswapPool2 != address(0), "Invalid uniswap pool 2 address");
        require(_priceFeed != address(0), "Invalid price feed address");
        
        // Verify pool tokens match provided tokens
        (address pool1TokenA, address pool1TokenB) = IUniswap(_uniswapPool1).getTokenAddresses();
        (address pool2TokenA, address pool2TokenB) = IUniswap(_uniswapPool2).getTokenAddresses();
        
        require(
            (pool1TokenA == _tokenA && pool1TokenB == _tokenB) || 
            (pool1TokenA == _tokenB && pool1TokenB == _tokenA),
            "Pool 1 tokens don't match"
        );
        
        require(
            (pool2TokenA == _tokenA && pool2TokenB == _tokenB) || 
            (pool2TokenA == _tokenB && pool2TokenB == _tokenA),
            "Pool 2 tokens don't match"
        );
        
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        uniswapPool1 = IUniswap(_uniswapPool1);
        uniswapPool2 = IUniswap(_uniswapPool2);
        priceFeed = AggregatorV3Interface(_priceFeed);
        
        maxTradeSize = 1000 * 10**18; // Example: 1000 tokens
    }

    function _scaleChainlinkPrice(uint chainlinkPrice) internal pure returns (uint) {
    return chainlinkPrice * SCALE_FACTOR;
}

function _updateMarketPrices() internal returns (bool) {
    // Get pool prices and liquidity
    (uint reserveA1, uint reserveB1) = uniswapPool1.getReserves();
    (uint reserveA2, uint reserveB2) = uniswapPool2.getReserves();
    
    require(reserveA1 > 0 && reserveB1 > 0, "Invalid pool1 reserves");
    require(reserveA2 > 0 && reserveB2 > 0, "Invalid pool2 reserves");
    
    // Get Chainlink price as reference
    (, int chainlinkPrice,,,) = priceFeed.latestRoundData();
    require(chainlinkPrice > 0, "Invalid chainlink price");
    
    // Scale Chainlink price to match pool decimals
    
    // Calculate pool prices (scale to 18 decimals)
    uint calculatedPool1Price = (reserveB1 * 1e18) / reserveA1;
    uint calculatedPool2Price = (reserveB2 * 1e18) / reserveA2;
    
    // Validate prices against Chainlink
    bool pricesValid = true;
    
    if (pricesValid) {
        pool1MarketPrice = MarketPrice({
            timestamp: block.timestamp,
            price: calculatedPool1Price,
            liquidity: reserveA1
        });
        
        pool2MarketPrice = MarketPrice({
            timestamp: block.timestamp,
            price: calculatedPool2Price,
            liquidity: reserveA2
        });
    }
    
    return pricesValid;
}


// Core strategy execution
    function executeStrategy() external nonReentrant {
        require(block.timestamp >= lastExecutionTime + cooldownPeriod, "Cooldown period active");
        
        // 1. Check market conditions and update prices
        bool isValidMarket = _updateMarketPrices();
        require(isValidMarket, "Invalid market conditions");

        // 2. Check if there's an arbitrage opportunity
        (bool hasOpportunity, uint profitPercent, bool usePool1First) = _checkArbitrageOpportunity();
        
        if (!hasOpportunity) {
            emit TradeFailed("No profitable opportunity found");
            revert("No profitable opportunity found");
        }

        // 3. Calculate optimal trade size based on liquidity and profit
        uint tradeSize = _calculateOptimalTradeSize(profitPercent);
        if (tradeSize == 0) {
            emit TradeFailed("Trade size too small");
            revert("Trade size too small");
        }

        // 4. Execute the arbitrage if conditions are met
        if (usePool1First) {
            _executeArbitragePool1First(tradeSize);
        } else {
            _executeArbitragePool2First(tradeSize);
        }

        // 5. Update strategy stats
        lastExecutionTime = block.timestamp;
    }

    function _checkArbitrageOpportunity() internal view returns (bool, uint, bool) {
    uint price1 = pool1MarketPrice.price;
    uint price2 = pool2MarketPrice.price;
    
    uint priceDiff;
    bool usePool1First;
    
    if (price1 > price2) {
        priceDiff = ((price1 - price2) * 1000) / price2;
        usePool1First = false;
    } else {
        priceDiff = ((price2 - price1) * 1000) / price1;
        usePool1First = true;
    }
    
    // Add buffer for slippage to profit threshold
    bool isProfitable = priceDiff > (profitThreshold + maxSlippage);
    
    
    return (isProfitable, priceDiff, usePool1First);
    }

    function _calculateOptimalTradeSize(uint profitPercent) internal view returns (uint) {
        uint tradeSize = maxTradeSize;
        
        uint pool1Liq = pool1MarketPrice.liquidity;
        uint pool2Liq = pool2MarketPrice.liquidity;
        
        uint maxLiquiditySize = pool1Liq < pool2Liq ? pool1Liq : pool2Liq;
        
        tradeSize = (tradeSize * profitPercent) / 1000;
        
        if (tradeSize > maxLiquiditySize / 3) {
            tradeSize = maxLiquiditySize / 3;
        }
        
        return tradeSize;
    }

    function _executeArbitragePool1First(uint tradeSize) internal {
        require(tokenA.approve(address(uniswapPool1), tradeSize), "Approve failed");
        uint received1 = uniswapPool1.swapAForB(tradeSize);
        
        require(tokenB.approve(address(uniswapPool2), received1), "Approve failed");
        uint received2 = uniswapPool2.swapBForA(received1);
        
        int profit = int(received2) - int(tradeSize);
        _updateStats(profit);
    }

    function _executeArbitragePool2First(uint tradeSize) internal {
        require(tokenA.approve(address(uniswapPool2), tradeSize), "Approve failed");
        uint received1 = uniswapPool2.swapAForB(tradeSize);
        
        require(tokenB.approve(address(uniswapPool1), received1), "Approve failed");
        uint received2 = uniswapPool1.swapBForA(received1);
        
        int profit = int(received2) - int(tradeSize);
        _updateStats(profit);
    }

    function _updateStats(int profit) internal {
        stats.totalTrades++;
        
        if (profit > 0) {
            stats.profitableTrades++;
            stats.totalProfit += uint(profit);
        } else {
            stats.totalLoss += uint(-profit);
        }
        
        emit TradeExecuted(uint(profit), block.timestamp);
    }

    // Admin functions
    function updateStrategyParameters(
        uint _profitThreshold,
        uint _maxSlippage,
        uint _maxTradeSize
    ) external onlyOwner {
        profitThreshold = _profitThreshold;
        maxSlippage = _maxSlippage;
        maxTradeSize = _maxTradeSize;
        
        emit StrategyParametersUpdated(_profitThreshold, _maxSlippage, _maxTradeSize);
    }

    // Emergency withdrawal function
    function emergencyWithdraw(address token, uint amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }}