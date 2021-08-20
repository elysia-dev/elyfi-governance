// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface of Counter in Elyfi governance
 */
interface ICounter {
    function getVotes(address account, uint256 blockNumber)
        external
        view
        returns (uint256);
}
