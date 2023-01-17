pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import './RAD.sol';

contract Governance is Ownable, StandardToken {

    // Constants
    address public radTokenAddress;

    // Variables
    uint256 public startTimestamp;
    uint256 public endTimestamp;
    uint256 public numOptions;

    // Mappings
    mapping(address => uint256) public userContribution;
    mapping(uint256 => uint256) public optionVoteCount;

    // Events
    event UserVoted(address voter, uint256 contribution, uint256 weight);
    event UserRefunded(address voter, uint256 contribution);

    /// @dev Constructor for the Radian Governance smart contract
    /// @param _startTimestamp Start time of the voting
    /// @param _endTimestamp End time of the voting
    /// @param _numOptions Number of options for the vote
    function Governance(uint256 _startTimestamp, uint256 _endTimestamp, uint256 _numOptions, address _radTokenAddress) {
        require(_startTimestamp != 0);
        require(_endTimestamp != 0);
        require(_numOptions != 0);
        require(_radTokenAddress != address(0));

        startTimestamp = _startTimestamp;
        endTimestamp = _endTimestamp;
        numOptions = _numOptions;
        radTokenAddress =_radTokenAddress;
    }

    /// @dev Allows a user to vote for their option
    /// @param choice Option that the user is choosing
    /// @param contribution Number of RAD they are committing for the vote
    function vote(uint256 choice, uint256 contribution)
        public
    {
        require(choice <= numOptions);
        require(block.timestamp > startTimestamp);
        require(block.timestamp < endTimestamp);

        // Check RAD balance of the voter
        StandardToken RADToken = StandardToken(radTokenAddress);
        uint256 radTokenBalance = RADToken.balanceOf(msg.sender);
        require(contribution <= radTokenBalance);

        // Log vote
        userContribution[msg.sender] += contribution;

        // Convert to a weighted number
        uint256 weight = weightCalculation(contribution);
        optionVoteCount[choice] += weight;

        // Transfer RAD from the user to the contract
        require(RADToken.transferFrom(msg.sender, address(this), contribution));
        UserVoted(msg.sender, contribution, weight);
    }

    /// @dev Calculate the weight of the contribution
    /// @param _contribution Amount of RAD contributed for the vote
    function weightCalculation(uint256 _contribution)
        view
        internal
        returns(uint256)
    {
        return _contribution;
    }

    /// @dev Return RAD to the voters after the completion of the vote
    /// @notice User addresses will be stored in a DB offchain
    /// @param voters People who have voted
    function returnRAD(address[] voters)
        public
        onlyOwner
    {
        require(block.timestamp > endTimestamp);

        // Return RAD to voters
        for (uint256 i = 0; i < voters.length; i++) {
            uint256 amountToReturn = userContribution[voters[i]];
            require(amountToReturn != 0);
            require(StandardToken(radTokenAddress).transfer(voters[i], amountToReturn));
            userContribution[voters[i]] = 0;
            UserRefunded(voters[i], amountToReturn);
        }
    }

    /// @dev Change start timestamp
    /// @param newStartTime New starting time
    function changeStartTimestamp(uint256 newStartTime)
        public
        onlyOwner
    {
        require(newStartTime != 0);
        require(block.timestamp < newStartTime);
        require(block.timestamp < startTimestamp);
        require(newStartTime < endTimestamp);

        startTimestamp = newStartTime;
    }

    /// @dev Change end time
    /// @param newEndTime New ending time
    function changeEndTimestamp(uint256 newEndTime)
        public
        onlyOwner
    {
        require(newEndTime != 0);
        require(block.timestamp < newEndTime);
        require(block.timestamp < endTimestamp);

        endTimestamp = newEndTime;
    }

    /// @dev Change number of options
    /// @param newNumOptions New number of options
    function changeNumOptions(uint256 newNumOptions)
        public
        onlyOwner
    {
        require(newNumOptions != 0);
        require(block.timestamp < startTimestamp);

        numOptions = newNumOptions;
    }

    function ()
        external
    {
        revert();
    }
}
