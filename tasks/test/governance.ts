import { task } from 'hardhat/config';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Connector, Tokenizer } from '@elysia-dev/contract-typechain';
import { Event } from '@ethersproject/contracts';
import { Result } from '@ethersproject/abi';
import { getContract } from '../../utils/deployment';
import { ElyfiGovernanceCore, Executor } from '../../typechain';
import { BigNumber, Contract, ethers, utils } from 'ethers';
import { toRate } from '../../test/utils/math';
import { Proposal } from '../../test/utils/proposal';
import { VoteType } from '../../test/utils/enum';

interface Args {
  nonce: string;
  id: string;
}

const assetBond = {
  tokenId: BigNumber.from(
    '115792089237316195422007842550160057480242544124026915590235438085798243682305'
  ),
  borrower: '',
  signer: '',
  principal: utils.parseEther('500000'),
  debtCeiling: utils.parseEther('2500000000'),
  couponRate: toRate(0.1),
  delinquencyRate: toRate(0.03),
  loanDuration: BigNumber.from(365),
  loanStartTimeYear: BigNumber.from(2030),
  loanStartTimeMonth: BigNumber.from(7),
  loanStartTimeDay: BigNumber.from(7),
  ipfsHash: '',
};

const checkLendingCompany = async ({
  executor,
  txSender,
  deployer,
}: {
  executor: Executor;
  txSender: SignerWithAddress;
  deployer: SignerWithAddress;
}) => {
  const role = await executor.LENDING_COMPANY_ROLE();
  const isLendingCompany = await executor.hasRole(role, txSender.address);
  if (!isLendingCompany) {
    const addLendingCompanyTx = await executor.connect(deployer).grantRole(role, txSender.address);
    await addLendingCompanyTx.wait();
    console.log(`Deployer add a lending company role to ${txSender.address}`);
  }
};

const checkVoter = async ({
  hre,
  governanceCore,
  txSender,
}: {
  hre: HardhatRuntimeEnvironment;
  governanceCore: ElyfiGovernanceCore;
  txSender: SignerWithAddress;
}) => {
  const provider = new ethers.providers.InfuraProvider(hre.network.name);
  const blockNumber = await provider.getBlockNumber();
  const votes = await governanceCore.getVotes(txSender.address, blockNumber - 1);
  console.log(votes.toString());
};

task('gov:propose:signAssetBond', 'propose')
  .addParam('nonce', 'The asset bond from saved data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, lendingCompany, borrower] = await hre.ethers.getSigners();

    const tokenizer = (await getContract(hre, 'Elyfi_USDT_Tokenzier')) as Tokenizer;
    const executor = (await getContract(hre, 'Executor')) as Executor;
    const governanceCore = (await getContract(hre, 'ElyfiGovernanceCore')) as ElyfiGovernanceCore;

    const tokenId = assetBond.tokenId.sub(args.nonce);

    await checkLendingCompany({ executor: executor, txSender: lendingCompany, deployer: deployer });

    const targets = [executor.address];
    const values = [BigNumber.from(0)];
    const calldatas = [tokenizer.interface.encodeFunctionData('signAssetBond', [tokenId, ''])];
    const proposal = await Proposal.createProposal(targets, values, calldatas, 'description');

    const proposeTx = await governanceCore
      .connect(lendingCompany)
      .propose(proposal.targets, proposal.values, proposal.callDatas, proposal.description);

    const events = (await proposeTx.wait()).events as Array<Event>;
    const result = events[0].args as Result;
    const proposalId = result['proposalId'];
    console.log(`The lending company proposed, id is ${proposalId}`);
  });

task('gov:vote:signAssetBond', 'vote')
  .addParam('id', 'The proposal id')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, lendingCompany, borrower] = await hre.ethers.getSigners();

    const governanceCore = (await getContract(hre, 'ElyfiGovernanceCore')) as ElyfiGovernanceCore;

    const accounts = [deployer, lendingCompany, borrower];

    for (let account of accounts) {
      await checkVoter({ hre: hre, governanceCore: governanceCore, txSender: account });
      const voteTx = await governanceCore.connect(account).castVote(args.id, VoteType.for);
      await voteTx.wait();
    }
  });
