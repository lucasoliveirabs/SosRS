import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractTransactionReceipt } from "ethers";

describe("SosRS", function () {

  async function deployFixture() {  // single deploy, independent copies

    const [owner, addr1, addr2] = await ethers.getSigners();
    const SosRS = await ethers.getContractFactory("SosRS"); 
    const contract = await SosRS.deploy();  

    return { contract, owner, addr1, addr2 };
  }

  describe("receive", async function() {
    it("Should receive multiple donations from any address - happy path", async function (){
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

  describe("withdraw", async function(){
    it("Should withdraw multiple orders - happy path ", async function(){
      const {contract, owner, addr1} = await loadFixture(deployFixture);

      let utils = require("ethers");
      await addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("17.0")
      });
      await contract.forceCampaignClosure();

      function getGasCost(receipt: ContractTransactionReceipt | null){
        if (!receipt || receipt.status !== 1) {
          throw new Error("Transaction failed or receipt is null");
        }
        return receipt.gasUsed * receipt.gasPrice;
      }

      let ownerPreviousBalance = await ethers.provider.getBalance(owner);
      let latestBlockTimestamp = (await ethers.provider.getBlock('latest'))?.timestamp;
      let transactionHash = await contract.connect(owner).withdraw(utils.parseEther("12.0"));
      expect(transactionHash).to.emit(contract, "WithdrawExecuted").withArgs(owner, utils.parseEther("12.0"), latestBlockTimestamp);
      expect(await ethers.provider.getBalance(owner)).to.equal(ownerPreviousBalance + utils.parseEther("12.0") - getGasCost(await transactionHash.wait()));
      expect((await contract.donationBalance()).toString()).to.equal(utils.parseEther("5.0").toString());
    

      ownerPreviousBalance = await ethers.provider.getBalance(owner);
      latestBlockTimestamp = (await ethers.provider.getBlock('latest'))?.timestamp;
      transactionHash = await contract.connect(owner).withdraw(utils.parseEther("2.0"));
      expect(transactionHash).to.emit(contract, "WithdrawExecuted").withArgs(owner, utils.parseEther("2.0"), latestBlockTimestamp);
      expect(await ethers.provider.getBalance(owner)).to.equal(ownerPreviousBalance + utils.parseEther("2.0") - getGasCost(await transactionHash.wait()));
      expect((await contract.donationBalance()).toString()).to.equal(utils.parseEther("3.0").toString());


      ownerPreviousBalance = await ethers.provider.getBalance(owner);
      latestBlockTimestamp = (await ethers.provider.getBlock('latest'))?.timestamp;
      transactionHash = await contract.connect(owner).withdraw(utils.parseEther("3.0"));
      expect(transactionHash).to.emit(contract, "WithdrawExecuted").withArgs(owner, utils.parseEther("3.0"), latestBlockTimestamp);
      expect(await ethers.provider.getBalance(owner)).to.equal(ownerPreviousBalance + utils.parseEther("3.0") - getGasCost(await transactionHash.wait()));
      expect((await contract.donationBalance()).toString).to.equal(utils.parseEther("0.0").toString);      
    });
    
    it("Should revert in case of no balance", async function(){
      const {contract, owner} = await loadFixture(deployFixture);
      await expect(contract.connect(owner).withdraw(0)).to.be.revertedWith("No balance");         
    });

    it("Should revert in case of insufficient balance", async function() {
      const {contract, owner, addr1} = await loadFixture(deployFixture);

      let utils = require("ethers");
      await addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("2.0")
      });
      await expect(contract.connect(owner).withdraw(utils.parseEther("10.0"))).to.be.revertedWith("Insufficient balance"); 
      await expect(contract.connect(owner).withdraw(utils.parseEther("7.0"))).to.be.revertedWith("Insufficient balance"); 
      await expect(contract.connect(owner).withdraw(utils.parseEther("6.0"))).to.be.revertedWith("Insufficient balance"); 
    });

    it("Should revert in case of open campaign", async function() {
      const {contract, owner, addr1} = await loadFixture(deployFixture);

      let utils = require("ethers");
      await addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("20.0")
      });
      await expect(contract.connect(owner).withdraw(utils.parseEther("10.0"))).to.be.revertedWith("Campaign must be closed"); 
      await expect(contract.connect(owner).withdraw(utils.parseEther("7.0"))).to.be.revertedWith("Campaign must be closed"); 
      await expect(contract.connect(owner).withdraw(utils.parseEther("6.0"))).to.be.revertedWith("Campaign must be closed"); 
    });

    it("Should revert in case of non-owner attempt", async function() {
      const {contract, addr1, addr2} = await loadFixture(deployFixture);

      let utils = require("ethers");
      await addr1.sendTransaction({
        to: contract,
        value: utils.parseEther("20.0")
      });
      await expect(contract.connect(addr1).withdraw(utils.parseEther("10.0"))).to.be.revertedWith("Only owner"); 
      await expect(contract.connect(addr2).withdraw(utils.parseEther("7.0"))).to.be.revertedWith("Only owner"); 
      await expect(contract.connect(addr2).withdraw(utils.parseEther("6.0"))).to.be.revertedWith("Only owner"); 
    });
  });

  describe("transferOwnership", async function(){
    it("Should transfer ownety - happy path", async function(){
      const {contract, owner, addr1, addr2} = await loadFixture(deployFixture);

      let transactionHash = await contract.connect(owner).transferOwnership(addr1);
      let latestBlockTimestamp = (await ethers.provider.getBlock('latest'))?.timestamp;
      await expect(transactionHash).to.emit(contract, "OwnershipTransferred").withArgs(owner, addr1, latestBlockTimestamp);
      
      transactionHash = await contract.connect(addr1).transferOwnership(addr2);
      latestBlockTimestamp = (await ethers.provider.getBlock('latest'))?.timestamp;
      await expect(transactionHash).to.emit(contract, "OwnershipTransferred").withArgs(addr1, addr2, latestBlockTimestamp);
    });

    it("Should revert in case of non-owner attempt", async function(){
      const {contract, addr1, addr2} = await loadFixture(deployFixture);
      await expect(contract.connect(addr1).transferOwnership(addr2)).to.be.revertedWith("Only owner");
      await expect(contract.connect(addr2).transferOwnership(addr1)).to.be.revertedWith("Only owner");
    });

    it("Should revert in case of invalid new owner address ", async function(){
      const {contract, owner} = await loadFixture(deployFixture);
      await expect(contract.connect(owner).transferOwnership(ethers.ZeroAddress)).to.be.revertedWith("Invalid new owner");
    });
  });

  describe("forceCampaignClosure", async function() {
    it("Should close the campaign - happy path", async function(){
      const {contract, owner} = await loadFixture(deployFixture);
      await contract.connect(owner).forceCampaignClosure();
      expect(await contract.isCampaignClosed()).to.be.true;
    });

    it("Should revert in case of non-owner attempt", async function(){
      const {contract, addr1, addr2} = await loadFixture(deployFixture);
      await expect(contract.connect(addr1).forceCampaignClosure()).to.be.revertedWith("Only owner");
      await expect(contract.connect(addr2).forceCampaignClosure()).to.be.revertedWith("Only owner");
    });
  });
});
