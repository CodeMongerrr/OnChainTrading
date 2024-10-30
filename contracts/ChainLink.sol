// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DataConsumerV3 {
    AggregatorV3Interface internal dataFeed;
    constructor() {
        dataFeed = AggregatorV3Interface(
            0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
        );
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        (
            ,int answer,,,
        ) = dataFeed.latestRoundData();
        return answer;
    }
}