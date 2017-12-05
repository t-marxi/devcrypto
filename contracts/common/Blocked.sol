pragma solidity ^0.4.15;

contract Blocked {

    uint public blockedUntil;

    modifier unblocked {
        require(now > blockedUntil);
        _;
    }
}
