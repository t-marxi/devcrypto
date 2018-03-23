var CrowdsaleMock = artifacts.require("./CrowdsaleMock.sol");

module.exports = function(deployer) {              
  deployer.deploy(CrowdsaleMock);
};
