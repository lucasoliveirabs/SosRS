// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SosRS {

    address payable public owner;
    bool public isCampaignClosed;
    uint256 public donationBalance;
    mapping(address => uint256) public deposits;

    uint128 public constant DONATION_GOAL = 40 ether;
    uint32 public constant DEADLINE = 1720180800;

    event DonationReceived(address indexed contributor, uint256 amount, uint256 timestamp);
    event WithdrawExecuted(address indexed recipient, uint256 amount, uint256 timestamp);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner, uint timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = payable(msg.sender);
    }

    receive() payable external {
        if(block.timestamp >= DEADLINE){ isCampaignClosed = true;}
        require(!isCampaignClosed, "Campaign is no longer active");
        require(msg.value > 0, "Invalid donation amount");

        deposits[msg.sender] += msg.value;
        donationBalance += msg.value;
        emit DonationReceived(msg.sender, msg.value, block.timestamp);
    }

    function withdraw(uint256 _amount) payable external onlyOwner {
        require(donationBalance > 0, "No balance");
        require(donationBalance >= _amount, "Insufficient balance");
        require(isCampaignClosed, "Campaign must be closed");
        donationBalance -= _amount;

        payable(msg.sender).transfer(_amount);
        emit WithdrawExecuted(msg.sender, _amount, block.timestamp);
    }

    function transferOwnership(address payable _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        address payable oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner, block.timestamp);
    }

    function forceCampaignClosure() external onlyOwner {
        isCampaignClosed = true;
    }

    function isDonationGoalReached() external view returns (bool isGoalReached) {
        return donationBalance >= DONATION_GOAL;
    }
}