var API = require('./api.js');
var ejs = require('ejs');
var date = require('datejs');

var tickers = {};
var firstOldPrices = {};

API.init(function(err,result){
  API.getTrades(function(err, result){
    try {
      var trades = result.trades;
      trades.sort(function(a,b){return a.blockNumber-b.blockNumber});
      trades.forEach(function(trade){
        if (trade.token && trade.base && trade.base.name=='ETH') {
          var pair = trade.base.name+'_'+trade.token.name;
          if (!tickers[pair]) {
            tickers[pair] = {"last":undefined,"lowestAsk":undefined,"highestBid":undefined,"percentChange":undefined,
"baseVolume":0,"quoteVolume":0};
          }
          var tradeTime = API.blockTime(trade.blockNumber);
          var price = Number(trade.price);
          tickers[pair].last = price;
          if (!firstOldPrices[pair]) firstOldPrices[pair] = price;
          if (Date.now()-tradeTime.getTime() < 86400*1000*1) {
            var quoteVolume = Number(API.utility.weiToEth(Math.abs(trade.amount), trade.token.divisor));
            var baseVolume = Number(API.utility.weiToEth(Math.abs(trade.amount * trade.price), trade.base.divisor));
            tickers[pair].quoteVolume += quoteVolume;
            tickers[pair].baseVolume += baseVolume;
            tickers[pair].percentChange = (price - firstOldPrices[pair]) / firstOldPrices[pair];
          } else {
            firstOldPrices[pair] = price;
          }
        }
      });
      console.log(tickers);
    } catch (err) {
      console.log(err)
    }
  });
}, true);
