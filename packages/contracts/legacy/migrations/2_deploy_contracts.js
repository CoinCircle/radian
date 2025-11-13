var RAD = artifacts.require('./RAD.sol');
var Radian = artifacts.require('./Radian.sol');

const CC_SUPPLY = 0x1;
const COMMUNITY_SUPPLY = 0x2;
const COLLECTOR_ADDRESS = 0x3;
const WHITELIST_ADDRESS = 0x00eb69ab4b19440d2ec4f35d21c08e328ce877d3;

module.exports = function (deployer) {
  deployer.deploy(RAD, CC_SUPPLY, COMMUNITY_SUPPLY).then(function () {
    return deployer.deploy(Radian, RAD.address, WHITELIST_ADDRESS, COLLECTOR_ADDRESS);
  });
};
