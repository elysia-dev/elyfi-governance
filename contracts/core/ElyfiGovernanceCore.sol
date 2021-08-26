// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import '@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol';

import '../interfaces/IPolicy.sol';
import '../libraries/DataStruct.sol';

contract ElyfiGovernanceCore is Governor, GovernorTimelockControl {
  constructor(TimelockController _timelock)
    Governor('ElyfiGovernanceCore')
    GovernorTimelockControl(_timelock)
  {
    _policy = IPolicy(address(_timelock));
  }

  IPolicy private _policy;

  mapping(uint256 => DataStruct.ProposalVote) private _proposalVotes;

  mapping(uint256 => mapping(address => bool)) private _hasVoted;

  /**
   * @dev See {IGovernor-COUNTING_MODE}.
   */
  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() public pure virtual override returns (string memory) {
    return 'support=bravo&quorum=for,abstain';
  }

  /**
   * @dev See {IGovernor-hasVoted}.
   */
  function hasVoted(uint256 proposalId, address account)
    public
    view
    virtual
    override
    returns (bool)
  {
    return _hasVoted[proposalId][account];
  }

  /**
   * @dev Accessor to the internal vote counts.
   */
  function proposalVotes(uint256 proposalId)
    public
    view
    virtual
    returns (
      uint256 againstVotes,
      uint256 forVotes,
      uint256 abstainVotes
    )
  {
    DataStruct.ProposalVote storage proposalvote = _proposalVotes[proposalId];
    return (proposalvote.againstVotes, proposalvote.forVotes, proposalvote.abstainVotes);
  }

  /**
   * @dev See {Governor-_quorumReached}.
   */
  function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
    DataStruct.ProposalVote storage proposalvote = _proposalVotes[proposalId];

    return _policy.quorumReached(proposalvote, proposalSnapshot(proposalId));
  }

  /**
   * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be scritly over the againstVotes.
   */
  function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
    DataStruct.ProposalVote storage proposalvote = _proposalVotes[proposalId];

    return _policy.voteSucceeded(proposalvote);
  }

  /**
   * @dev See {Governor-_countVote}. In this module, the support follows the `DataStruct.VoteType` enum (from Governor Bravo).
   */
  function _countVote(
    uint256 proposalId,
    address account,
    uint8 support,
    uint256 weight
  ) internal virtual override {
    require(_policy.validateVoter(account, block.number), 'ElyfiGovernor: ');

    DataStruct.ProposalVote storage proposalvote = _proposalVotes[proposalId];

    require(!_hasVoted[proposalId][account], 'ElyfiGovernor: vote already casted');
    _hasVoted[proposalId][account] = true;

    if (support == uint8(DataStruct.VoteType.Against)) {
      proposalvote.againstVotes += weight;
    } else if (support == uint8(DataStruct.VoteType.For)) {
      proposalvote.forVotes += weight;
    } else if (support == uint8(DataStruct.VoteType.Abstain)) {
      proposalvote.abstainVotes += weight;
    } else {
      revert('ElyfiGovernor: invalid value for enum DataStruct.VoteType');
    }
  }

  function votingDelay() public pure override returns (uint256) {
    return 1; // 1 block
  }

  function votingPeriod() public pure override returns (uint256) {
    return 45818; // 1 week
  }

  // The following functions are overrides required by Solidity.

  function quorum(uint256 blockNumber) public view override(IGovernor) returns (uint256) {
    return _policy.quorum(blockNumber);
  }

  function getVotes(address account, uint256 blockNumber)
    public
    view
    override(IGovernor)
    returns (uint256)
  {
    return _policy.getVotes(account, blockNumber);
  }

  function state(uint256 proposalId)
    public
    view
    override(Governor, GovernorTimelockControl)
    returns (ProposalState)
  {
    return super.state(proposalId);
  }

  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
  ) public override(Governor, IGovernor) returns (uint256) {
    require(_policy.validateProposer(_msgSender(), block.number));
    return super.propose(targets, values, calldatas, description);
  }

  function _execute(
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(Governor, GovernorTimelockControl) {
    super._execute(proposalId, targets, values, calldatas, descriptionHash);
  }

  function _cancel(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
    return super._cancel(targets, values, calldatas, descriptionHash);
  }

  function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
    return super._executor();
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(Governor, GovernorTimelockControl)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
