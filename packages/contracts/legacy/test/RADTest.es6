var RAD = artifacts.require("./RAD.sol");

contract('RAD', function(accounts) {

    const CC_SUPPLY = accounts[0];
    const COMMUNITY_SUPPLY = accounts[1];

    describe("initialization", () => {
        it("Should throw if either address is initalized incorrectly", async () => {
            try {
                await rad.new(CC_SUPPLY, 0x0);
            } catch (e) {
                return true;
            }
            assert.fail("The function executed when it should not have.");

            try {
                await rad.new(0x0, COMMUNITY_SUPPLY);
            } catch (e) {
                return true;
            }
            assert.fail("The function executed when it should not have.");
        });
        it("Should send CC 750M RAD", async () => {
            const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
            const myBal = await rad.balanceOf(CC_SUPPLY);
            assert.equal(myBal.valueOf(), 750 * (10**6) * 10**18, "750M RAD did not get initialized to CC")
        });
        it("Should send Community 250M RAD", async () => {
            const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
            const myBal = await rad.balanceOf(COMMUNITY_SUPPLY);
            assert.equal(myBal.valueOf(), 250 * (10**6) * 10**18, "250M RAD did not get initialized to the community")
        });
        it("Should create 1 Billion total tokens", async () => {
            const rad = await RAD.new(CC_SUPPLY, COMMUNITY_SUPPLY);
            const total_bal = await rad.totalSupply.call();
            assert.equal(total_bal.valueOf(), 1000 * (10**6) * 10**18, "Did not create 1 billion tokens")
        });
    });
});