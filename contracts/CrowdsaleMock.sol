pragma solidity ^0.4.19;

import "./Crowdsale.sol";

contract CrowdsaleMock is Crowdsale {

  uint public nowTime;

  function CrowdsaleMock() public {
    nowTime = preICOstartTime - 1;
  }

  function currentTime() internal constant returns (uint currentTime) {
    return nowTime;
  }

  function changeTime(uint newTime) public {
    nowTime = newTime;
  }

}
