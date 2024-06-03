import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SosRS", function () {

  async function deployFixture() {  // single deploy, independent copies

    const [owner, addr1, addr2] = await ethers.getSigners();
    const SosRS = await ethers.getContractFactory("SosRS"); 
    const contract = await SosRS.deploy();  

    return { contract, owner, addr1, addr2 };
  }

  describe("receive ", async function() {
    it("Should receive multiple donations from any address", async function (){
      const {contract, owner, addr1, addr2 } = await loadFixture(deployFixture);
      let utils = require("ethers");

      await owner.sendTransaction({
        to: contract,
        value: utils.parseEther("1.0")
      });
      expect(await contract.donationBalance()).to.equal(utils.parseEther("1.0"));
      expect(await contract.deposits(owner)).to.equal(utils.parseEther("1.0"));

      await addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("2.0")
      });
      expect(await contract.donationBalance()).to.equal(utils.parseEther("3.0"));
      expect(await contract.deposits(addr1)).to.equal(utils.parseEther("2.0"));

      await addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("3.0")
      });
      expect(await contract.donationBalance()).to.equal(utils.parseEther("6.0"));
      expect(await contract.deposits(addr1)).to.equal(utils.parseEther("5.0"));

      await addr2.sendTransaction({
        to: contract,
        value: utils.parseEther("4.0")
      });
      expect(await contract.donationBalance()).to.equal(utils.parseEther("10.0"));
      expect(await contract.deposits(addr2)).to.equal(utils.parseEther("4.0"));

      await addr2.sendTransaction({
        to: contract,
        value: utils.parseEther("5.0")
      });
      expect(await contract.donationBalance()).to.equal(utils.parseEther("15.0"));
      expect(await contract.deposits(addr2)).to.equal(utils.parseEther("9.0"));

      await owner.sendTransaction({
        to: contract,
        value: utils.parseEther("6.0")
      });
      expect(await contract.donationBalance()).to.equal(utils.parseEther("21.0"));
      expect(await contract.deposits(owner)).to.equal(utils.parseEther("7.0"));
    });

    it("Should emit event with right parameters after donation receive", async function(){
      const {contract, owner, addr1, addr2} = await loadFixture(deployFixture);
      let utils = require("ethers");

      let transactionHash = await addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("3.0")
      });
      let latestBlockTimestamp = (await ethers.provider.getBlock('latest'))?.timestamp;
      expect(await transactionHash).to.emit(contract, "DonationReceived").withArgs(addr1, utils.parseEther("3.0"), latestBlockTimestamp);

      transactionHash = await addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("5.0")
      });
      latestBlockTimestamp = (await ethers.provider.getBlock('latest'))?.timestamp;
      expect(await transactionHash).to.emit(contract, "DonationReceived").withArgs(addr2, utils.parseEther("5.0"), latestBlockTimestamp);

      transactionHash = await addr2.sendTransaction({
        to: contract,
        value: utils.parseEther("1.0")
      });
      latestBlockTimestamp = (await ethers.provider.getBlock('latest'))?.timestamp;
      expect(await transactionHash).to.emit(contract, "DonationReceived").withArgs(addr2, utils.parseEther("1.0"), latestBlockTimestamp);

      transactionHash = await owner.sendTransaction({
        to: contract,
        value: utils.parseEther("7.0")
      });
      latestBlockTimestamp = (await ethers.provider.getBlock('latest'))?.timestamp;
      expect(await transactionHash).to.emit(contract, "DonationReceived").withArgs(owner, utils.parseEther("7.0"), latestBlockTimestamp);
    });

    it("Should revert in case of donated amount == 0", async function(){
      const {contract, owner, addr1} = await loadFixture(deployFixture);
      let utils = require("ethers");

      let transactionHash = owner.sendTransaction({
        to: contract,
        value: utils.parseEther("0.0")
      });
      await expect(transactionHash).to.be.revertedWith("Invalid donation amount");   

      transactionHash = addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("0.0")
      });
      await expect(transactionHash).to.be.revertedWith("Invalid donation amount");
    });

    it("Should revert in case of donation after campaign closure", async function(){
      const {contract, owner, addr1} = await loadFixture(deployFixture);
      let utils = require("ethers");

      await contract.forceCampaignClosure();

      let transactionHash = owner.sendTransaction({
        to: contract,
        value: utils.parseEther("0.0")
      });
      await expect(transactionHash).to.be.revertedWith("Campaign is no longer active");     

      transactionHash = addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("2.0")
      });
      await expect(transactionHash).to.be.revertedWith("Campaign is no longer active"); 
    });
  });
});
