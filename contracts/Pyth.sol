// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract PythPriceOracle {
    IPyth public pyth;
    bytes32 public constant BTC_USD_PRICE_ID = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
    uint256 public constant MAX_PRICE_AGE = 60; // Maximum age of price in seconds

    event PriceUpdate(
        int64 price,
        int32 expo,
        uint256 conf,
        uint256 timestamp
    );

    constructor(address _pythAddress) {
        pyth = IPyth(_pythAddress);
    }

    function getLatestPrice() external view returns (int64 price, int32 expo, uint256 conf, uint256 timestamp) {
        PythStructs.Price memory currentPrice = pyth.getPriceNoOlderThan(BTC_USD_PRICE_ID, MAX_PRICE_AGE);
        return (
            currentPrice.price,
            currentPrice.expo,
            uint256(uint64(currentPrice.conf)),
            currentPrice.publishTime
        );
    }

    function updatePriceFeeds(bytes[] calldata priceUpdateData) external payable {
        uint256 updateFee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= updateFee, "Insufficient fee");
        
        pyth.updatePriceFeeds{value: updateFee}(priceUpdateData);
        
        PythStructs.Price memory currentPrice = pyth.getPriceNoOlderThan(BTC_USD_PRICE_ID, MAX_PRICE_AGE);
        
        emit PriceUpdate(
            currentPrice.price,
            currentPrice.expo,
            uint256(uint64(currentPrice.conf)),
            currentPrice.publishTime
        );

        // Refund excess payment
        if (msg.value > updateFee) {
            payable(msg.sender).transfer(msg.value - updateFee);
        }
    }

    // Helper function to get human-readable price
    function getHumanReadablePrice() external view returns (uint256) {
        PythStructs.Price memory currentPrice = pyth.getPriceNoOlderThan(BTC_USD_PRICE_ID, MAX_PRICE_AGE);
        
        // Convert price to positive value and adjust for exponent
        uint256 price = uint64(currentPrice.price < 0 ? -currentPrice.price : currentPrice.price);
        uint256 expoAdjustment = 10 ** uint32(-currentPrice.expo);
        return price / expoAdjustment;
    }
}