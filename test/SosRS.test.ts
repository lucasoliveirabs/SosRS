import {loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SosRS", function () {

  async function deployFixture() {  // single deploy, independent copies

    const [owner, addr1, addr2] = await hre.ethers.getSigners();
    const SosRS = await hre.ethers.getContractFactory("SosRS"); 
    const contract = await SosRS.deploy();  

    return { contract, owner, addr1, addr2 };
  }

  describe("donate", async function() {
    it("Should receive any donation from any address", async function (){
      const {contract, addr1 } = await loadFixture(deployFixture);

      await contract.connect(addr1).donate(10);
      expect(await contract.donationBalance()).to.equal(10);
      expect(await contract.deposits(addr1));
    });

    it("Should receive multiple donations from any address", async function (){
      const {contract, addr1, addr2} = await loadFixture(deployFixture);

      await contract.connect(addr1).donate(1);
      expect(await contract.donationBalance()).to.equal(1);
      expect(await contract.deposits(addr1.address)).to.equal(1);
      
      await contract.connect(addr2).donate(5);
      expect(await contract.donationBalance()).to.equal(6);
      expect(await contract.deposits(addr2.address)).to.equal(5);
    
      await contract.connect(addr2).donate(2);
      expect(await contract.donationBalance()).to.equal(8);
      expect(await contract.deposits(addr2.address)).to.equal(7);
    });

    it("Should emit event with right parameters after donation", async function(){
      const {contract, addr1, addr2} = await loadFixture(deployFixture);

      await contract.connect(addr1).donate(1);
      let latestBlockTimestamp = (await hre.ethers.provider.getBlock('latest'))?.timestamp;
      expect(await contract.donate).to.emit(contract, "DonationReceived").withArgs(addr1, 1, latestBlockTimestamp);

      await contract.connect(addr2).donate(2);
      latestBlockTimestamp = (await hre.ethers.provider.getBlock('latest'))?.timestamp;
      expect(await contract.donate).to.emit(contract, "DonationReceived").withArgs(addr2, 2, latestBlockTimestamp);
    });
  });
});
