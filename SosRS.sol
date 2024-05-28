// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SosRS {

    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    //donate 

    //withdraw

    //transferOwnership

    //closeCampaign

    //checkDeadlineReached

    //checkGoalReached
}