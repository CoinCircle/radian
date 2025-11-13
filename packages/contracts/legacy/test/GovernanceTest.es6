var RAD = artifacts.require('./RAD.sol');
var Governance = artifacts.require('./Governance.sol');
const BigNumber = require('bignumber.js');

contract('Governance', function (accounts) {
  now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

  // Get block timestamp
  beforeEach(async () => {
    now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
  });

  const time = require('./helpers/evmChangeTime.es6');
  const mine = require('./helpers/evmMine.es6');

  // Fast forward time for tests
  const increaseTime = async by => {
    await time(by);
    now += by;
  };

  const USER_0 = accounts[0];
  const USER_1 = accounts[1];
  const USER_2 = accounts[2];
  const USER_3 = accounts[3];
  const USER_4 = accounts[4];

  const CC_ADDRESS = accounts[8];
  const COMMUNITY_ADDRESS = accounts[9];

  const START_TIMESTAMP = now;
  const END_TIMESTAMP = START_TIMESTAMP + 100;
  const NUM_OPTIONS = 2;

  const ZERO = new BigNumber(0);
  const ONE = new BigNumber(1);
  const TWO = new BigNumber(2);
  const ONE_VOTE = new BigNumber(1e18);
  const ONE_THOUSAND = new BigNumber(1000e18);
  const TEN_THOUSAND = new BigNumber(10000e18);
  const HUNDRED_THOUSAND = new BigNumber(100000e18);
  const ONE_MILLION = new BigNumber(1000000e18);
  const MAX_NUM = new BigNumber(1e50);

  //////////////////
  // Constructor //
  ////////////////
  /**
   * 1. Should not allow any value to be initialized incorrectly
   */
  describe('constructor', () => {
    it('Should not allow any value to be initialized incorrectly', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      try {
        await Governance.new(0, END_TIMESTAMP, NUM_OPTIONS, rad.address);
      } catch (e) {
        return true;
      }
      assert.fail('START_TIMESTAMP was not initialized correctly.');
      try {
        await Governance.new(START_TIMESTAMP, 0, NUM_OPTIONS, rad.address);
      } catch (e) {
        return true;
      }
      assert.fail('END_TIMESTAMP was not initialized correctly.');
      try {
        await Governance.new(START_TIMESTAMP, END_TIMESTAMP, 0, rad.address);
      } catch (e) {
        return true;
      }
      assert.fail('NUM_OPTIONS was not initialized correctly.');
      try {
        await Governance.new(START_TIMESTAMP, END_TIMESTAMP, NUM_OPTIONS, 0);
      } catch (e) {
        return true;
      }
      assert.fail('RAD address was not initialized correctly.');
    });
  });

  ///////////
  // vote //
  /////////
  /**
   * 1. Should throw if a user chooses a number that is not valid
   * 2. Should throw if the voting time has not yet begun
   * 3. Should throw if the contribution of a vote is greater than a user's holdings
   * 4. Should add to the total contribution of a user
   * 5. Should add to the total contribution of a user after multiple transactions
   * 6. Should add to the vote count of an option
   * 7. Should add to the vote count of an option after multiple transactions
   * 8. Should transfer tokens from the user to the contract
   * 9. Should throw if the voting time has ended
   */
  describe('vote', () => {
    it('Should throw if a user chooses a number that is not valid', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      //Fast Forward to after the sale
      await increaseTime(1);
      await mine();

      try {
        await governance.vote(5, ONE_VOTE);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should throw if the voting time has not yet begun', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP + 5,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      try {
        await governance.vote(ZERO, ONE_VOTE, {from: USER_0});
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it("Should throw if the contribution of a vote is greater than a user's holdings", async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      try {
        await governance.vote(NUM_OPTIONS, ONE_MILLION.plus(ONE), {from: USER_0});
      } catch (e) {
        return true;
      }
      assert.fail('NUM_OPTIONS was not initialized correctly.');
    });
    it('Should add to the total contribution of a user', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      await governance.vote(NUM_OPTIONS, ONE_MILLION, {from: USER_0});
      const totalContribution = await governance.userContribution(USER_0);
      assert.equal(
        ONE_MILLION.valueOf(),
        totalContribution.valueOf(),
        'Contribution did not get updated.',
      );
    });
    it('Should add to the total contribution of a user after multiple transactions', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      await governance.vote(NUM_OPTIONS, ONE, {from: USER_0});
      let totalContribution = await governance.userContribution(USER_0);
      assert.equal(ONE.valueOf(), totalContribution.valueOf(), 'Contribution did not get updated.');

      await governance.vote(NUM_OPTIONS, ONE_VOTE, {from: USER_0});
      totalContribution = await governance.userContribution(USER_0);
      assert.equal(
        ONE.plus(ONE_VOTE).valueOf(),
        totalContribution.valueOf(),
        'Contribution did not get updated.',
      );

      await governance.vote(NUM_OPTIONS, ONE_VOTE, {from: USER_0});
      totalContribution = await governance.userContribution(USER_0);
      assert.equal(
        ONE.plus(ONE_VOTE).plus(ONE_VOTE).valueOf(),
        totalContribution.valueOf(),
        'Contribution did not get updated.',
      );
    });
    it('Should add to the vote count of an option', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      await governance.vote(NUM_OPTIONS, ONE_MILLION, {from: USER_0});
      const totalWeight = await governance.optionVoteCount(NUM_OPTIONS);
      assert.equal(
        ONE_MILLION.valueOf(),
        totalWeight.valueOf(),
        'Contribution did not get updated.',
      );
    });
    it('Should add to the vote count of an option after multiple transactions', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      await governance.vote(NUM_OPTIONS, ONE, {from: USER_0});
      let totalWeight = await governance.optionVoteCount(NUM_OPTIONS);
      assert.equal(ONE.valueOf(), totalWeight.valueOf(), 'Contribution did not get updated.');

      await governance.vote(NUM_OPTIONS, ONE_VOTE, {from: USER_0});
      totalWeight = await governance.optionVoteCount(NUM_OPTIONS);
      assert.equal(
        ONE.plus(ONE_VOTE).valueOf(),
        totalWeight.valueOf(),
        'Contribution did not get updated.',
      );

      await governance.vote(NUM_OPTIONS, ONE_VOTE, {from: USER_0});
      totalWeight = await governance.optionVoteCount(NUM_OPTIONS);
      assert.equal(
        ONE.plus(ONE_VOTE).plus(ONE_VOTE).valueOf(),
        totalWeight.valueOf(),
        'Contribution did not get updated.',
      );
    });
    it('Should transfer tokens from the user to the contract', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      await governance.vote(NUM_OPTIONS, ONE_MILLION, {from: USER_0});
      const contractBalance = await rad.balanceOf(governance.address);
      assert.equal(
        ONE_MILLION.valueOf(),
        contractBalance.valueOf(),
        'Contribution did not get updated.',
      );
    });
    it('Should throw if the voting time has ended', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      //Fast Forward to after the sale
      await increaseTime(1000);
      await mine();

      try {
        await governance.vote(ZERO, ONE_VOTE, {from: USER_0});
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
  });

  ////////////////
  // returnRAD //
  //////////////
  /**
   * 1. Should throw if the voting is not yet over
   * 2. Should throw if a voter does not have anything to be refunded
   * 3. Should transfer a user's RAD back to them
   * 4. Should return a user's RAD count to 0 after a contribution
   */
  describe('returnRAD', () => {
    it('Should throw if the voting is not yet over', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      await governance.vote(NUM_OPTIONS, ONE_MILLION, {from: USER_0});
      try {
        await governance.returnRAD([USER_0]);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should throw if a voter does not have anything to be refunded', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      //Fast Forward to after the sale
      await increaseTime(1000);
      await mine();

      try {
        await governance.returnRAD([USER_0]);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it("Should transfer a user's RAD back to them", async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});
      await governance.vote(NUM_OPTIONS, ONE_MILLION, {from: USER_0});

      //Fast Forward to after the sale
      await increaseTime(1000);
      await mine();

      await governance.returnRAD([USER_0]);

      const userBalance = await rad.balanceOf(USER_0);
      assert.equal(userBalance.valueOf(), ONE_MILLION.valueOf(), 'User did not receive his funds.');
    });
    it("Should return a user's RAD count to 0 after a contribution", async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});
      await governance.vote(NUM_OPTIONS, ONE_MILLION, {from: USER_0});

      let totalContribution = await governance.userContribution(USER_0);
      assert.equal(
        totalContribution.valueOf(),
        ONE_MILLION.valueOf(),
        'User did not receive his funds.',
      );

      //Fast Forward to after the sale
      await increaseTime(1000);
      await mine();

      await governance.returnRAD([USER_0]);
      totalContribution = await governance.userContribution(USER_0);
      assert.equal(totalContribution.valueOf(), 0, 'User did not receive his funds.');
    });
  });

  ///////////////////////////
  // changeStartTimestamp //
  /////////////////////////
  /**
   * 1. Should throw if the newStartTime is initialized to 0
   * 2. Should throw if the newStartTime is earlier than the current time
   * 3. Should throw if the voting has already begun
   * 4. Should throw if the newStartTime is after the endTimestamp
   * 5. Should change the startTimestamp
   */
  describe('changeStartTimestamp', () => {
    it('Should throw if the newStartTime is initialized to 0', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      try {
        await governance.changeStartTimestamp(0);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should throw if the newStartTime is earlier than the current time', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      try {
        await governance.changeStartTimestamp(1);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should throw if the voting has already begun', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      //Fast Forward to after the sale
      await increaseTime(5);
      await mine();

      try {
        await governance.changeStartTimestamp(START_TIMESTAMP + 6);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should throw if the newStartTime is after the endTimestamp', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      try {
        await governance.changeStartTimestamp(END_TIMESTAMP + 6);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should change the startTimestamp', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP + 5,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});
      await governance.changeStartTimestamp(START_TIMESTAMP + 6);

      const newTime = await governance.startTimestamp.call();
      assert.equal(newTime.valueOf(), START_TIMESTAMP + 6, 'Start timestamp did not change.');
    });
  });

  /////////////////////////
  // changeEndTimestamp //
  ///////////////////////
  /**
   * 1. Should throw if the newEndTime is initialized to 0
   * 2. Should throw if the newEndTime is earlier than the current time
   * 3. Should throw if the voting is already over
   * 4. Should change the endTimestamp
   */
  describe('changeEndTimestamp', () => {
    it('Should throw if the newEndTime is initialized to 0', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      try {
        await governance.changeEndTimestamp(0);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should throw if the newEndTime is earlier than the current time', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      try {
        await governance.changeEndTimestamp(1);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should throw if the voting is already over', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      //Fast Forward to after the sale
      await increaseTime(500);
      await mine();

      try {
        await governance.changeEndTimestamp(START_TIMESTAMP + 600);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should change the endTimestamp', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP + 5,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});
      await governance.changeEndTimestamp(END_TIMESTAMP + 6);

      const newTime = await governance.endTimestamp.call();
      assert.equal(newTime.valueOf(), END_TIMESTAMP + 6, 'Start timestamp did not change.');
    });
  });

  ///////////////////////
  // changeNumOptions //
  /////////////////////
  /**
   * 1. Should throw if newNumOptions is initialized to 0
   * 2. Should throw if the voting has begun
   * 3. Should change the numOptions
   */
  describe('changeNumOptions', () => {
    it('Should throw if newNumOptions is initialized to 0', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      try {
        await governance.changeNumOptions(1);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should throw if the voting has begun', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});

      //Fast Forward to after the sale
      await increaseTime(5);
      await mine();

      try {
        await governance.changeNumOptions(1);
      } catch (e) {
        return true;
      }
      assert.fail('Did not choose a valid number.');
    });
    it('Should change the numOptions', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP + 5,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 8; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});
      await governance.changeNumOptions(5);

      const newNum = await governance.numOptions.call();
      assert.equal(newNum.valueOf(), 5, 'Start timestamp did not change.');
    });
  });

  ///////////////
  // fullTest //
  /////////////
  /**
   * 1. Executes a full vote with 3 choices and 5 users voting. Choice 0 wins
   */
  describe('fullTest', () => {
    it('Executes a full vote with 3 choices and 5 users voting. Choice 0 wins', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      for (let i = 0; i < 5; i++) {
        await rad.transfer(accounts[i], ONE_MILLION.valueOf(), {from: CC_ADDRESS});
      }
      await rad.approve(governance.address, MAX_NUM, {from: USER_0});
      await rad.approve(governance.address, MAX_NUM, {from: USER_1});
      await rad.approve(governance.address, MAX_NUM, {from: USER_2});
      await rad.approve(governance.address, MAX_NUM, {from: USER_3});
      await rad.approve(governance.address, MAX_NUM, {from: USER_4});

      await governance.vote(ZERO.valueOf(), ONE_MILLION, {from: USER_0});
      await governance.vote(ZERO.valueOf(), HUNDRED_THOUSAND, {from: USER_1});
      await governance.vote(ONE.valueOf(), TEN_THOUSAND, {from: USER_2});
      await governance.vote(ONE.valueOf(), ONE_THOUSAND, {from: USER_3});
      await governance.vote(TWO.valueOf(), ONE_VOTE, {from: USER_4});

      //Fast Forward to after the sale
      await increaseTime(1000);
      await mine();

      let voteWeight = await governance.optionVoteCount(ZERO);
      assert.equal(
        ONE_MILLION.plus(HUNDRED_THOUSAND),
        voteWeight.valueOf(),
        'Vote count did not get updated.',
      );

      voteWeight = await governance.optionVoteCount(ONE);
      assert.equal(
        TEN_THOUSAND.plus(ONE_THOUSAND),
        voteWeight.valueOf(),
        'Vote count did not get updated.',
      );

      voteWeight = await governance.optionVoteCount(TWO);
      assert.equal(ONE_VOTE.valueOf(), voteWeight.valueOf(), 'Vote count did not get updated.');

      await governance.returnRAD([USER_0, USER_1, USER_2, USER_3, USER_4]);

      // Each user should now have their original total of 1M tokens in their address
      let balanceOfUser = await rad.balanceOf(USER_0);
      assert.equal(
        balanceOfUser.valueOf(),
        ONE_MILLION.valueOf(),
        'User did not get his RAD back.',
      );

      balanceOfUser = await rad.balanceOf(USER_1);
      assert.equal(
        balanceOfUser.valueOf(),
        ONE_MILLION.valueOf(),
        'User did not get his RAD back.',
      );

      balanceOfUser = await rad.balanceOf(USER_2);
      assert.equal(
        balanceOfUser.valueOf(),
        ONE_MILLION.valueOf(),
        'User did not get his RAD back.',
      );

      balanceOfUser = await rad.balanceOf(USER_3);
      assert.equal(
        balanceOfUser.valueOf(),
        ONE_MILLION.valueOf(),
        'User did not get his RAD back.',
      );

      balanceOfUser = await rad.balanceOf(USER_4);
      assert.equal(
        balanceOfUser.valueOf(),
        ONE_MILLION.valueOf(),
        'User did not get his RAD back.',
      );
    });
  });

  ////////////////
  // modifiers //
  //////////////
  /**
   * 1. Should only be callable by the owner of the contract
   */
  describe('modifiers', () => {
    it('Should only be callable by the owner of the contract', async () => {
      const rad = await RAD.new(CC_ADDRESS, COMMUNITY_ADDRESS);
      const governance = await Governance.new(
        START_TIMESTAMP,
        END_TIMESTAMP,
        NUM_OPTIONS,
        rad.address,
      );
      try {
        await governance.changeStartTimestamp(now + 10, {from: USER_1});
      } catch (e) {
        return true;
      }
      assert.fail('Function executed when it should not have.');
    });
  });
});
