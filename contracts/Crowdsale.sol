pragma solidity ^0.4.18;

import "contracts/DEVCoin.sol";
import "contracts/common/Owned.sol";
import "contracts/common/SafeMath.sol";
import "contracts/common/ManualSendingCrowdsale.sol";

contract Crowdsale is ManualSendingCrowdsale {

    using SafeMath for uint256;

    enum State { PRE_ICO, ICO }

    State public state = State.PRE_ICO;

    // Date of start pre-ICO and ICO.
    uint public constant preICOstartTime =    1514160000; // start at Monday, December 25, 2017 12:00:00 AM
    uint public constant preICOendTime =      1516752000; // end at   Wednesday, January 24, 2018 12:00:00 AM
    uint public constant ICOstartTime =    1516838400; // start at Thursday, January 25, 2018 12:00:00 AM
    uint public constant ICOendTime =      1519430400; // end at Saturday, February 24, 2018 12:00:00 AM

    uint public constant bountyAvailabilityTime = ICOendTime + 90 days;

    uint256 public constant maxTokenAmount = 35000000 * 10**18; // max minting
    uint256 public constant bountyTokens =    1750000 * 10**18; // bounty amount

    uint256 public constant maxPreICOTokenAmount = 5000000 * 10**18; // max number of tokens on pre-ICO;

    DEVCoin public token;

    uint256 public leftTokens = 0;

    uint256 public totalAmount = 0;
    uint public transactionCounter = 0;

    /** ------------------------------- */
    /** Bonus part: */

    // Amount bonuses
    uint private firstAmountBonus = 20;
    uint256 private firstAmountBonusBarrier = 50 ether;
    uint private secondAmountBonus = 10;
    uint256 private secondAmountBonusBarrier = 100 ether;

    // pre-ICO bonuses by time
    uint private preICOBonus = 15;
    uint private firstPreICOTimeBarrier = preICOstartTime + 1 days;
    uint private firstPreICOTimeBonus = 15;
    uint private secondPreICOTimeBarrier = preICOstartTime + 7 days;
    uint private secondPreICOTimeBonus = 10;

    // ICO bonuses by time
    uint private firstICOTimeBarrier = ICOstartTime + 1 days;
    uint private firstICOTimeBonus = 20;
    uint private secondICOTimeBarrier = ICOstartTime + 3 days;
    uint private secondICOTimeBonus = 15;
    uint private thirdICOTimeBarrier = ICOstartTime + 6 days;
    uint private thirdICOTimeBonus = 10;
    uint private fourthICOTimeBarrier = ICOstartTime + 14 days;
    uint private fourthICOTimeBonus = 5;

    /** ------------------------------- */

    bool public bonusesPayed = false;

    uint256 public constant rateToEther = 5000; // rate to ether, how much tokens gives to 1 ether

    uint256 public constant minAmountForDeal = 10**17;

    modifier canBuy() {
        require(!isFinished());
        require(isPreICO() || isICO());
        _;
    }

    modifier minPayment() {
        require(msg.value >= minAmountForDeal);
        _;
    }

    function Crowdsale() public {
        //require(currentTime() < preICOstartTime);
        token = new DEVCoin(maxTokenAmount, ICOendTime);
        leftTokens = maxPreICOTokenAmount;
        addCurrencyInternal(0); // add BTC
    }

    function isFinished() public constant returns (bool) {
        return currentTime() > ICOendTime || leftTokens == 0;
    }

    function isPreICO() public constant returns (bool) {
        var curTime = currentTime();
        return curTime < preICOendTime && curTime > preICOstartTime;
    }

    function isICO() public constant returns (bool) {
        var curTime = currentTime();
        return curTime < ICOendTime && curTime > ICOstartTime;
    }

    function() external canBuy minPayment payable {
        uint256 amount = msg.value;
        uint bonus = getBonus(amount);
        uint256 givenTokens = amount.mul(rateToEther).div(100).mul(100 + bonus);
        uint256 providedTokens = transferTokensTo(msg.sender, givenTokens);

        if (givenTokens > providedTokens) {
            uint256 needAmount = providedTokens.mul(100).div(100 + bonus).div(rateToEther);
            require(amount > needAmount);
            require(msg.sender.call.gas(3000000).value(amount - needAmount)());
            amount = needAmount;
        }
        totalAmount = totalAmount.add(amount);
    }

    function manualTransferTokensToWithBonus(address to, uint256 givenTokens, uint currency, uint256 amount) external canBuy onlyOwner returns (uint256) {
        uint bonus = getBonus(0);
        uint256 transferedTokens = givenTokens.mul(100 + bonus).div(100);
        return manualTransferTokensToInternal(to, transferedTokens, currency, amount);
    }

    function manualTransferTokensTo(address to, uint256 givenTokens, uint currency, uint256 amount) external onlyOwner canBuy returns (uint256) {
        return manualTransferTokensToInternal(to, givenTokens, currency, amount);
    }

    function getBonus(uint256 amount) public constant returns (uint) {
        uint bonus = 0;
        if (isPreICO()) {
            bonus = getPreICOBonus();
        }

        if (isICO()) {
            bonus = getICOBonus();
        }

        if (amount >= firstAmountBonusBarrier) {
            bonus = bonus + firstAmountBonus;
        }
        if (amount >= secondAmountBonusBarrier) {
            bonus = bonus + secondAmountBonus;
        }
        return bonus;
    }

    function getPreICOBonus() public constant returns (uint) {
        uint curTime = currentTime();
        if (curTime < firstPreICOTimeBarrier) {
            return firstPreICOTimeBonus + preICOBonus;
        }
        if (curTime < secondPreICOTimeBarrier) {
            return secondPreICOTimeBonus + preICOBonus;
        }
        return preICOBonus;
    }

    function getICOBonus() public constant returns (uint) {
        uint curTime = currentTime();
        if (curTime < firstICOTimeBarrier) {
            return firstICOTimeBonus;
        }
        if (curTime < secondICOTimeBarrier) {
            return secondICOTimeBonus;
        }
        if (curTime < thirdICOTimeBarrier) {
            return thirdICOTimeBonus;
        }
        if (curTime < fourthICOTimeBarrier) {
            return fourthICOTimeBonus;
        }
        return 0;
    }

    function finishCrowdsale() external {
        require(isFinished());
        require(state == State.ICO);
        if (leftTokens > 0) {
            token.burn(leftTokens);
            leftTokens = 0;
        }
    }

    function takeBounty() external onlyOwner {
        require(isFinished());
        require(state == State.ICO);
        require(now > bountyAvailabilityTime);
        require(!bonusesPayed);
        bonusesPayed = true;
        require(token.transfer(msg.sender, bountyTokens));
    }

    function startICO() external {
        require(currentTime() > preICOendTime);
        require(state == State.PRE_ICO && leftTokens <= maxPreICOTokenAmount);
        leftTokens = leftTokens.add(maxTokenAmount).sub(maxPreICOTokenAmount).sub(bountyTokens);
        state = State.ICO;
    }

    function transferTokensTo(address to, uint256 givenTokens) internal returns (uint256) {
        var providedTokens = givenTokens;
        if (givenTokens > leftTokens) {
            providedTokens = leftTokens;
        }
        leftTokens = leftTokens.sub(providedTokens);
        require(token.manualTransfer(to, providedTokens));
        transactionCounter = transactionCounter + 1;
        return providedTokens;
    }

    function withdraw() external onlyOwner {
        require(msg.sender.call.gas(3000000).value(this.balance)());
    }

    function withdrawAmount(uint256 amount) external onlyOwner {
        uint256 givenAmount = amount;
        if (this.balance < amount) {
            givenAmount = this.balance;
        }
        require(msg.sender.call.gas(3000000).value(givenAmount)());
    }

    function currentTime() internal constant returns (uint) {
        return now;
    }
}
