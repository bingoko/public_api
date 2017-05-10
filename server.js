const API = require('./etherdelta.github.io/api.js');
const bodyParser = require('body-parser');
const async = require('async');
const fs = require('fs');
const sha256 = require('sha256');
const app = require('express')();
const http = require('http').Server(app);

let returnTickerData = { result: undefined };
let tradesData = { result: undefined };
const hashes = {};
let topOrders = [];
let ordersByPair = {};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => {
  res.redirect('https://etherdelta.github.io');
});

app.get('/returnTicker', (req, res) => {
  res.json(returnTickerData.result);
});

app.get('/events', (req, res) => {
  const result = { events: API.eventsCache, blockNumber: API.blockTimeSnapshot.blockNumber };
  res.json(result);
});

app.get('/events/:nonce', (req, res) => {
  const result = { events: API.eventsCache, blockNumber: API.blockTimeSnapshot.blockNumber };
  const eventsHash = sha256(JSON.stringify(result.events ? result.events : ''));
  const nonce = `events${req.params.nonce}`;
  if (hashes[nonce] !== eventsHash) {
    hashes[nonce] = eventsHash;
    res.json(result);
  } else {
    res.json(undefined);
  }
});

app.get('/events/:nonce/:since', (req, res) => {
  const since = req.params.since;
  const events = {};
  Object.keys(API.eventsCache).forEach((id) => {
    if (API.eventsCache[id].blockNumber >= since) {
      events[id] = API.eventsCache[id];
    }
  });
  const result = { events, blockNumber: API.blockTimeSnapshot.blockNumber };
  const eventsHash = sha256(JSON.stringify(result.events ? result.events : ''));
  const nonce = `eventsSince${req.params.nonce}`;
  if (hashes[nonce] !== eventsHash) {
    hashes[nonce] = eventsHash;
    res.json(result);
  } else {
    res.json(undefined);
  }
});

app.get('/trades', (req, res) => {
  res.json(tradesData.result);
});

app.get('/orders', (req, res) => {
  const result = { orders: API.ordersCache, blockNumber: API.blockTimeSnapshot.blockNumber };
  res.json(result);
});

app.get('/orders/:tokenA/:tokenB', (req, res) => {
  const { tokenA, tokenB } = req.params;
  const pair = `${tokenA}/${tokenB}`;
  if (!ordersByPair[pair]) {
    ordersByPair[pair] = API.getOrdersByPair(tokenA, tokenB);
  }
  const result = { orders: ordersByPair[pair], blockNumber: API.blockTimeSnapshot.blockNumber };
  res.json(result);
});

app.get('/topOrders', (req, res) => {
  const result = { orders: topOrders, blockNumber: API.blockTimeSnapshot.blockNumber };
  res.json(result);
});

app.get('/topOrders/:nonce', (req, res) => {
  const result = { orders: topOrders, blockNumber: API.blockTimeSnapshot.blockNumber };
  const ordersHash = sha256(JSON.stringify(result.orders ? result.orders : ''));
  const nonce = `topOrders${req.params.nonce}`;
  if (hashes[nonce] !== ordersHash) {
    hashes[nonce] = ordersHash;
    res.json(result);
  } else {
    res.json(undefined);
  }
});

app.get('/orders/:nonce', (req, res) => {
  const result = { orders: API.ordersCache, blockNumber: API.blockTimeSnapshot.blockNumber };
  const ordersHash = sha256(JSON.stringify(result.orders ? result.orders : ''));
  const nonce = `orders${req.params.nonce}`;
  if (hashes[nonce] !== ordersHash) {
    hashes[nonce] = ordersHash;
    res.json(result);
  } else {
    res.json(undefined);
  }
});

