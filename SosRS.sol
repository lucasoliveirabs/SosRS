// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SosRS {

    address public owner;
    uint256 public donationBalance;
    mapping(address => uint256) public deposits;

    event DonationReceived(address indexed contributor, uint256 amount, uint256 timestamp);
    event WithdrawExecuted(address indexed recipient, uint256 amount, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function donate(uint256 _amount) payable external {
        deposits[msg.sender] += msg.value;
        donationBalance += msg.value;
        emit DonationReceived(msg.sender, _amount, block.timestamp);
    }

    function withdraw(uint256 _amount) external payable onlyOwner {
        require(_amount > donationBalance, "Insufficient balance");
        donationBalance -= msg.value;
        payable(msg.sender).transfer(_amount);
        emit WithdrawExecuted(msg.sender, _amount, block.timestamp);
    }

    //transferOwnership

    //closeCampaign

    //checkDeadlineReached

    //checkGoalReached
}