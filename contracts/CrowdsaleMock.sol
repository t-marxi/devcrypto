pragma solidity ^0.4.15;

import "./Crowdsale.sol";

contract CrowdsaleMock is Crowdsale {

  uint256 public now;

  function CrowdsaleMock() public {
    now = preICOstartTime - 1;
  }

  function currentTime() internal constant returns (uint currentTime) {
    return now;
  }

  function changeTime(uint newTime) public {
    now = newTime;
  }

}
