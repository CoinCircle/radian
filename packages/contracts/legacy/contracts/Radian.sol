pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import './RAD.sol';

contract Whitelist {
    mapping(address => bool) public isVerifiedByAddress;
    mapping(address => bool) public isAccreditedByAddress;
}

contract Radian is Ownable, BurnableToken, StandardToken {
    using SafeMath for uint;

    // Variables
    address public radAddress;
    address public whitelistAddress;
    address public collectorAddress;

    // Events
    event WithdrawToken(address indexed token, address user, uint amount);
    event RedeemTokens(address indexed tokenAddress, address redeemer, uint256 amount);

    modifier onlyVerified() {
        Whitelist whitelist = Whitelist(whitelistAddress);
        require(whitelist.isVerifiedByAddress(msg.sender));
        _;
    }

    /// @dev Constructor for the Radian smart contract
    /// @param _radAddress Address of the RAD smart contract
    /// @param _whitelistAddress Address of the whitelist smart contract
    /// @param _collectorAddress Address where excess tokens are sent
    function Radian(address _radAddress, address _whitelistAddress, address _collectorAddress) {
        require(_radAddress != address(0));
        require(_whitelistAddress != address(0));
        require(_collectorAddress != address(0));

        radAddress = _radAddress;
        whitelistAddress = _whitelistAddress;
        collectorAddress = _collectorAddress;
    }

    /// @dev Liquidate RAD tokens in exchange for tokens held in the contract
    /// @param tokenAddresses Array of addresses of tokens to be redeemed
    function liquidateRAD(address[] tokenAddresses, uint256 amount)
        onlyVerified
        public
    {
        // Check RAD balance of the liquidator and total supply
        StandardToken RADToken = StandardToken(radAddress);
        uint256 radTokenBalance = RADToken.balanceOf(msg.sender);
        uint256 radTotalSupply = RADToken.totalSupply();

        // Burn RAD. Approve in a different transaction on webapp.
        require(RADToken.transferFrom(msg.sender, address(this), amount));
        BurnableToken(radAddress).burn(amount);

        // Distribute tokens to the holder
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            uint256 amountToDistribute = calculateTokenAmount(tokenAddresses[i], amount, radTotalSupply);
            require(StandardToken(tokenAddresses[i]).transfer(msg.sender, amountToDistribute));
            RedeemTokens(tokenAddresses[i], msg.sender, amountToDistribute);
        }
    }

    /// @dev Calculate the amount of token to return to the liquidator
    /// @param _tokenAddress Address of the token to be calculated
    /// @param _amount Amount of RAD that the user is liquidating
    /// @param _radTotalSupply Total supply of RAD
    function calculateTokenAmount(address _tokenAddress, uint256 _amount, uint256 _radTotalSupply)
        view
        internal
        returns (uint256)
    {
        // Calculate number of tokens stored in the Radian contract
        StandardToken redemptionToken = StandardToken(_tokenAddress);
        uint256 tokenBalance = redemptionToken.balanceOf(this);

        // Calculate and return the number of tokens to distribute to the user
        return tokenBalance.mul(_amount).div(_radTotalSupply);
    }

    /// @dev Remove tokens from the Radian smart contract
    /// @param tokenAddress Address of token to be removed
    /// @param amount Amount of tokens to be removed
    function removeToken(address tokenAddress, uint256 amount)
        onlyOwner
        public
    {
        // Check balance of the token in the Radian contract
        StandardToken token = StandardToken(tokenAddress);
        uint256 tokenBalance = token.balanceOf(this);
        require(amount <= tokenBalance);

        // Send tokens out of the Radian contract
        require(StandardToken(tokenAddress).transfer(msg.sender, amount));
        WithdrawToken(tokenAddress, msg.sender, amount);
    }

    function ()
        external
    {
        revert();
    }
}
