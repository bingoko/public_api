if (process.argv.length>2) {
  global.network = String(process.argv[2]);
  console.log(global.network)
}
var API = require('./etherdelta.github.io/api.js');
var bodyParser = require('body-parser');
var async = require('async');
var fs = require('fs');
var sha256 = require('sha256');
var app = require('express')();
var http = require('http').Server(app);

var lastOrdersHash = {};
var returnTickerData = {result: undefined};
var ordersData = {result: undefined};
var tradesData = {result: undefined};

// var q = async.priorityQueue(function(task, callback) {
//   task(callback);
// }, 1);

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({extended: true}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res){
  res.redirect('https://etherdelta.github.io')
});

app.get('/returnTicker', function(req, res){
  res.json(returnTickerData.result);
});

app.get('/trades', function(req, res){
  res.json(tradesData.result);
});

app.get('/orders', function(req, res){
  res.json(ordersData.result);
});

app.get('/orders/:nonce', function(req, res){
  var ordersHash = sha256(JSON.stringify(ordersData.result ? ordersData.result.orders : ''));
  var nonce = req.params.nonce;
  if (lastOrdersHash[nonce] != ordersHash) {
    lastOrdersHash[nonce] = ordersHash;
    res.json(ordersData.result);
  } else {
    res.json(undefined);
  }
});

app.post('/message', function(req, res){
  try {
    var message = JSON.parse(req.body.message);
    API.saveMessage(message, function(err, result){
      res.json('success');
    });
  } catch(err) {
    res.json('failure');
  }
});

app.use(function(err, req, res, next){
  console.error(err);
  res.status(500);
  res.json({'error': 'An error occurred.'});
});

function updateData() {
  console.log('Getting logs')
  API.logs(function(err, result){
    if (!err) console.log('Got logs')
    if (!err) {
      try {
        async.parallel(
          [
            function(callback) {
              console.log('Getting orders')
              API.getOrders(function(err, result){
                if (!err) console.log('Got orders')
                if (!err) {
                  ordersData = {updated: Date.now(), result: result};
                }
                callback(null, undefined);
              });
            },
            function(callback) {
              console.log('Getting trades')
              API.getTrades(function(err, result){
                if (!err) console.log('Got trades')
                if (!err) {
                  var now = new Date();
                  var trades = result.trades.map(x => {
                    if (x.token && x.base && x.base.name=="ETH") {
                      if (x.amount>0) {
                        return {pair: x.token.name+"-"+x.base.name, rate: x.price, amount: API.utility.weiToEth(x.amount, API.getDivisor(x.token)), type: "buy", date: API.blockTime(x.blockNumber)}
                      } else {
                        return {token: x.token.name+"-"+x.base.name, rate: x.price, amount: API.utility.weiToEth(-x.amount, API.getDivisor(x.token)), type: "sell", date: API.blockTime(x.blockNumber)}
                      }
                    } else {
                      return undefined;
                    }
                  })
                  .filter(x => x && now-x.date<86400*10*1000);
                  trades.sort((a,b) => b.date-a.date);
                  tradesData = {updated: Date.now(), result: trades};
                }
                callback(null, undefined);
              });
            },
            function(callback) {
              console.log('Getting return ticker')
              API.returnTicker(function(err, result){
                if (!err) console.log('Got return ticker')
                if (!err) {
                  returnTickerData = {updated: Date.now(), result: result};
                }
                callback(null, undefined);
              });
            }
          ],
          function(err, result) {
            setTimeout(updateData, 10*1000);
          }
        );
      } catch (err) {
        console.log('err', err)
      }
    }
  });
}

fs.readFile('provider',{ encoding: 'utf8' }, function(err, data) {
  var provider = data;
  API.init(function(err,result){
    updateData();
    var port = process.env.PORT || 3000;
    http.listen(port, function(){
      console.log('listening on port '+port);
    });
  }, true, './etherdelta.github.io/', provider);
});
