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
        require(_amount > 0, "Invalid donation amount");
        require(!isCampaignClosed, "Campaign is no longer active");

        deposits[msg.sender] += _amount;
        donationBalance += _amount;
        emit DonationReceived(msg.sender, _amount, block.timestamp);

        if(block.timestamp >= DEADLINE){
            isCampaignClosed = true;
        }
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

    function forceCampaignClosure() external onlyOwner {
        isCampaignClosed = true;
    }
}