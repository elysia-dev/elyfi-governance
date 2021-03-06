import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { utils, Wallet } from 'ethers';
import { waffle } from 'hardhat';

import { TestEnv } from './fixture/testEnv';

import { ProposalState, VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';
import { advanceBlockToProposalEnd, getTimestamp } from './utils/time';
import { formatBytesString } from './utils/bytes';

const { loadFixture } = waffle;

describe('queue', () => {
  let [admin, proposer, alice, bob, carol]: Wallet[] = [];
  let proposal: Proposal;
  let testEnv: TestEnv;
  let chainId: number;

  async function fixture() {
    const testEnv = await TestEnv.setup(admin);
    await testEnv.setProposers([proposer]);
    await testEnv.setVoters([alice, bob, carol]);
    return testEnv;
  }

  before(async () => {
    chainId = (await waffle.provider.getNetwork()).chainId;
    [admin, proposer, alice, bob, carol] = waffle.provider.getWallets();
  });

  beforeEach(async () => {
    testEnv = await loadFixture(fixture);

    const targets = [testEnv.executor.address];
    const values = [BigNumber.from(0)];
    const calldatas = [
      testEnv.executor.interface.encodeFunctionData('grantRole', [
        await testEnv.executor.LENDING_COMPANY_ROLE(),
        carol.address,
      ]),
    ];
    proposal = Proposal.createProposal(targets, values, calldatas, 'description');
  });

  after(async () => {
    await loadFixture(fixture);
  });

  context('queue', async () => {
    it('reverts if queue not existing proposal', async () => {
      const descriptionHash = utils.keccak256(formatBytesString(proposal.description));
      await expect(
        testEnv.core.queue(proposal.targets, proposal.values, proposal.callDatas, descriptionHash)
      ).to.be.revertedWith('Governor: unknown proposal id');
    });

    context('proposal created', async () => {
      beforeEach('propose', async () => {
        proposal = await testEnv.propose(proposer, proposal);
      });

      it('success', async () => {
        await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
        await advanceBlockToProposalEnd(proposal);
        await testEnv.expectProposalState(proposal, ProposalState.succeeded);
        const descriptionHash = utils.keccak256(formatBytesString(proposal.description));
        const tx = await testEnv.core.queue(
          proposal.targets,
          proposal.values,
          proposal.callDatas,
          descriptionHash
        );
        expect(tx)
          .to.emit(testEnv.core, 'ProposalQueued')
          .withArgs(
            proposal.id,
            (await getTimestamp(tx)).add(await testEnv.executor.getMinDelay())
          );
        await testEnv.expectProposalState(proposal, ProposalState.queued);
      });

      it('reverts if queue proposal in progress', async () => {
        await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
        await testEnv.expectProposalState(proposal, ProposalState.active);
        const descriptionHash = utils.keccak256(formatBytesString(proposal.description));
        await expect(
          testEnv.core.queue(proposal.targets, proposal.values, proposal.callDatas, descriptionHash)
        ).to.be.revertedWith('Governor: proposal not successful');
      });

      it('reverts if queue defeated proposal', async () => {
        await testEnv.core.connect(alice).castVote(proposal.id, VoteType.against);
        await advanceBlockToProposalEnd(proposal);
        await testEnv.expectProposalState(proposal, ProposalState.defeated);
        const descriptionHash = utils.keccak256(formatBytesString(proposal.description));
        await expect(
          testEnv.core.queue(proposal.targets, proposal.values, proposal.callDatas, descriptionHash)
        ).to.be.revertedWith('Governor: proposal not successful');
      });

      it('reverts if queue identical proposal twice', async () => {
        await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
        await advanceBlockToProposalEnd(proposal);
        await testEnv.expectProposalState(proposal, ProposalState.succeeded);
        const descriptionHash = utils.keccak256(formatBytesString(proposal.description));
        await testEnv.queue(proposal);
        await testEnv.expectProposalState(proposal, ProposalState.queued);
        await expect(
          testEnv.core.queue(proposal.targets, proposal.values, proposal.callDatas, descriptionHash)
        ).to.be.revertedWith('Governor: proposal not successful');
      });
    });
  });
});
