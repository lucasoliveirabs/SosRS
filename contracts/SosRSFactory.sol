// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "contracts/SosRS.sol";

contract SosRSFactory {

    mapping (uint256 => address) public campaigns;
    uint256 public id;

    event CampaignCreated(address indexed owner, uint256 indexed id, address indexed contractAddress, uint256 timestamp);

    function createCampaign(address _owner, uint128 _donationGoal, uint32 _deadline, string memory _campaignName, string memory _objectives, string memory _description, string memory _contact, string memory _city, string memory _country, bytes32 _imageHash) external {
        id++;
        SosRS sosRs = new SosRS(id, _owner, _donationGoal, _deadline, _campaignName, _objectives, _description, _contact, _city, _country, _imageHash);
        campaigns[id] = address(sosRs);
        emit CampaignCreated(_owner, id, address(sosRs), block.timestamp);
    }
}