// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol';
import '../interfaces/IPolicy.sol';
import '../interfaces/IERC1155Tradable.sol';
import '../libraries/DataStruct.sol';

contract ElyfiGovernanceCore is Governor, GovernorTimelockControl {
  constructor(TimelockController timelock, IERC1155Tradable rewardBadge)
    Governor('ElyfiGovernanceCore')
    GovernorTimelockControl(timelock)
  {
    _policy = IPolicy(address(timelock));
    _rewardBadge = rewardBadge;
  }

  IPolicy private _policy;
  IERC1155Tradable private _rewardBadge;

  mapping(uint256 => DataStruct.ProposalVote) private _proposalVotes;

  mapping(uint256 => mapping(address => bool)) private _hasVoted;

  /**
   * @dev See {IGovernor-COUNTING_MODE}.
   * support=bravo refers to the vote options 0 = For, 1 = Against, 2 = Abstain
   * quourm=for,abstain means that both For and Abstain votes are counted towards quorum.
   */
  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() public pure virtual override returns (string memory) {
    return 'support=bravo&quorum=for,abstain';
  }

  /**
   * @dev See {IGovernor-hasVoted}.
   * Returns weither account has cast a vote on proposalId.
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
   * Amount of votes already cast passes the threshold limit.
   */
  function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
    DataStruct.ProposalVote storage proposalvote = _proposalVotes[proposalId];

    return _policy.quorumReached(proposalvote, proposalSnapshot(proposalId));
  }

  /**
   * @dev See {Governor-_voteSucceeded}.
   * In this module, the forVotes must be scritly over the againstVotes.
   * Is the proposal successful or not.
   */
  function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
    DataStruct.ProposalVote storage proposalvote = _proposalVotes[proposalId];

    return _policy.voteSucceeded(proposalvote);
  }

  /**
   * @dev See {Governor-_countVote}.
   * Register a vote with a given support and voting weight.
   * In this module, the support follows the `DataStruct.VoteType` enum (from Governor Bravo).
   */
  function _countVote(
    uint256 proposalId,
    address account,
    uint8 support,
    uint256 weight
  ) internal virtual override {
    require(
      _policy.validateVoter(account, proposalSnapshot(proposalId)),
      'ElyfiGovernor: Invalid Voter'
    );

    _rewardBadge.mint(account, proposalId, 1, '');

    DataStruct.ProposalVote storage proposalvote = _proposalVotes[proposalId];

    require(!_hasVoted[proposalId][account], 'ElyfiGovernor: Vote already casted');
    _hasVoted[proposalId][account] = true;

    if (support == uint8(DataStruct.VoteType.Against)) {
      proposalvote.againstVotes += weight;
    } else if (support == uint8(DataStruct.VoteType.For)) {
      proposalvote.forVotes += weight;
    } else if (support == uint8(DataStruct.VoteType.Abstain)) {
      proposalvote.abstainVotes += weight;
    } else {
      revert('ElyfiGovernor: invalid VoteType');
    }
  }

  /**
   * Delay (in number of blocks) since the proposal is submitted until voting power is fixed and voting starts.
   * This can be used to enforce a delay after a proposal is published for users to buy tokens, or delegate their votes.
   */
  function votingDelay() public view virtual override returns (uint256) {
    return 1; // 1 block
  }

  /**
   * Delay (in number of blocks) since the proposal starts until voting ends.
   */
  function votingPeriod() public view virtual override returns (uint256) {
    return 45818; // 1 week
  }

  // The following functions are overrides required by Solidity.

  function quorum(uint256 blockNumber) public view override(IGovernor) returns (uint256) {
    return _policy.quorum(blockNumber);
  }

  /**
   * Voting power of an account at a specific blockNumber
   */
  function getVotes(address account, uint256 blockNumber)
    public
    view
    override(IGovernor)
    returns (uint256)
  {
    return _policy.getVotes(account, blockNumber);
  }

  /**
   * Current state of a proposal, following Compound’s convention
   */
  function state(uint256 proposalId)
    public
    view
    override(Governor, GovernorTimelockControl)
    returns (ProposalState)
  {
    return super.state(proposalId);
  }

  /**
   * Create a new proposal
   */
  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
  ) public override(Governor, IGovernor) returns (uint256) {
    require(_policy.validateProposer(_msgSender(), block.number), 'Invaild Proposer');
    return super.propose(targets, values, calldatas, description);
  }

  /*
   * Internal execution mechanism
   */
  function _execute(
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(Governor, GovernorTimelockControl) {
    super._execute(proposalId, targets, values, calldatas, descriptionHash);
  }

  /*
   * Cancel the timelocked proposal if it as already been queued.
   */
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
