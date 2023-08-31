var RAD = artifacts.require("./RAD.sol");
var Radian = artifacts.require("./Radian.sol");

const CC_SUPPLY = 0x1;
const COMMUNITY_SUPPLY = 0x2;
const COLLECTOR_ADDRESS = 0X3;
const WHITELIST_ADDRESS = 0x00eb69aB4b19440D2Ec4f35D21C08E328cE877D3;


module.exports = function(deployer) {
    deployer.deploy(RAD, CC_SUPPLY, COMMUNITY_SUPPLY).then(function() {
        return deployer.deploy(Radian, RAD.address, WHITELIST_ADDRESS, COLLECTOR_ADDRESS)
    });
};
