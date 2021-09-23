import { task } from 'hardhat/config';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Connector, Tokenizer } from '@elysia-dev/contract-typechain';
import { getContract } from '../../utils/deployment';
import { ElyfiGovernanceCore, Executor } from '../../typechain';
import { BigNumber, Contract, utils } from 'ethers';
import { toRate } from '../../test/utils/math';
import { Proposal } from '../../test/utils/proposal';

interface Args {
  nonce: string;
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
  txSender: string;
  deployer: SignerWithAddress;
}) => {
  const role = await executor.LENDING_COMPANY_ROLE();
  const isLendingCompany = await executor.hasRole(role, txSender);
  if (!isLendingCompany) {
    const addLendingCompanyTx = await executor.connect(deployer).grantRole(role, txSender);
    await addLendingCompanyTx.wait();
    console.log(`Deployer add a lending company role to ${txSender}`);
  }
};

task('gov:propose:signAssetBond', 'propose')
  .addParam('nonce', 'The asset bond from saved data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, lendingCompany, borrower] = await hre.ethers.getSigners();

    const tokenizer = (await getContract(hre, 'Tokenizer')) as Tokenizer;
    const connector = (await getContract(hre, 'Connector')) as Connector;
    const executor = (await getContract(hre, 'Executor')) as Executor;
    const governanceCore = (await getContract(hre, 'ElyfiGovernanceCore')) as ElyfiGovernanceCore;

    const tokenId = assetBond.tokenId.sub(args.nonce);

    console.log(tokenizer.address, connector.address);

    await checkLendingCompany({
      executor: executor,
      txSender: lendingCompany.address,
      deployer: deployer,
    });

    const targets = [executor.address];
    const values = [BigNumber.from(0)];
    const calldatas = [tokenizer.interface.encodeFunctionData('signAssetBond', [tokenId, ''])];
    const proposal = await Proposal.createProposal(targets, values, calldatas, 'description');

    const proposeTx = await governanceCore
      .connect(lendingCompany)
      .propose(proposal.targets, proposal.values, proposal.callDatas, proposal.description);
    await proposeTx.wait();
    console.log(`The lending company proposed`);
  });
