// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SosRS {

    address public owner;
    uint256 public donationBalance;
    mapping(address => uint256) public deposits;

    event DonationReceived(address indexed contributor, uint256 amount, uint256 timestamp);
    event WithdrawExecuted(address indexed recipient, uint256 amount, uint256 timestamp);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner, uint timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function donate(uint256 _amount) payable external {
        deposits[msg.sender] += _amount;
        donationBalance += _amount;
        emit DonationReceived(msg.sender, _amount, block.timestamp);
    }

    function withdraw(uint256 _amount) external onlyOwner {
        require(_amount > donationBalance, "Insufficient balance");
        donationBalance -= _amount;
        payable(msg.sender).transfer(_amount);
        emit WithdrawExecuted(msg.sender, _amount, block.timestamp);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner, block.timestamp);
    }

    //closeCampaign

    //checkDeadlineReached

    //checkGoalReached
}