// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IShortPerp is IERC721 {
    function nextId() external view returns (uint256);

    function mintNFT(address recipient) external returns (uint256 _newId);
}
