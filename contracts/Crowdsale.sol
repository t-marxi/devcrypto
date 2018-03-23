pragma solidity ^0.4.19;

import "contracts/DEVCoin.sol";
import "contracts/common/Owned.sol";
import "contracts/common/SafeMath.sol";
import "contracts/common/ManualSendingCrowdsale.sol";

contract Crowdsale is ManualSendingCrowdsale {

    using SafeMath for uint256;

    enum State { PRE_ICO, ICO }

    State public state = State.PRE_ICO;

    // Date of start pre-ICO and ICO.
    uint public constant preICOstartTime =    1522454400; // start at Saturday, March 31, 2018 12:00:00 AM
    uint public constant preICOendTime =      1523750400; // end at Sunday, April 15, 2018 12:00:00 AM
    uint public constant ICOstartTime =    1524355200; // start at Tuesday, May 22, 2018 12:00:00 AM
    uint public constant ICOendTime =      1527033600; // end at Wednesday, May 23, 2018 12:00:00 AM

    uint public constant bountyAvailabilityTime = ICOendTime + 90 days;

    uint256 public constant maxTokenAmount = 108e24; // max minting   (108, 000, 000 tokens)
    uint256 public constant bountyTokens =   324e23; // bounty amount ( 32, 400, 000 tokens)

    uint256 public constant maxPreICOTokenAmount = 81e23; // max number of tokens on pre-ICO (8, 100, 000 tokens);

    DEVCoin public token;

    uint256 public leftTokens = 0;

    uint256 public totalAmount = 0;
    uint public transactionCounter = 0;

    /** ------------------------------- */
    /** Bonus part: */

    // Amount bonuses
    uint private firstAmountBonus = 20;
    uint256 private firstAmountBonusBarrier = 500 ether;
    uint private secondAmountBonus = 15;
    uint256 private secondAmountBonusBarrier = 100 ether;
    uint private thirdAmountBonus = 10;
    uint256 private thirdAmountBonusBarrier = 50 ether;
    uint private fourthAmountBonus = 5;
    uint256 private fourthAmountBonusBarrier = 20 ether;

    // pre-ICO bonuses by time
    uint private firstPreICOTimeBarrier = preICOstartTime + 1 days;
    uint private firstPreICOTimeBonus = 20;
    uint private secondPreICOTimeBarrier = preICOstartTime + 7 days;
    uint private secondPreICOTimeBonus = 10;
    uint private thirdPreICOTimeBarrier = preICOstartTime + 14 days;
    uint private thirdPreICOTimeBonus = 5;

    // ICO bonuses by time
    uint private firstICOTimeBarrier = ICOstartTime + 1 days;
    uint private firstICOTimeBonus = 15;
    uint private secondICOTimeBarrier = ICOstartTime + 7 days;
    uint private secondICOTimeBonus = 7;
    uint private thirdICOTimeBarrier = ICOstartTime + 14 days;
    uint private thirdICOTimeBonus = 4;

    /** ------------------------------- */

    bool public bonusesPayed = false;

    uint256 public constant rateToEther = 9000; // rate to ether, how much tokens gives to 1 ether

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
        return currentTime() > ICOendTime || (leftTokens == 0 && state == State.ICO);
    }

    function isPreICO() public constant returns (bool) {
        uint curTime = currentTime();
        return curTime < preICOendTime && curTime > preICOstartTime;
    }

    function isICO() public constant returns (bool) {
        uint curTime = currentTime();
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
        return bonus + getAmountBonus(amount);
    }

    function getAmountBonus(uint256 amount) public constant returns (uint) {
        if (amount >= firstAmountBonusBarrier) {
            return firstAmountBonus;
        }
        if (amount >= secondAmountBonusBarrier) {
            return secondAmountBonus;
        }
        if (amount >= thirdAmountBonusBarrier) {
            return thirdAmountBonus;
        }
        if (amount >= fourthAmountBonusBarrier) {
            return fourthAmountBonus;
        }
        return 0;
    }

    function getPreICOBonus() public constant returns (uint) {
        uint curTime = currentTime();
        if (curTime < firstPreICOTimeBarrier) {
            return firstPreICOTimeBonus;
        }
        if (curTime < secondPreICOTimeBarrier) {
            return secondPreICOTimeBonus;
        }
        if (curTime < thirdPreICOTimeBarrier) {
            return thirdPreICOTimeBonus;
        }
        return 0;
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
        uint256 providedTokens = givenTokens;
        if (givenTokens > leftTokens) {
            providedTokens = leftTokens;
        }
        leftTokens = leftTokens.sub(providedTokens);
        require(token.manualTransfer(to, providedTokens));
        transactionCounter = transactionCounter + 1;
        return providedTokens;
    }

    function withdraw() external onlyOwner {
        require(msg.sender.call.gas(3000000).value(address(this).balance)());
    }

    function withdrawAmount(uint256 amount) external onlyOwner {
        uint256 givenAmount = amount;
        if (address(this).balance < amount) {
            givenAmount = address(this).balance;
        }
        require(msg.sender.call.gas(3000000).value(givenAmount)());
    }

    function currentTime() internal constant returns (uint) {
        return now;
    }
}
