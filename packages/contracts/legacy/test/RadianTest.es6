var RAD = artifacts.require('./RAD.sol');
var Token = artifacts.require('./TestToken.sol');
var Whitelist = artifacts.require('./Whitelist.sol');
var Radian = artifacts.require('./Radian.sol');
const BigNumber = require('bignumber.js');

contract('Radian', function (accounts) {
  const CC_SUPPLY = accounts[0];
  const COMMUNITY_SUPPLY = accounts[1];
  const COLLECTOR_ADDRESS = accounts[2];
  const USER_0 = accounts[3];
  const USER_1 = accounts[4];
  const USER_2 = accounts[5];
  const USER_3 = accounts[6];
  const THROWAWAY = accounts[9];

  const CC_ALLOCATION = new BigNumber(750e24);
  const COMMUNITY_ALLOCATION = new BigNumber(250e24);

  const ONE_MILLION = new BigNumber(1e24);
  const STANDARD_TOKEN_COUNT_1B = new BigNumber(1e27); // 1 billion tokens in Radian

  const MAX_NUM = new BigNumber(1e50);

  //////////////////
  // Constructor //
  ////////////////
  /**
   * 1. Should not allow any address to be initialized incorrectly
   */
  describe('constructor', () => {
    it('Should not allow any address to be initialized incorrectly', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      try {
        await Radian.new(0x0, whitelist.address, COLLECTOR_ADDRESS);
      } catch (e) {
        return true;
      }
      assert.fail('RAD address was not initialized correctly.');
      try {
        await Radian.new(rad.address, 0x0, COLLECTOR_ADDRESS);
      } catch (e) {
        return true;
      }
      assert.fail('Whitelist address was not initialized correctly.');
      try {
        await Radian.new(rad.address, whitelist.address, 0x0);
      } catch (e) {
        return true;
      }
      assert.fail('Collector address was not initialized correctly.');
    });
  });

  ///////////////////
  // liquidateRAD //
  /////////////////
  /**
   * 1. Should send a token to the liquidator
   * 2. Should burn the liquidator's RAD
   * 3. Should execute a number of transfers equal to that of the amount of token addresses passed in
   * 4. Should function the same way even after more tokens have been added to Radian
   * 5. Should not release a token if it is not included in the token array
   * 6. Should give a user the same amount of each type of token
   * 7. Should finish the distribution with all of the tokens, adding a new token each time
   */
  describe('liquidateRAD', () => {
    it('Should return the RAD balance of the liquidator', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      const token = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      await whitelist.setVerified(CC_SUPPLY, true);

      const liquidationAmount = new BigNumber(1e18);
      const redemptionAmount = new BigNumber(1e18);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], liquidationAmount.valueOf());
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(
        newOnwerBalance.valueOf(),
        redemptionAmount.valueOf(),
        'Not all tokens got transferred',
      );
    });
    it("Should burn the liquidator's RAD ", async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      const token = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      await whitelist.setVerified(CC_SUPPLY, true);

      const liquidationAmount = new BigNumber(1e18);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], liquidationAmount.valueOf());

      const totalSupply = await rad.totalSupply();
      assert.equal(
        STANDARD_TOKEN_COUNT_1B.sub(liquidationAmount).valueOf(),
        totalSupply.valueOf(),
        'Not all tokens got transferred',
      );
    });
    it('Should execute a number of transfers equal to that of the amount of token addresses passed in', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      const token0 = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      const token1 = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      const token2 = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      await whitelist.setVerified(CC_SUPPLY, true);

      const liquidationAmount = new BigNumber(1e18);
      const redemptionAmount = new BigNumber(1e18);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD(
        [token0.address, token1.address, token2.address],
        liquidationAmount.valueOf(),
      );
      const newOnwerBalance0 = await token0.balanceOf(CC_SUPPLY);
      const newOnwerBalance1 = await token1.balanceOf(CC_SUPPLY);
      const newOnwerBalance2 = await token2.balanceOf(CC_SUPPLY);

      assert.equal(
        newOnwerBalance0.valueOf(),
        redemptionAmount.valueOf(),
        'Not all tokens got transferred',
      );
      assert.equal(
        newOnwerBalance1.valueOf(),
        redemptionAmount.valueOf(),
        'Not all tokens got transferred',
      );
      assert.equal(
        newOnwerBalance2.valueOf(),
        redemptionAmount.valueOf(),
        'Not all tokens got transferred',
      );
    });
    it('Should function the same way even after more tokens have been added to Radian', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      const token = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      await whitelist.setVerified(CC_SUPPLY, true);

      const liquidationAmount = new BigNumber(250000000e18);
      const redemptionAmount = new BigNumber(250000000e18);
      const redemptionAmountTwo = new BigNumber(3.333333333e26);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], liquidationAmount.valueOf());
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(
        newOnwerBalance.valueOf(),
        redemptionAmount.valueOf(),
        'Not all tokens got transferred',
      );

      const tokenTwo = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);

      await radian.liquidateRAD([token.address, tokenTwo.address], liquidationAmount.valueOf());
      const newOnwerBalanceOne = await token.balanceOf(CC_SUPPLY);
      const newOnwerBalanceTwo = await tokenTwo.balanceOf(CC_SUPPLY);

      assert.equal(
        newOnwerBalanceOne.valueOf(),
        redemptionAmount.mul(2).valueOf(),
        'Not all tokens got transferred',
      );
      assert.equal(
        newOnwerBalanceTwo.toPrecision(10),
        redemptionAmountTwo.valueOf(),
        'Not all tokens got transferred',
      );
    });
    it('Should not release a token if it is not included in the token array', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      const token = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      await whitelist.setVerified(CC_SUPPLY, true);
      const tokenTwo = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);

      const liquidationAmount = new BigNumber(1e18);
      const redemptionAmount = new BigNumber(1e18);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], liquidationAmount.valueOf());

      const newOnwerBalanceOne = await token.balanceOf(CC_SUPPLY);
      const newOnwerBalanceTwo = await tokenTwo.balanceOf(CC_SUPPLY);

      assert.equal(
        newOnwerBalanceOne.valueOf(),
        redemptionAmount.valueOf(),
        'Not all tokens got transferred',
      );
      assert.equal(newOnwerBalanceTwo.valueOf(), 0, 'Not all tokens got transferred');
    });
    it('Should give a user the same amount of each type of token', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(CC_SUPPLY, true);

      const liquidationAmount = new BigNumber(1e18);
      const redemptionAmount = new BigNumber(1e18);

      var token = [];
      for (var i = 0; i < 10; i++) {
        token[i] = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      }
      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD(
        [
          token[0].address,
          token[1].address,
          token[2].address,
          token[3].address,
          token[4].address,
          token[5].address,
          token[6].address,
          token[7].address,
          token[8].address,
          token[9].address,
        ],
        liquidationAmount.valueOf(),
      );

      var newBalance = [];
      for (var j = 0; j < 10; j++) {
        newBalance[j] = await token[j].balanceOf(CC_SUPPLY);
        assert.equal(
          newBalance[j].valueOf(),
          redemptionAmount.valueOf(),
          'Not all tokens got transferred',
        );
      }
    });
    it('Should finish the distribution with all of the tokens, adding a new token each time', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(USER_0, true);
      await whitelist.setVerified(USER_1, true);
      await whitelist.setVerified(USER_2, true);
      await whitelist.setVerified(USER_3, true);

      // Define amounts
      const liquidationAmount = [
        new BigNumber(1e18),
        new BigNumber(2.5e26),
        new BigNumber(123456000e18),
        new BigNumber(626543999e18),
      ];
      const redemptionAmount = [
        new BigNumber(1e18),
        new BigNumber(2.5e26),
        new BigNumber(2.5000000025e26),
        new BigNumber(123456000e18),
        new BigNumber(123456000.123e18),
        new BigNumber(164608000.219e18),
        new BigNumber(626543999e18),
        new BigNumber(626543999.626e18),
        new BigNumber(835391999.78e18),
        new BigNumber(1e27),
      ];
      let ownerBalance;

      // Transfer Users Tokens
      await rad.transfer(USER_0, liquidationAmount[0].valueOf(), {from: CC_SUPPLY});
      await rad.transfer(USER_1, liquidationAmount[1].valueOf(), {from: COMMUNITY_SUPPLY});
      await rad.transfer(USER_2, liquidationAmount[2].valueOf(), {from: CC_SUPPLY});
      await rad.transfer(USER_3, liquidationAmount[3].valueOf(), {from: CC_SUPPLY});

      // Approve users
      await rad.approve(radian.address, MAX_NUM, {from: USER_0});
      await rad.approve(radian.address, MAX_NUM, {from: USER_1});
      await rad.approve(radian.address, MAX_NUM, {from: USER_2});
      await rad.approve(radian.address, MAX_NUM, {from: USER_3});

      // Redeem
      const tokenOne = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      await radian.liquidateRAD([tokenOne.address], liquidationAmount[0].valueOf(), {from: USER_0});
      ownerBalance = await tokenOne.balanceOf(USER_0);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[0].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenOne.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_0});

      const tokenTwo = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      await radian.liquidateRAD(
        [tokenOne.address, tokenTwo.address],
        liquidationAmount[1].valueOf(),
        {from: USER_1},
      );
      ownerBalance = await tokenOne.balanceOf(USER_1);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[1].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenOne.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_1});
      ownerBalance = await tokenTwo.balanceOf(USER_1);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[2].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenTwo.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_1});

      const tokenThree = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      await radian.liquidateRAD(
        [tokenOne.address, tokenTwo.address, tokenThree.address],
        liquidationAmount[2].valueOf(),
        {from: USER_2},
      );
      ownerBalance = await tokenOne.balanceOf(USER_2);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[3].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenOne.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_2});
      ownerBalance = await tokenTwo.balanceOf(USER_2);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[4].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenTwo.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_2});
      ownerBalance = await tokenThree.balanceOf(USER_2);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[5].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenThree.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_2});

      const tokenFour = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);
      await radian.liquidateRAD(
        [tokenOne.address, tokenTwo.address, tokenThree.address, tokenFour.address],
        liquidationAmount[3].valueOf(),
        {from: USER_3},
      );
      ownerBalance = await tokenOne.balanceOf(USER_3);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[6].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenOne.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_3});
      ownerBalance = await tokenTwo.balanceOf(USER_3);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[7].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenTwo.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_3});
      ownerBalance = await tokenThree.balanceOf(USER_3);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[8].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenThree.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_3});
      ownerBalance = await tokenFour.balanceOf(USER_3);
      assert.equal(
        ownerBalance.toPrecision(12),
        redemptionAmount[9].toPrecision(12),
        'Not all tokens got transferred',
      );
      await tokenFour.transfer(THROWAWAY, ownerBalance.valueOf(), {from: USER_3});
    });
  });

  ///////////////////////////
  // calculateTokenAmount //
  /////////////////////////
  /**
   * 1. Should return the following outputs based on the following inputs:
   *
   * Case 1 - Normal Liquidation:
   * RAD Total Supply = 1,000,000,000e18
   * Amount Contributed = 1e18
   * Num Tokens in Radian = 50,000,000e18
   *
   * Output = 5e16
   *
   * Case 2 - Tiny Liquidation:
   * RAD Total Supply = 1,000,000,000e18
   * Amount Contributed = 1
   * Num Tokens in Radian = 50,000,000e18
   *
   * Output = 0
   *
   * Case 3 - Large Liquidation:
   * RAD Total Supply = 1,000,000,000e18
   * Amount Contributed = 1,000,000e18
   * Num Tokens in Radian = 50,000,000e18
   *
   * Output = 50,000e18
   *
   * Case 4 - Normal Liquidation with Variance:
   * RAD Total Supply = 1,000,000,000e18
   * Amount Contributed = 1.3e18
   * Num Tokens in Radian = 50,000,000e18
   *
   * Output = 0.065e18
   *
   * Case 5 - Normal Liquidation with Low Token Count:
   * RAD Total Supply = 1,000,000,000e18
   * Amount Contributed = 1e18
   * Num Tokens in Radian = 1e18
   *
   * Output = 1e9
   *
   * Case 6 - Normal Liquidation with Normal Token Count and Low RAD:
   * RAD Total Supply = 1,000,000e18
   * Amount Contributed = 1e18
   * Num Tokens in Radian = 50,000,000e18
   *
   * Output = 50e18
   *
   * Case 7 - Tiny Liquidation with Return:
   * RAD Total Supply = 1,000,000,000e18
   * Amount Contributed = 100
   * Num Tokens in Radian = 50,000,000e18
   *
   * Output = 5
   */
  describe('calculateTokenAmount', () => {
    it('Case 1', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(CC_SUPPLY, true);

      const amountContributed = new BigNumber(1e18);
      const numTokensInRadian = new BigNumber(5e25);
      const output = new BigNumber(5e16);

      const token = await Token.new(radian.address, numTokensInRadian);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], amountContributed.valueOf());
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(newOnwerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
    });
    it('Case 2', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(CC_SUPPLY, true);

      const amountContributed = new BigNumber(1);
      const numTokensInRadian = new BigNumber(5e25);
      const output = new BigNumber(0);

      const token = await Token.new(radian.address, numTokensInRadian);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], amountContributed.valueOf());
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(newOnwerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
    });
    it('Case 3', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(CC_SUPPLY, true);

      const amountContributed = new BigNumber(1e24);
      const numTokensInRadian = new BigNumber(5e25);
      const output = new BigNumber(5e22);

      const token = await Token.new(radian.address, numTokensInRadian);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], amountContributed.valueOf());
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(newOnwerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
    });
    it('Case 4', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(CC_SUPPLY, true);

      const amountContributed = new BigNumber(1.3e18);
      const numTokensInRadian = new BigNumber(5e25);
      const output = new BigNumber(6.5e16);

      const token = await Token.new(radian.address, numTokensInRadian);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], amountContributed.valueOf());
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(newOnwerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
    });
    it('Case 5', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(CC_SUPPLY, true);

      const amountContributed = new BigNumber(1e18);
      const numTokensInRadian = new BigNumber(1e18);
      const output = new BigNumber(1e9);

      const token = await Token.new(radian.address, numTokensInRadian);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], amountContributed.valueOf());
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(newOnwerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
    });
    it('Case 6', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(CC_SUPPLY, true);

      // Burn 999 Million Tokens
      await rad.burn(COMMUNITY_ALLOCATION.valueOf(), {from: COMMUNITY_SUPPLY});
      await rad.burn(CC_ALLOCATION.sub(ONE_MILLION), {from: CC_SUPPLY});

      const amountContributed = new BigNumber(1e18);
      const numTokensInRadian = new BigNumber(5e25);
      const output = new BigNumber(5e19);

      const token = await Token.new(radian.address, numTokensInRadian);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], amountContributed.valueOf());
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(newOnwerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
    });
    it('Case 7', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(CC_SUPPLY, true);

      const amountContributed = new BigNumber(100);
      const numTokensInRadian = new BigNumber(5e25);
      const output = new BigNumber(5);

      const token = await Token.new(radian.address, numTokensInRadian);

      await rad.approve(radian.address, MAX_NUM);
      await radian.liquidateRAD([token.address], amountContributed.valueOf());
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(newOnwerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
    });
  });

  //////////////////
  // removeToken //
  ////////////////
  /**
   * 1. Should require the amount being withdrawn to be less than or equal to the amount that lives in the smart Contract
   * 2. Should send tokens to the owner and return the remainder to the owner
   */
  describe('removeToken', () => {
    it('Should require the amount being withdrawn to be less than or equal to the amount that lives in the smart Contract', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      const token = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);

      try {
        await radian.removeToken(token.address, STANDARD_TOKEN_COUNT_1B.add(1));
      } catch (e) {
        return true;
      }
      assert.fail('Collector address was not initialized correctly.');
    });
    it('Should send tokens to the owner and return the remainder to the owner', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      const token = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);

      const oldContractBalance = await token.balanceOf(radian.address);
      const oldOwnerBalance = await token.balanceOf(CC_SUPPLY);

      await radian.removeToken(token.address, STANDARD_TOKEN_COUNT_1B);

      const newContractBalance = await token.balanceOf(radian.address);
      const newOnwerBalance = await token.balanceOf(CC_SUPPLY);

      assert.equal(
        oldContractBalance.valueOf(),
        STANDARD_TOKEN_COUNT_1B.valueOf(),
        'Radian contract did not get the correct tokens initially',
      );
      assert.equal(oldOwnerBalance.valueOf(), 0, 'Owner had tokens');
      assert.equal(newContractBalance.valueOf(), 0, 'Not all tokens got transferred');
      assert.equal(
        newOnwerBalance.valueOf(),
        STANDARD_TOKEN_COUNT_1B.valueOf(),
        'Tokens did not transfer correctly',
      );
    });
  });

  //////////////////////////////////////
  // Multiple Transactions Test Case //
  ////////////////////////////////////
  /**
   * 1. Should return the following based on the following data:
   *
   * User 1:
   * Transaction 1:
   * RAD Total Supply = 1,000,000,000e18
   * Amount Contributed = 1e18
   * Num Tokens in Radian = 50,000,000e18
   *
   * Output = 5e16
   *
   * Transaction 2:
   * RAD Total Supply = 999,999,999e18
   * Amount Contributed = 100e18
   * Num Tokens in Radian = 49,999,999.95e18
   *
   * Output = 5e18
   *
   * Transaction 3:
   * RAD Total Supply = 999,999,899e18
   * Amount Contributed = 50e18
   * Num Tokens in Radian = 49,999,994.95e18
   *
   * Output = 2.5e18
   *
   * Transaction 4:
   * RAD Total Supply = 999,999,849e18
   * Amount Contributed = 500,000,000e18
   * Num Tokens in Radian = 49,999,992.45e18
   *
   * Output = 25,000,000e18
   *
   * Transaction 5:
   * RAD Total Supply = 499,999,849e18
   * Amount Contributed = 1e18
   * Num Tokens in Radian = 24,999,992.45e18
   *
   * Output = 0.05e9
   *
   * User 2:
   * Transaction 1:
   * RAD Total Supply = 499,999,848e18
   * Amount Contributed = 1e18
   * Num Tokens in Radian = 24,999,992.40e18
   *
   * Output = 0.05e18
   *
   * Transaction 2:
   * RAD Total Supply = 499,999,847e18
   * Amount Contributed = 250,000e18
   * Num Tokens in Radian = 24,999,992.35e18
   *
   * Output = 12,500e18
   *
   * Transaction 3:
   * RAD Total Supply = 499,749,847e18
   * Amount Contributed = 400,000,000e18
   * Num Tokens in Radian = 24,987,492.35e18
   *
   * Output = 20,000,000e18
   *
   * Transaction 4:
   * RAD Total Supply = 99,749,847e18
   * Amount Contributed = 10,000,000e18
   * Num Tokens in Radian = 4,987,492.35e18
   *
   * Output = 500,000e18
   *
   * Transaction 5:
   * RAD Total Supply = 89,749,847e18
   * Amount Contributed = 89,749,847e18
   * Num Tokens in Radian = 4,487,492.35e18
   *
   * Output = 4,487,492.35e18
   */
  describe('Multiple Transactions', () => {
    it('Multiple Transactions', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      await whitelist.setVerified(CC_SUPPLY, true);
      await whitelist.setVerified(COMMUNITY_SUPPLY, true);
      const COMMUNITY_ALLOCATION_REQUIRED = new BigNumber(249999848e18);
      await rad.transfer(COMMUNITY_SUPPLY, COMMUNITY_ALLOCATION_REQUIRED, {from: CC_SUPPLY});

      const numTokensInRadian = new BigNumber(50000000e18);
      const token = await Token.new(radian.address, numTokensInRadian);

      let amountContributed = new BigNumber(1e18);
      let output = new BigNumber(5e16);

      await rad.approve(radian.address, MAX_NUM, {from: CC_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {from: CC_SUPPLY});
      let newOwnerBalance = await token.balanceOf(CC_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: CC_SUPPLY});

      amountContributed = new BigNumber(100e18);
      output = new BigNumber(5e18);

      await rad.approve(radian.address, MAX_NUM, {from: CC_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {from: CC_SUPPLY});
      newOwnerBalance = await token.balanceOf(CC_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: CC_SUPPLY});

      amountContributed = new BigNumber(50e18);
      output = new BigNumber(2.5e18);

      await rad.approve(radian.address, MAX_NUM, {from: CC_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {from: CC_SUPPLY});
      newOwnerBalance = await token.balanceOf(CC_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: CC_SUPPLY});

      amountContributed = new BigNumber(500000000e18);
      output = new BigNumber(25000000e18);

      await rad.approve(radian.address, MAX_NUM, {from: CC_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {from: CC_SUPPLY});
      newOwnerBalance = await token.balanceOf(CC_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: CC_SUPPLY});

      amountContributed = new BigNumber(1e18);
      output = new BigNumber(0.05e18);

      await rad.approve(radian.address, MAX_NUM, {from: CC_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {from: CC_SUPPLY});
      newOwnerBalance = await token.balanceOf(CC_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: CC_SUPPLY});

      amountContributed = new BigNumber(1e18);
      output = new BigNumber(0.05e18);

      await rad.approve(radian.address, MAX_NUM, {from: COMMUNITY_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {
        from: COMMUNITY_SUPPLY,
      });
      newOwnerBalance = await token.balanceOf(COMMUNITY_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: COMMUNITY_SUPPLY});

      amountContributed = new BigNumber(250000e18);
      output = new BigNumber(12500e18);

      await rad.approve(radian.address, MAX_NUM, {from: COMMUNITY_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {
        from: COMMUNITY_SUPPLY,
      });

      newOwnerBalance = await token.balanceOf(COMMUNITY_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: COMMUNITY_SUPPLY});

      amountContributed = new BigNumber(400000000e18);
      output = new BigNumber(20000000e18);

      await rad.approve(radian.address, MAX_NUM, {from: COMMUNITY_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {
        from: COMMUNITY_SUPPLY,
      });
      newOwnerBalance = await token.balanceOf(COMMUNITY_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: COMMUNITY_SUPPLY});

      amountContributed = new BigNumber(10000000e18);
      output = new BigNumber(500000e18);

      await rad.approve(radian.address, MAX_NUM, {from: COMMUNITY_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {
        from: COMMUNITY_SUPPLY,
      });
      newOwnerBalance = await token.balanceOf(COMMUNITY_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: COMMUNITY_SUPPLY});

      amountContributed = new BigNumber(89749847e18);
      output = new BigNumber(4487492.35e18);

      await rad.approve(radian.address, MAX_NUM, {from: COMMUNITY_SUPPLY});
      await radian.liquidateRAD([token.address], amountContributed.valueOf(), {
        from: COMMUNITY_SUPPLY,
      });
      newOwnerBalance = await token.balanceOf(COMMUNITY_SUPPLY);
      assert.equal(newOwnerBalance.valueOf(), output.valueOf(), 'Token calculation incorrect');
      await token.transfer(THROWAWAY, newOwnerBalance.valueOf(), {from: COMMUNITY_SUPPLY});
    });
  });

  ////////////////
  // modifiers //
  //////////////
  /**
   * 1. Should only allow the function to run if the user has been verified
   * 2. Should only be callable by the owner of the contract
   */
  describe('modifiers', () => {
    it('Should only allow the function to run if the user has been verified', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      const token = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);

      const liquidationAmount = new BigNumber(1e18);

      await rad.approve(radian.address, MAX_NUM);
      try {
        await radian.liquidateRAD([token.address], liquidationAmount.valueOf());
      } catch (e) {
        return true;
      }
      assert.fail('Function executed when it should not have.');
    });
    it('Should only be callable by the owner of the contract', async () => {
      const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
      const whitelist = await Whitelist.new();
      const radian = await Radian.new(rad.address, whitelist.address, COLLECTOR_ADDRESS);
      const token = await Token.new(radian.address, STANDARD_TOKEN_COUNT_1B);

      try {
        await radian.removeToken(token.address, STANDARD_TOKEN_COUNT_1B, {from: USER_0});
      } catch (e) {
        return true;
      }
      assert.fail('Function executed when it should not have.');
    });
  });
});
