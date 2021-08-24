// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/governance/TimelockController.sol';

import '../interfaces/IElyfiGovernanceCore.sol';

import '../auxiliaries/Policy.sol';

contract Executor is TimelockController, Policy {
  /// @param minDelay Minimum delay for propose execution
  /// @param proposers Governance core address
  /// @param executors Executors address
  /// @param token_ The address of the token representing voting rights
  constructor(
    uint256 minDelay,
    address[] memory proposers,
    address[] memory executors,
    address token_
  ) TimelockController(minDelay, proposers, executors) Policy(token_) {}

  function execute(
    address target,
    uint256 value,
    bytes calldata data,
    bytes32 predecessor,
    bytes32 salt
  ) public payable override(TimelockController) {
    super.execute(target, value, data, predecessor, salt);
  }

  function schedule(
    address target,
    uint256 value,
    bytes calldata data,
    bytes32 predecessor,
    bytes32 salt,
    uint256 delay
  ) public override(TimelockController) {
    super.schedule(target, value, data, predecessor, salt, delay);
  }

  function scheduleBatch(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata datas,
    bytes32 predecessor,
    bytes32 salt,
    uint256 delay
  ) public override(TimelockController) {
    super.scheduleBatch(targets, values, datas, predecessor, salt, delay);
  }
}