app.get('/orders/:nonce/:tokenA/:tokenB', (req, res) => {
  const { tokenA, tokenB } = req.params;
  const nonce = `ordersPair${req.params.nonce}`;
  const pair = `${tokenA}/${tokenB}`;
  if (!ordersByPair[pair]) {
    ordersByPair[pair] = API.getOrdersByPair(tokenA, tokenB);
  }
  const result = { orders: ordersByPair[pair], blockNumber: API.blockTimeSnapshot.blockNumber };
  const ordersHash = sha256(JSON.stringify(result.orders ? result.orders : ''));
  if (hashes[nonce] !== ordersHash) {
    hashes[nonce] = ordersHash;
    res.json(result);
  } else {
    res.json(undefined);
  }
});

app.post('/message', (req, res) => {
  try {
    const message = JSON.parse(req.body.message);
    API.addOrderFromMessage(message, (err) => {
      if (!err) {
        res.json('success');
      } else {
        res.json('failure');
      }
    });
  } catch (err) {
    res.json('failure');
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500);
  res.json({ error: 'An error occurred.' });
});

function updateData() {
  API.logs((errLogs) => {
    if (!errLogs) {
      async.each(
        Object.values(API.eventsCache),
        (event, callbackEach) => {
          API.addOrderFromEvent(event, () => {
            callbackEach(null);
          });
        },
        () => {
          async.parallel(
            [
              (callback) => {
                // refresh stale orders
                let ids = Object.keys(API.ordersCache).filter(
                  x => new Date() - new Date(API.ordersCache[x].updated) > 14 * 1000);
                ids = ids.sort(
                  (a, b) =>
                    new Date(API.ordersCache[a].updated) - new Date(API.ordersCache[b].updated));
                ids = ids.slice(0, 500);
                ids = ids.concat(Object.keys(API.ordersCache)
                  .filter(x => !API.ordersCache[x].updated));
                async.each(
                  ids,
                  (id, callbackEach) => {
                    API.updateOrder(API.ordersCache[id], (err) => {
                      if (err) delete API.ordersCache[id];
                      callbackEach(null);
                    });
                  },
                  () => {
                    callback(null, undefined);
                  });
              },
              (callback) => {
                API.getTrades((err, result) => {
                  if (!err) {
                    const now = new Date();
                    const trades = result.trades
                      .map((x) => {
                        if (x.token && x.base && x.base.name === 'ETH') {
                          if (x.amount > 0) {
                            return {
                              pair: `${x.token.name}-${x.base.name}`,
                              rate: x.price,
                              amount: API.utility.weiToEth(x.amount, API.getDivisor(x.token)),
                              type: 'buy',
                              date: API.blockTime(x.blockNumber),
                            };
                          }
                          return {
                            token: `${x.token.name}-${x.base.name}`,
                            rate: x.price,
                            amount: API.utility.weiToEth(-x.amount, API.getDivisor(x.token)),
                            type: 'sell',
                            date: API.blockTime(x.blockNumber),
                          };
                        }
                        return undefined;
                      })
                      .filter(x => x && now - x.date < 86400 * 10 * 1000);
                    trades.sort((a, b) => b.date - a.date);
                    tradesData = { updated: Date.now(), result: trades };
                  }
                  callback(null, undefined);
                });
              },
              (callback) => {
                API.returnTicker((err, result) => {
                  if (!err) {
                    returnTickerData = { updated: Date.now(), result };
                  }
                  callback(null, undefined);
                });
              },
            ],
            () => {
              topOrders = API.getTopOrders();
              ordersByPair = {};
              API.saveOrders(() => {
                setTimeout(updateData, 10 * 1000);
              });
            });
        });
    }
  }, 43200); // one week of data
}

fs.readFile('provider', { encoding: 'utf8' }, (err, data) => {
  const provider = data;
  const configName = process.argv.length > 2 ? process.argv[2] : undefined;
  API.init(
    () => {
      updateData();
      const port = process.env.PORT || 3000;
      http.listen(port, () => {
        console.log(`listening on port ${port}`);
      });
    },
    false,
    './etherdelta.github.io/',
    provider, configName);
});
