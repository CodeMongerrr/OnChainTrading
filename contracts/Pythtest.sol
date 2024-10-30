// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
 
import "hardhat/console.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract MyFirstPythContract {
    IPyth pyth;
    bytes32 ethUsdPriceId;
 
    constructor(address _pyth, bytes32 _ethUsdPriceId) {
        pyth = IPyth(_pyth);
        ethUsdPriceId = _ethUsdPriceId;
        // Using string and address separately
        console.log("Contract deployed with Pyth address:");
        console.log(_pyth);
    } 

    function mint() public payable {
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(
            ethUsdPriceId,
            60
        );
 
        uint ethPrice18Decimals = (uint(uint64(price.price)) * (10 ** 18)) /
            (10 ** uint8(uint32(-1 * price.expo)));
        uint oneDollarInWei = ((10 ** 18) * (10 ** 18)) / ethPrice18Decimals;
 
        // Using separate console.log calls for each value
        console.log("Price data received");
        console.log("Raw price:");
        console.log(uint(uint64(price.price)));
        console.log("Required payment in wei:");
        console.log(oneDollarInWei);
 
        if (msg.value >= oneDollarInWei) {
            console.log("Payment sufficient. Amount:");
            console.log(msg.value);
            // User paid enough money.
            // TODO: mint the NFT here
        } else {
            console.log("Payment insufficient. Received:");
            console.log(msg.value);
            console.log("Required:");
            console.log(oneDollarInWei);
            revert InsufficientFee();
        }
    }
 
    // Error raised if the payment is not sufficient
    error InsufficientFee();
}