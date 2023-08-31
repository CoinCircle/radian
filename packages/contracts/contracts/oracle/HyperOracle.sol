pragma solidity >=0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract HyperOracle is Ownable {

	uint private _price;

	constructor() {
		_price = 0;
	}

	function setPrice(uint _fromPrice) public onlyOwner {
		_price = _fromPrice;
	}

	function getPrice() public view returns (uint) {
		return _price;
	}

}
