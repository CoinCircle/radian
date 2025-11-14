import { expect } from 'chai';
// @ts-ignore - ethers is added by hardhat-ethers plugin
import { ethers } from 'hardhat';

/**
 * Example test file showing basic Hardhat test structure.
 * Replace with actual protocol integration tests.
 */
describe('Example Tests', () => {
  describe('Hardhat Environment', () => {
    it('should connect to hardhat network', async () => {
      const network = await ethers.provider.getNetwork();
      expect(network.chainId).to.exist;
    });

    it('should have test signers', async () => {
      const signers = await ethers.getSigners();
      expect(signers.length).to.be.greaterThan(0);
    });

    it('should get balance', async () => {
      const [signer] = await ethers.getSigners();
      const balance = await signer.getBalance();
      expect(balance).to.be.gt(0);
    });
  });

  describe('Basic Assertions', () => {
    it('should pass basic equality', () => {
      expect(1 + 1).to.equal(2);
    });

    it('should work with async', async () => {
      const result = await Promise.resolve(true);
      expect(result).to.be.true;
    });
  });
});