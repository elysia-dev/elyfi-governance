import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import ethSigUtil, {
  MsgParams,
  signTypedData_v4,
  signTypedMessage,
  TypedData,
  TypedDataUtils,
  TypedMessage,
} from 'eth-sig-util';
import { ECDSASignature, fromRpcSig } from 'ethereumjs-util';
import { waffle } from 'hardhat';

const [alice] = waffle.provider.getWallets();

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const Delegation = [
  { name: 'delegatee', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

async function domainSeparator(
  name: string,
  version: number,
  chainId: number,
  verifyingContract: string
) {
  return (
    '0x' +
    ethSigUtil.TypedDataUtils.hashStruct(
      'EIP712Domain',
      { name, version, chainId, verifyingContract },
      { EIP712Domain }
    ).toString('hex')
  );
}

const name = 'StakedElyfiToken';
const symbol = 'MTKN';
const version = '1';

export const buildDelegationData = (
  chainId: number,
  verifyingContract: string,
  delegatee: string,
  nonce: string,
  expiry: string
) => {
  const typedData: TypedMessage<any> = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Delegation: [
        { name: 'delegatee', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
      ],
    },
    primaryType: 'Delegation',
    domain: {
      name: 'StakedElyfiToken',
      version: '1',
      chainId: chainId,
      verifyingContract: verifyingContract,
    },
    message: {
      delegatee: delegatee,
      nonce: nonce,
      expiry: expiry,
    },
  };
  return typedData;
};

export const getSignatureFromTypedData = (
  privateKey: string,
  typedData: TypedMessage<any>
): ECDSASignature => {
  const signature = signTypedMessage(Buffer.from(privateKey.substring(2, 66), 'hex'), {
    data: typedData,
  });
  return fromRpcSig(signature);
};
