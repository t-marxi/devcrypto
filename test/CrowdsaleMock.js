const web3 = global.web3;
const CrowdsaleMock = artifacts.require('CrowdsaleMock.sol')
const DEVCoin = artifacts.require('DEVCoin.sol')

contract('CrowdsaleTest', async (accounts) => {

    it('has an owner', async () => {
        let crowdsale = await CrowdsaleMock.deployed();
        assert.equal(await crowdsale.owner(), accounts[0]);
    })

    it('is not able to buy before start, between phases and after end', async () => {
        let crowdsale = await CrowdsaleMock.deployed();
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

    it('is able to buy tokens after start pre-ICO and ICO', async () => {
          let crowdsale = await CrowdsaleMock.deployed();
          var tokenAddress = await crowdsale.token();
          var token = DEVCoin.at(tokenAddress);
          var owner = accounts[0];
          var donor = accounts[1];

          var preICOStart = await crowdsale.preICOstartTime();
          console.log("----Change system time -------------");
          preICOStart.c[0] += 1000;
          await crowdsale.changeTime(preICOStart);

          await crowdsale.sendTransaction({ value: 10*1e+18, from: donor });
          assert.equal(108000, Math.round((await token.balanceOf(donor)).toNumber()/1e+18), "Owner should have 108000 DevCoin initially");

          var value = await token.balanceOf(donor);
          console.log(value);
          await crowdsale.manualTransferTokensTo.sendTransaction(donor, "2000000000000000000000", 0, 2000, {from: owner});
          assert.equal(110000, Math.round((await token.balanceOf(donor)).toNumber()/1e+18), "Owner should have 110000 DevCoin initially");

          var ICOStart = await crowdsale.ICOstartTime();
          console.log("----Change system time -------------");
          ICOStart.c[0] += 1000;
          await crowdsale.changeTime(ICOStart);

          await crowdsale.sendTransaction({ value: 10*1e+18, from: donor });
          assert.equal(213500, Math.round((await token.balanceOf(donor)).toNumber()/1e+18), "Owner should have 213500 DevCoin initially");

          await crowdsale.manualTransferTokensTo.sendTransaction(donor, "5000000000000000000000", 0, 2000, {from: owner});
          assert.equal(218500, Math.round((await token.balanceOf(donor)).toNumber()/1e+18), "Owner should have 218500 DevCoin initially");
    })

    it('test all pre-ICO bonuses and payment size', async () => {
          let crowdsale = await CrowdsaleMock.deployed();
          var preICOStart = await crowdsale.preICOstartTime();
          console.log("----Change system time -------------");
          preICOStart.c[0] += 1000;
          await crowdsale.changeTime(preICOStart);
          assert.equal(20, (await crowdsale.getBonus(10*1e+18)).toNumber(), "Bonus should be 20%");
          assert.equal(25, (await crowdsale.getBonus(21*1e+18)).toNumber(), "Bonus should be 25%");
          assert.equal(30, (await crowdsale.getBonus(51*1e+18)).toNumber(), "Bonus should be 30%");
          assert.equal(35, (await crowdsale.getBonus(101*1e+18)).toNumber(), "Bonus should be 35%");
          assert.equal(40, (await crowdsale.getBonus(501*1e+18)).toNumber(), "Bonus should be 40%");

          console.log("----Change system time -------------");
          preICOStart.c[0] += 60*60*24;
          await crowdsale.changeTime(preICOStart);
          assert.equal(10, (await crowdsale.getBonus(10*1e+18)).toNumber(), "Bonus should be 10%");
          assert.equal(15, (await crowdsale.getBonus(21*1e+18)).toNumber(), "Bonus should be 15%");
          assert.equal(20, (await crowdsale.getBonus(51*1e+18)).toNumber(), "Bonus should be 20%");
          assert.equal(25, (await crowdsale.getBonus(101*1e+18)).toNumber(), "Bonus should be 25%");
          assert.equal(30, (await crowdsale.getBonus(501*1e+18)).toNumber(), "Bonus should be 30%");

          console.log("----Change system time -------------");
          preICOStart.c[0] += 60*60*24*7;
          await crowdsale.changeTime(preICOStart);
          assert.equal(5, (await crowdsale.getBonus(10*1e+18)).toNumber(), "Bonus should be 5%");
          assert.equal(10, (await crowdsale.getBonus(21*1e+18)).toNumber(), "Bonus should be 10%");
          assert.equal(15, (await crowdsale.getBonus(51*1e+18)).toNumber(), "Bonus should be 15%");
          assert.equal(20, (await crowdsale.getBonus(101*1e+18)).toNumber(), "Bonus should be 20%");
          assert.equal(25, (await crowdsale.getBonus(501*1e+18)).toNumber(), "Bonus should be 25%");

          console.log("----Change system time -------------");
          preICOStart.c[0] += 60*60*24*7;
          await crowdsale.changeTime(preICOStart);
          assert.equal(0, (await crowdsale.getBonus(10*1e+18)).toNumber(), "Bonus should be 0%");
          assert.equal(5, (await crowdsale.getBonus(21*1e+18)).toNumber(), "Bonus should be 5%");
          assert.equal(10, (await crowdsale.getBonus(51*1e+18)).toNumber(), "Bonus should be 10%");
          assert.equal(15, (await crowdsale.getBonus(101*1e+18)).toNumber(), "Bonus should be 15%");
          assert.equal(20, (await crowdsale.getBonus(501*1e+18)).toNumber(), "Bonus should be 20%");
    })

    it('test all ICO bonuses and payment size',async () => {
          let crowdsale = await CrowdsaleMock.deployed();
          var ICOStart = await crowdsale.ICOstartTime();
          console.log("----Change system time -------------");
          ICOStart.c[0] += 1000;
          await crowdsale.changeTime(ICOStart);
          assert.equal(15, (await crowdsale.getBonus(10*1e+18)).toNumber(), "Bonus should be 15%");
          assert.equal(20, (await crowdsale.getBonus(21*1e+18)).toNumber(), "Bonus should be 20%");
          assert.equal(25, (await crowdsale.getBonus(51*1e+18)).toNumber(), "Bonus should be 25%");
          assert.equal(30, (await crowdsale.getBonus(101*1e+18)).toNumber(), "Bonus should be 30%");
          assert.equal(35, (await crowdsale.getBonus(501*1e+18)).toNumber(), "Bonus should be 35%");

          console.log("----Change system time -------------");
          ICOStart.c[0] += 60*60*24;
          await crowdsale.changeTime(ICOStart);
          assert.equal(7, (await crowdsale.getBonus(10*1e+18)).toNumber(), "Bonus should be 7%");
          assert.equal(12, (await crowdsale.getBonus(21*1e+18)).toNumber(), "Bonus should be 12%");
          assert.equal(17, (await crowdsale.getBonus(51*1e+18)).toNumber(), "Bonus should be 17%");
          assert.equal(22, (await crowdsale.getBonus(101*1e+18)).toNumber(), "Bonus should be 22%");
          assert.equal(27, (await crowdsale.getBonus(501*1e+18)).toNumber(), "Bonus should be 27%");

          console.log("----Change system time -------------");
          ICOStart.c[0] += 60*60*24*7;
          await crowdsale.changeTime(ICOStart);
          assert.equal(4, (await crowdsale.getBonus(10*1e+18)).toNumber(), "Bonus should be 4%");
          assert.equal(9, (await crowdsale.getBonus(21*1e+18)).toNumber(), "Bonus should be 9%");
          assert.equal(14, (await crowdsale.getBonus(51*1e+18)).toNumber(), "Bonus should be 14%");
          assert.equal(19, (await crowdsale.getBonus(101*1e+18)).toNumber(), "Bonus should be 19%");
          assert.equal(24, (await crowdsale.getBonus(501*1e+18)).toNumber(), "Bonus should be 24%");

          console.log("----Change system time -------------");
          ICOStart.c[0] += 60*60*24*7;
          await crowdsale.changeTime(ICOStart);
          assert.equal(0, (await crowdsale.getBonus(10*1e+18)).toNumber(), "Bonus should be 0%");
          assert.equal(5, (await crowdsale.getBonus(21*1e+18)).toNumber(), "Bonus should be 5%");
          assert.equal(10, (await crowdsale.getBonus(51*1e+18)).toNumber(), "Bonus should be 10%");
          assert.equal(15, (await crowdsale.getBonus(101*1e+18)).toNumber(), "Bonus should be 15%");
          assert.equal(20, (await crowdsale.getBonus(501*1e+18)).toNumber(), "Bonus should be 20%");

    })

    it('test full cycle of life', async () => {
          let crowdsale = await CrowdsaleMock.deployed();
          var preICOStart = await crowdsale.preICOstartTime();
          var owner = accounts[0];
          var donor = accounts[1];
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
          assert.equal(75273500, (await crowdsale.leftTokens()).toNumber()/1e+18, "Owner should have 75273500 DevCoin initially");

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
