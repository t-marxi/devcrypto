const web3 = global.web3;
const CrowdsaleMock = artifacts.require('./CrowdsaleMock.sol')
const DEVCoin = artifacts.require('./DEVCoin.sol')

contract('CrowdsaleTest', function ([owner, donor]) {
    let crowdsale;
    beforeEach('setup contract for each test', async function () {
        crowdsale = await CrowdsaleMock.new(owner);
    })

    it('has an owner', async function () {
        assert.equal(await crowdsale.owner(), owner);
    })

    it('is not able to buy before start, between phases and after end', async function () {
        let addError;
        try {
            await crowdsale.sendTransaction({ value: 10*1e+18, from: donor });
        } catch (error) {
            addError = error;
        }
        assert.notEqual(addError, undefined, 'Error must be thrown');
        addError = undefined;
        try {
            await crowdsale.manualTransferTokensTo.sendTransaction(donor, "5000000000000000000000", 0, 2000, {from: owner});
        } catch (error) {
            addError = error;
        }
        assert.notEqual(addError, undefined, 'Error must be thrown');

        var preICOEnd = await crowdsale.preICOendTime();
        console.log("----Change system time -------------");
        preICOEnd.c[0] += 1000;
        await crowdsale.changeTime(preICOEnd);
        addError = undefined;
        try {
            await crowdsale.sendTransaction({ value: 10*1e+18, from: donor });
        } catch (error) {
            addError = error;
        }
        assert.notEqual(addError, undefined, 'Error must be thrown');
        addError = undefined;
        try {
            await crowdsale.manualTransferTokensTo.sendTransaction(donor, "5000000000000000000000", 0, 2000, {from: owner});
        } catch (error) {
            addError = error;
        }
        assert.notEqual(addError, undefined, 'Error must be thrown');

        var ICOEnd = await crowdsale.ICOendTime();
        console.log("----Change system time -------------");
        ICOEnd.c[0] += 1000;
        await crowdsale.changeTime(ICOEnd);
        addError = undefined;
        try {
            await crowdsale.sendTransaction({ value: 10*1e+18, from: donor });
        } catch (error) {
            addError = error;
        }
        assert.notEqual(addError, undefined, 'Error must be thrown');
        addError = undefined;
        try {
            await crowdsale.manualTransferTokensTo.sendTransaction(donor, "5000000000000000000000", 0, 2000, {from: owner});
        } catch (error) {
            addError = error;
        }
        assert.notEqual(addError, undefined, 'Error must be thrown');

    })

    it('is able to buy tokens after start pre-ICO and ICO', async function () {
          var tokenAddress = await crowdsale.token();
          var token = DEVCoin.at(tokenAddress);

          var preICOStart = await crowdsale.preICOstartTime();
          console.log("----Change system time -------------");
          preICOStart.c[0] += 1000;
          await crowdsale.changeTime(preICOStart);

          await crowdsale.sendTransaction({ value: 10*1e+18, from: donor });
          assert.equal(65000, (await token.balanceOf(donor)).toNumber()/1e+18, "Owner should have 65000 DevCoin initially");

          var value = await token.balanceOf(donor);
          console.log(value);
          await crowdsale.manualTransferTokensTo.sendTransaction(donor, "5000000000000000000000", 0, 2000, {from: owner});
          assert.equal(70000, (await token.balanceOf(donor)).toNumber()/1e+18, "Owner should have 70000 DevCoin initially");

          var ICOStart = await crowdsale.ICOstartTime();
          console.log("----Change system time -------------");
          ICOStart.c[0] += 1000;
          await crowdsale.changeTime(ICOStart);

          await crowdsale.sendTransaction({ value: 10*1e+18, from: donor });
          assert.equal(130000, (await token.balanceOf(donor)).toNumber()/1e+18, "Owner should have 125000 DevCoin initially");

          await crowdsale.manualTransferTokensTo.sendTransaction(donor, "5000000000000000000000", 0, 2000, {from: owner});
          assert.equal(135000, (await token.balanceOf(donor)).toNumber()/1e+18, "Owner should have 135000 DevCoin initially");
    })

    it('test all pre-ICO bonuses and payment size', async function () {
          var preICOStart = await crowdsale.preICOstartTime();
          console.log("----Change system time -------------");
          preICOStart.c[0] += 1000;
          await crowdsale.changeTime(preICOStart);
          assert.equal(30, await crowdsale.getBonus(10*1e+18), "Bonus should be 30%");
          assert.equal(50, await crowdsale.getBonus(51*1e+18), "Bonus should be 50%");
          assert.equal(60, await crowdsale.getBonus(100*1e+18), "Bonus should be 60%");

          console.log("----Change system time -------------");
          preICOStart.c[0] += 60*60*24;
          await crowdsale.changeTime(preICOStart);
          assert.equal(25, await crowdsale.getBonus(10*1e+18), "Bonus should be 25%");
          assert.equal(45, await crowdsale.getBonus(50*1e+18), "Bonus should be 45%");
          assert.equal(55, await crowdsale.getBonus(110*1e+18), "Bonus should be 55%");

          console.log("----Change system time -------------");
          preICOStart.c[0] += 60*60*24*7;
          await crowdsale.changeTime(preICOStart);
          assert.equal(15, await crowdsale.getBonus(10*1e+18), "Bonus should be 15%");
          assert.equal(35, await crowdsale.getBonus(50*1e+18), "Bonus should be 35%");
          assert.equal(45, await crowdsale.getBonus(110*1e+18), "Bonus should be 45%");
    })

    it('test all ICO bonuses and payment size', async function () {
          var ICOStart = await crowdsale.ICOstartTime();
          console.log("----Change system time -------------");
          ICOStart.c[0] += 1000;
          await crowdsale.changeTime(ICOStart);
          assert.equal(20, await crowdsale.getBonus(10*1e+18), "Bonus should be 20%");
          assert.equal(40, await crowdsale.getBonus(50*1e+18), "Bonus should be 40%");
          assert.equal(50, await crowdsale.getBonus(110*1e+18), "Bonus should be 50%");

          console.log("----Change system time -------------");
          ICOStart.c[0] += 60*60*24;
          await crowdsale.changeTime(ICOStart);
          assert.equal(15, await crowdsale.getBonus(10*1e+18), "Bonus should be 15%");
          assert.equal(35, await crowdsale.getBonus(50*1e+18), "Bonus should be 35%");
          assert.equal(45, await crowdsale.getBonus(110*1e+18), "Bonus should be 45%");

          console.log("----Change system time -------------");
          ICOStart.c[0] += 60*60*24*3;
          await crowdsale.changeTime(ICOStart);
          assert.equal(10, await crowdsale.getBonus(10*1e+18), "Bonus should be 10%");
          assert.equal(30, await crowdsale.getBonus(50*1e+18), "Bonus should be 30%");
          assert.equal(40, await crowdsale.getBonus(110*1e+18), "Bonus should be 40%");

          console.log("----Change system time -------------");
          ICOStart.c[0] += 60*60*24*4;
          await crowdsale.changeTime(ICOStart);
          assert.equal(5, await crowdsale.getBonus(10*1e+18), "Bonus should be 5%");
          assert.equal(25, await crowdsale.getBonus(50*1e+18), "Bonus should be 25%");
          assert.equal(35, await crowdsale.getBonus(110*1e+18), "Bonus should be 35%");

          console.log("----Change system time -------------");
          ICOStart.c[0] += 60*60*24*8;
          await crowdsale.changeTime(ICOStart);
          assert.equal(0, await crowdsale.getBonus(10*1e+18), "Bonus should be 0%");
          assert.equal(20, await crowdsale.getBonus(50*1e+18), "Bonus should be 20%");
          assert.equal(30, await crowdsale.getBonus(110*1e+18), "Bonus should be 30%");
    })

    it('test full cycle of life', async function () {
          var preICOStart = await crowdsale.preICOstartTime();
          console.log("----Change system time -------------");
          preICOStart.c[0] += 1000;
          await crowdsale.changeTime(preICOStart);
          await crowdsale.sendTransaction({ value: 10*1e+18, from: donor });

          let addError;
          try { await crowdsale.finishCrowdsale.sendTransactione({from: owner}); } catch (error) { addError = error; }
          assert.notEqual(addError, undefined, 'Error must be thrown');
          addError = undefined;
          try { await crowdsale.takeBounty.sendTransaction({from: owner}); } catch (error) { addError = error; }
          assert.notEqual(addError, undefined, 'Error must be thrown');
          addError = undefined;
          try { await crowdsale.startICO.sendTransaction({from: owner}); } catch (error) { addError = error; }
          assert.notEqual(addError, undefined, 'Error must be thrown');

          console .log("----Change system time -------------");
          var preICOend = await crowdsale.preICOendTime();
          preICOend.c[0] += 1000;
          await crowdsale.changeTime(preICOend);

          addError = undefined;
          try { await crowdsale.finishCrowdsale.sendTransactione({from: owner}); } catch (error) { addError = error; }
          assert.notEqual(addError, undefined, 'Error must be thrown');
          addError = undefined;
          try { await crowdsale.takeBounty.sendTransaction({from: owner}); } catch (error) { addError = error; }
          assert.notEqual(addError, undefined, 'Error must be thrown');

          await crowdsale.startICO.sendTransaction({from: donor});
          assert.equal(33185000, (await crowdsale.leftTokens()).toNumber()/1e+18, "Owner should have 33185000 DevCoin initially");

          console.log("----Change system time -------------");
          var ICOStart = await crowdsale.ICOstartTime();
          ICOStart.c[0] += 10000;
          await crowdsale.changeTime(ICOStart);

          addError = undefined;
          try { await crowdsale.finishCrowdsale.sendTransactione({from: owner}); } catch (error) { addError = error; }
          assert.notEqual(addError, undefined, 'Error must be thrown');
          addError = undefined;
          try { await crowdsale.takeBounty.sendTransaction({from: owner}); } catch (error) { addError = error; }
          assert.notEqual(addError, undefined, 'Error must be thrown');
    })
})
