// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISosRS {
    event DonationReceived(address indexed contributor, uint256 amount, uint256 timestamp);
    event WithdrawExecuted(address indexed recipient, uint256 amount, uint256 timestamp);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner, uint timestamp);

    receive() payable external;
    function withdraw(uint256 _amount) payable external;
    function transferOwnership(address payable _newOwner) external;
    function forceCampaignClosure() external;
}

contract SosRS {

    uint256 public id;
    address payable public owner;
    uint32 public immutable deadline;
    uint128 public immutable donationGoal;
    bool public isCampaignClosed;
    bytes32 public campaignName;
    bytes32 public objectivesHash;
    bytes32 public descriptionHash;
    bytes32 public contact;
    bytes32 public city;
    bytes32 public country;
    bytes32 public imageHash;
    uint256 public donationBalance;
    mapping(address => uint256) public deposits;

    event DonationReceived(address indexed contributor, uint256 amount, uint256 timestamp);
    event WithdrawExecuted(address indexed recipient, uint256 amount, uint256 timestamp);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner, uint timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(uint256 _id, address _owner, uint128 _donationGoal, uint32 _deadline, bytes32 _campaignName, bytes32 _objectivesHash, bytes32 _descriptionHash, bytes32 _contact, bytes32 _city, bytes32 _country, bytes32 _imageHash) {
        id = _id;
        owner = payable(_owner);
        deadline = _deadline;
        donationGoal = _donationGoal * 1 ether;
        campaignName = _campaignName;
        objectivesHash = _objectivesHash;
        descriptionHash = _descriptionHash;
        contact = _contact;
        city = _city;
        country = _country;
        imageHash = _imageHash;
    }

    receive() payable external {
        if(block.timestamp >= deadline || donationBalance >= donationGoal){ isCampaignClosed = true;}
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
}