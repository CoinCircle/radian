// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20FlashMintUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./RadianXToken.sol";
import "./Collector.sol";


contract Radian is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    ERC20FlashMintUpgradeable,
    UUPSUpgradeable
{
    using SafeMath for uint256;

    RadianX public radianx;
    Collector public collector;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(RadianX _radianX, Collector _collector) initializer public {
        __ERC20_init("Radian", "RADIAN");
        __ERC20Burnable_init();
        __Pausable_init();
        __Ownable_init();
        __ERC20Permit_init("Radian");
        __ERC20FlashMint_init();
        __UUPSUpgradeable_init();

        _mint(msg.sender, 1500000000 * 10 ** decimals());

        radianx = _radianX;
        collector = _collector;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._burn(account, amount);
    }

    // =========================================================================
    // COLLECTOR
    // =========================================================================

    function redeem(address[] memory assets, uint256 amount) public {
        _redeem(msg.sender, assets, amount);
    }

    /**
     *
     */
    function _redeem(address _addr, address[] memory _assets, uint256 _radAmount) internal {
        require(_addr != address(0), "INVALID_ADDRESS");
        require(_radAmount > 0, "INVALID_AMOUNT");

        // validate whitelist
        for (uint256 i = 0; i < _assets.length; i++) {
            require(collector.isCollectableByAddress(_assets[i]), "INVALID_ASSET");
        }

        // Calculate percentage of collector
        uint256 _percentage = _radAmount.div(totalSupply());

        _burn(_addr, _radAmount);

        for (uint256 i = 0; i < _assets.length; i++) {
            uint256 _collectorBalance = IERC20Upgradeable(_assets[i]).balanceOf(address(collector));
            uint256 _withdrawAmount = _collectorBalance.mul(_percentage);
            if (_withdrawAmount > 0) {
                collector.withdraw(_addr, _assets[i], _withdrawAmount);
            }
        }

        // Could possibly emit an event here like:
        // emit Redeemed(address _addr, uint256 _radAmount, address[] _assets, uint256[] _withdrawAmounts);
        // however if the list is long, this can cost a lot of gas.
    }

    // =========================================================================
    // RAD <> RADX
    // =========================================================================
    function radianToRadianX(uint256 _amount)
        external
    {
        // Check balance
        require(this.balanceOf(msg.sender) >= _amount, "insufficient radian balance");
        // This contract will always be approved to transfer on behalf of user
        this.burn(_amount);
        radianx.mint(msg.sender, _amount);
    }

    function radianXToRadian(uint256 _amount)
        external
    {
        // Check balance
        require(radianx.balanceOf(msg.sender) >= _amount, "insufficient radianx balance");
        // This contract will always be approved to transfer on behalf of user
        radianx.burn(msg.sender, _amount);
        this.mint(msg.sender, _amount);
    }


    // =========================================================================
    // RADIAN VESTING SUPPORT
    // =========================================================================
    struct Vesting {
        address from;
        uint256 startBlock;
        uint256 endBlock;
        uint256 releasedAmount;
        uint256 totalAmount;
    }

    /**
     * Maps vested transfers by from address, to a map of "to" addresses. Allows
     * for multiplee vested transfers with the same sender and receiver.
     * e.g.
     * {
     *  "0x2": [vestedTransfer1, vestedTransfer2]
     * }
     * The above signifies that 0x2 has 2 incoming vesting transfers
     */
    mapping (address => Vesting[]) vestedTransfers;

    /**
     * Make a vested transfer to an address
     */
    function vestedTransfer(
        address to,
        uint256 amount,
        uint256 startBlock,
        uint256 endBlock
    ) external {
        _vestedTransfer(to, amount, startBlock, endBlock);
    }

    /**
     * Check own vesting progress
     */
    function vestingProgress() external view returns (uint256, uint256, uint256) {
        return _vestingProgress(msg.sender);
    }

    /**
     * Transfers amount tokens to "to" address, vesting evenly from startBlock
     * until endBlock
     */
    function _vestedTransfer(
        address _to,
        uint256 _amount,
        uint256 _startBlock,
        uint256 _endBlock
    )
        internal
    {
        // checks --------------------------------------------------------------
        require(balanceOf(msg.sender) >= _amount, "RadianToken::_vestedTransfer: insufficient balance for vested transfer");

        // effects -------------------------------------------------------------

        // for sanity check
        uint256 prevBalanceOfNullAddress = balanceOf(address(0));

        // create vesting
        vestedTransfers[_to].push(Vesting({
            from: msg.sender,
            startBlock: _startBlock,
            endBlock: _endBlock,
            releasedAmount: uint256(0),
            totalAmount: _amount
        }));

        // interactions --------------------------------------------------------
        // transfer from sender to null address
        transferFrom(msg.sender, address(0), _amount);

        // sanity check
        require(balanceOf(address(0)) >= prevBalanceOfNullAddress.add(_amount), "RadianToken:_vestedTransfer failed sanity check");
    }

    /**
     * Given an address and vesting index, returns the releasable amount and total amount if fully vested.
     */
    function _releasableAmount(address addr, uint i) internal view returns (uint256, uint256, uint256) {
        require(vestedTransfers[addr].length > i, "RadianToken::_releasableAmount: vesting index does not exist for address");

        Vesting memory vesting = vestedTransfers[addr][i];
        uint totalBlocks = vesting.endBlock.sub(vesting.startBlock);
        uint blocksSinceStart = block.number.sub(vesting.startBlock);
        uint progress = blocksSinceStart.div(totalBlocks);
        uint totalVested = vesting.totalAmount.mul(progress);
        uint releasable = totalVested.sub(vesting.releasedAmount);

        return (vesting.releasedAmount, releasable, vesting.totalAmount);
    }

    function _vestAtIndex(address addr, uint i) internal {
        // checks --------------------------------------------------------------

        // effects -------------------------------------------------------------
        (uint256 released, uint256 releasable, uint256 total) = _releasableAmount(addr, i);

        // remove item fom storage if fully vested
        // peforms a gas-efficient removal fom array by replacing item at index
        // to be deleted with the last index, then calling pop.
        if (releasable >= total) {
            require(i < vestedTransfers[addr].length);
            if (vestedTransfers[addr].length > 1) {
                // replace item at index with last item
                vestedTransfers[addr][i] = vestedTransfers[addr][vestedTransfers[addr].length-1];
            }
            vestedTransfers[addr].pop();
        }


        // interactions --------------------------------------------------------
        _transfer(address(0), addr, releasable);
    }

    // loop through all vesting and vest
    function _vest(address addr) internal {
        for (uint i = 0; i < vestedTransfers[addr].length; i++) {
            (, uint256 releasable, ) = _releasableAmount(addr, i);
            if (releasable > 0) {
                _vestAtIndex(addr, i);
            }
        }
    }
    // function _getTotalVested() -- check total vested amounts
    function _vestingProgress(address addr) internal view returns (uint256, uint256, uint256) {
        uint256 totalReleased = uint256(0);
        uint256 totalReleasable = uint256(0);
        uint256 total = uint256(0);
        for (uint i = 0; i < vestedTransfers[addr].length; i++) {
            (uint256 releasedAmount, uint256 releasable, uint256 totalAmount) = _releasableAmount(addr, i);
            totalReleased = totalReleased.add(releasedAmount);
            totalReleasable = total.add(releasable);
            total = total.add(totalAmount);
        }
        return (totalReleased, totalReleasable, total);
    }
    // function _vestedTransferBatch() -- init multiple vested transfers



    // =========================================================================
    // EIP3009 Support (Copied from USDC)
    // =========================================================================

    /**
     * @notice Execute a transfer with a signed authorization
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        _transferWithAuthorization(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );
    }

    /**
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev This has an additional check to ensure that the payee's address
     * matches the caller of this function to prevent front-running attacks.
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        _receiveWithAuthorization(
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );
    }

    /**
     * @notice Attempt to cancel an authorization
     * @dev Works only if the authorization is not yet used.
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        _cancelAuthorization(authorizer, nonce, v, r, s);
    }

    // keccak256("TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)")
    bytes32
        public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH = 0x7c7c6cdb67a18743f49ec6fa9b35f50d52ed05cbed4cc592e13b44501c1a2267;

    // keccak256("ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)")
    bytes32
        public constant RECEIVE_WITH_AUTHORIZATION_TYPEHASH = 0xd099cc98ef71107a616c4f0f941f04c322d8e254fe26b3c6668db87aae413de8;

    // keccak256("CancelAuthorization(address authorizer,bytes32 nonce)")
    bytes32
        public constant CANCEL_AUTHORIZATION_TYPEHASH = 0x158b0a9edf7a828aad02f63cd515c68ef2f50ba807396f6d12842833a1597429;

    /**
     * @dev authorizer address => nonce => bool (true if nonce is used)
     */
    mapping(address => mapping(bytes32 => bool)) private _authorizationStates;

    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
    event AuthorizationCanceled(
        address indexed authorizer,
        bytes32 indexed nonce
    );

    /**
     * @notice Returns the state of an authorization
     * @dev Nonces are randomly generated 32-byte data unique to the
     * authorizer's address
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @return True if the nonce is used
     */
    function authorizationState(address authorizer, bytes32 nonce)
        external
        view
        returns (bool)
    {
        return _authorizationStates[authorizer][nonce];
    }

    /**
     * @notice Execute a transfer with a signed authorization
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function _transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        _requireValidAuthorization(from, nonce, validAfter, validBefore);

        bytes memory data = abi.encode(
            TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce
        );
        require(
            EIP712.recover(_domainSeparatorV4(), v, r, s, data) == from,
            "FiatTokenV2: invalid signature"
        );

        _markAuthorizationAsUsed(from, nonce);
        _transfer(from, to, value);
    }

    /**
     * @notice Receive a transfer with a signed authorization from the payer
     * @dev This has an additional check to ensure that the payee's address
     * matches the caller of this function to prevent front-running attacks.
     * @param from          Payer's address (Authorizer)
     * @param to            Payee's address
     * @param value         Amount to be transferred
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     * @param nonce         Unique nonce
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function _receiveWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        require(to == msg.sender, "FiatTokenV2: caller must be the payee");
        _requireValidAuthorization(from, nonce, validAfter, validBefore);

        bytes memory data = abi.encode(
            RECEIVE_WITH_AUTHORIZATION_TYPEHASH,
            from,
            to,
            value,
            validAfter,
            validBefore,
            nonce
        );
        require(
            EIP712.recover(_domainSeparatorV4(), v, r, s, data) == from,
            "FiatTokenV2: invalid signature"
        );

        _markAuthorizationAsUsed(from, nonce);
        _transfer(from, to, value);
    }

    /**
     * @notice Attempt to cancel an authorization
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function _cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        _requireUnusedAuthorization(authorizer, nonce);

        bytes memory data = abi.encode(
            CANCEL_AUTHORIZATION_TYPEHASH,
            authorizer,
            nonce
        );
        require(
            EIP712.recover(_domainSeparatorV4(), v, r, s, data) == authorizer,
            "FiatTokenV2: invalid signature"
        );

        _authorizationStates[authorizer][nonce] = true;
        emit AuthorizationCanceled(authorizer, nonce);
    }

    /**
     * @notice Check that an authorization is unused
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     */
    function _requireUnusedAuthorization(address authorizer, bytes32 nonce)
        private
        view
    {
        require(
            !_authorizationStates[authorizer][nonce],
            "FiatTokenV2: authorization is used or canceled"
        );
    }

    /**
     * @notice Check that authorization is valid
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @param validAfter    The time after which this is valid (unix time)
     * @param validBefore   The time before which this is valid (unix time)
     */
    function _requireValidAuthorization(
        address authorizer,
        bytes32 nonce,
        uint256 validAfter,
        uint256 validBefore
    ) private view {
        require(
            block.timestamp > validAfter,
            "FiatTokenV2: authorization is not yet valid"
        );
        require(block.timestamp < validBefore, "FiatTokenV2: authorization is expired");
        _requireUnusedAuthorization(authorizer, nonce);
    }

    /**
     * @notice Mark an authorization as used
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     */
    function _markAuthorizationAsUsed(address authorizer, bytes32 nonce)
        private
    {
        _authorizationStates[authorizer][nonce] = true;
        emit AuthorizationUsed(authorizer, nonce);
    }
}
