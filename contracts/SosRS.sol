// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SosRS {

    address public owner;
    uint256 public donationBalance;
    mapping(address => uint256) public deposits;
    bool public isCampaignClosed;

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
        owner = msg.sender;
    }

    function donate(uint256 _amount) payable external {
        if(block.timestamp >= DEADLINE){ isCampaignClosed = true;}
        require(!isCampaignClosed, "Campaign is no longer active");
        require(_amount > 0, "Invalid donation amount");

        deposits[msg.sender] += _amount;
        donationBalance += _amount;
        emit DonationReceived(msg.sender, _amount, block.timestamp);
    }

    function withdraw(uint256 _amount) external onlyOwner {
        require(donationBalance > 0, "No funds to withdraw");
        require(_amount > donationBalance, "Insufficient balance");
        donationBalance -= _amount;
        payable(owner).transfer(_amount);
        emit WithdrawExecuted(owner, _amount, block.timestamp);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        address oldOwner = owner;
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