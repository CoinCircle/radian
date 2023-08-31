var Whitelist = artifacts.require("./Whitelist.sol");

contract('Whitelist', function(accounts) {

    const ACCOUNT_0 = accounts[0];
    const ACCOUNT_1 = accounts[1];
    const ACCOUNT_2 = accounts[2];
    const ACCOUNT_3 = accounts[3];

    describe("setVerified", () => {
        it("Should set an account to verified status", async () => {
            const whitelist = await Whitelist.new();
            await whitelist.setVerified(ACCOUNT_0, true);
            const verificationStatus = await whitelist.isVerifiedByAddress(ACCOUNT_0);
            assert.equal(verificationStatus, true, "User did not get verified correctly");
        });
    });
    describe("setVerifiedMultiple", () => {
        it("Should set multiple accounts to verified status", async () => {
            const whitelist = await Whitelist.new();
            await whitelist.setVerifiedMultiple([ACCOUNT_0, ACCOUNT_1, ACCOUNT_2], true);
            const verificationStatus0 = await whitelist.isVerifiedByAddress(ACCOUNT_0);
            const verificationStatus1 = await whitelist.isVerifiedByAddress(ACCOUNT_1);
            const verificationStatus2 = await whitelist.isVerifiedByAddress(ACCOUNT_2);
            assert.equal(verificationStatus0, true, "User did not get verified correctly");
            assert.equal(verificationStatus1, true, "User did not get verified correctly");
            assert.equal(verificationStatus2, true, "User did not get verified correctly");
        });
    });
    describe("setAccredited", () => {
        it("Should set an account to accredited status", async () => {
            const whitelist = await Whitelist.new();
            await whitelist.setAccredited(ACCOUNT_0, true);
            const accreditationStatus = await whitelist.isAccreditedByAddress(ACCOUNT_0);
            assert.equal(accreditationStatus, true, "User did not get accredited correctly");
        });
    });
    describe("setAccreditedMultiple", () => {
        it("Should set multiple accounts to accredited status", async () => {
            const whitelist = await Whitelist.new();
            await whitelist.setAccreditedMultiple([ACCOUNT_0, ACCOUNT_1, ACCOUNT_2], true);
            const accreditationStatus0 = await whitelist.isAccreditedByAddress(ACCOUNT_0);
            const accreditationStatus1 = await whitelist.isAccreditedByAddress(ACCOUNT_1);
            const accreditationStatus2 = await whitelist.isAccreditedByAddress(ACCOUNT_2);
            assert.equal(accreditationStatus0, true, "User did not get accredited correctly");
            assert.equal(accreditationStatus1, true, "User did not get accredited correctly");
            assert.equal(accreditationStatus2, true, "User did not get accredited correctly");
        });
    });
    describe("setVerifiedAndAccredited", () => {
        it("Should set an account to verified and accredited status", async () => {
            const whitelist = await Whitelist.new();
            await whitelist.setVerifiedAndAccredited(ACCOUNT_0, true);
            const verificationStatus = await whitelist.isVerifiedByAddress(ACCOUNT_0);
            const accreditationStatus = await whitelist.isAccreditedByAddress(ACCOUNT_0);
            assert.equal(verificationStatus, true, "User did not get verified correctly");
            assert.equal(accreditationStatus, true, "User did not get accredited correctly");
        });
    });
    describe("setVerifiedAndAccreditedMultiple", () => {
        it("Should set multiple accounts to verified and accredited status", async () => {
            const whitelist = await Whitelist.new();
            await whitelist.setVerifiedAndAccreditedMultiple([ACCOUNT_0, ACCOUNT_1, ACCOUNT_2], true);
            const verificationStatus0 = await whitelist.isVerifiedByAddress(ACCOUNT_0);
            const verificationStatus1 = await whitelist.isVerifiedByAddress(ACCOUNT_1);
            const verificationStatus2 = await whitelist.isVerifiedByAddress(ACCOUNT_2);
            const accreditationStatus0 = await whitelist.isAccreditedByAddress(ACCOUNT_0);
            const accreditationStatus1 = await whitelist.isAccreditedByAddress(ACCOUNT_1);
            const accreditationStatus2 = await whitelist.isAccreditedByAddress(ACCOUNT_2);
            assert.equal(verificationStatus0, true, "User did not get verified correctly");
            assert.equal(verificationStatus1, true, "User did not get verified correctly");
            assert.equal(verificationStatus2, true, "User did not get verified correctly");
            assert.equal(accreditationStatus0, true, "User did not get accredited correctly");
            assert.equal(accreditationStatus1, true, "User did not get accredited correctly");
            assert.equal(accreditationStatus2, true, "User did not get accredited correctly");
        });
    });
    describe("swapAddress", () => {
        it("Should swap the verification and accreditation status of an old user with that of a new user", async () => {
            const whitelist = await Whitelist.new();
            await whitelist.setVerifiedAndAccredited(ACCOUNT_0, true);
            await whitelist.swapAddress(ACCOUNT_0, ACCOUNT_1);
            const verificationStatus0 = await whitelist.isVerifiedByAddress(ACCOUNT_0);
            const accreditationStatus0 = await whitelist.isAccreditedByAddress(ACCOUNT_0);
            const verificationStatus1 = await whitelist.isVerifiedByAddress(ACCOUNT_1);
            const accreditationStatus1 = await whitelist.isAccreditedByAddress(ACCOUNT_1);
            assert.equal(verificationStatus0, false, "User verification did not get swapped");
            assert.equal(accreditationStatus0, false, "User accreditation did not get swapped");
            assert.equal(verificationStatus1, true, "User verification did not get swapped");
            assert.equal(accreditationStatus1, true, "User accreditation did not get swapped");
        });
    });
    describe("swapAddresses", () => {
        it("Should swap the verification and accreditation statuses of old users with that of new users", async () => {
            const whitelist = await Whitelist.new();
            await whitelist.setVerifiedAndAccreditedMultiple([ACCOUNT_0, ACCOUNT_2], true);
            await whitelist.swapAddresses([ACCOUNT_0, ACCOUNT_2], [ACCOUNT_1, ACCOUNT_3]);
            const verificationStatus0 = await whitelist.isVerifiedByAddress(ACCOUNT_0);
            const accreditationStatus0 = await whitelist.isAccreditedByAddress(ACCOUNT_0);
            const verificationStatus1 = await whitelist.isVerifiedByAddress(ACCOUNT_1);
            const accreditationStatus1 = await whitelist.isAccreditedByAddress(ACCOUNT_1);
            const verificationStatus2 = await whitelist.isVerifiedByAddress(ACCOUNT_2);
            const accreditationStatus2 = await whitelist.isAccreditedByAddress(ACCOUNT_2);
            const verificationStatus3 = await whitelist.isVerifiedByAddress(ACCOUNT_3);
            const accreditationStatus3 = await whitelist.isAccreditedByAddress(ACCOUNT_3);
            assert.equal(verificationStatus0, false, "User verification did not get swapped");
            assert.equal(accreditationStatus0, false, "User accreditation did not get swapped");
            assert.equal(verificationStatus1, true, "User verification did not get swapped");
            assert.equal(accreditationStatus1, true, "User accreditation did not get swapped");
            assert.equal(verificationStatus2, false, "User verification did not get swapped");
            assert.equal(accreditationStatus2, false, "User accreditation did not get swapped");
            assert.equal(verificationStatus3, true, "User verification did not get swapped");
            assert.equal(accreditationStatus3, true, "User accreditation did not get swapped");
        });
        it("Should swap the verification and accreditation statuses of old users with that of new users", async () => {
            const whitelist = await Whitelist.new();
            await whitelist.setVerifiedAndAccreditedMultiple([ACCOUNT_0, ACCOUNT_2], true);
            try {
                await whitelist.swapAddresses([ACCOUNT_0, ACCOUNT_2], [ACCOUNT_1]);
            } catch (e) {
                return true;
            }
            assert.fail("The function executed when it should not have.");
        });
    });
});