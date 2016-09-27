var API = require('./etherdelta.github.io/api.js');
var app = require('express')();
var http = require('http').Server(app);

var returnTickerData = undefined;

app.get('/returnTicker', function(req, res){
  if (!returnTickerData || Date.now()-returnTickerData.updated>1000*5*1) {
    returnTicker(function(result){
      returnTickerData = {updated: Date.now(), result: result};
      res.json(returnTickerData.result);
    })
  } else {
    res.json(returnTickerData.result);
  }
});

API.init(function(err,result){
  var port = process.env.PORT || 3000;
  http.listen(port, function(){
    console.log('listening on port '+port);
  });
}, true, './etherdelta.github.io/');

function returnTicker(callback) {
  var tickers = {};
  var firstOldPrices = {};
  API.logs(function(err, result){
    API.getTrades(function(err, result){
      var trades = result.trades;
      trades.sort(function(a,b){return a.blockNumber-b.blockNumber});
      trades.forEach(function(trade){
        if (trade.token && trade.base && trade.base.name=='ETH') {
          var pair = trade.base.name+'_'+trade.token.name;
          if (!tickers[pair]) {
            tickers[pair] = {"last":undefined,"percentChange":0,
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
      callback(tickers);
    });
  });
}
