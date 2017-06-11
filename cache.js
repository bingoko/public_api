const bodyParser = require('body-parser');
const sha256 = require('sha256');
const app = require('express')();
const http = require('http').Server(app);
const compression = require('compression');
const request = require('request');

const hashes = {};
const pages = {};

const interval = 60 * 1000;
const api = 'https://api-main.etherdelta.com';

app.use(compression());
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
  const now = (new Date()).getTime();
  const page = '/returnTicker';
  if (pages[page] && now < pages[page].updated + interval) {
    res.json(pages[page].data);
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        res.json(pages[page].data);
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/events', (req, res) => {
  const now = (new Date()).getTime();
  const page = '/events';
  if (pages[page] && now < pages[page].updated + interval) {
    res.json(pages[page].data);
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        res.json(pages[page].data);
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/events/:nonce', (req, res) => {
  const now = (new Date()).getTime();
  const page = '/events';
  if (pages[page] && now < pages[page].updated + interval) {
    const result = pages[page].data;
    const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
    const nonce = `${page}/${req.params.nonce}`;
    if (hashes[nonce] !== hash) {
      hashes[nonce] = hash;
      res.json(result);
    } else {
      res.json(undefined);
    }
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        const result = pages[page].data;
        const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
        const nonce = `${page}/${req.params.nonce}`;
        if (hashes[nonce] !== hash) {
          hashes[nonce] = hash;
          res.json(result);
        } else {
          res.json(undefined);
        }
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/events/:nonce/:since', (req, res) => {
  const since = req.params.since;
  const now = (new Date()).getTime();
  const page = '/events';
  if (pages[page] && now < pages[page].updated + interval) {
    const initialEvents = pages[page].data.events;
    const filteredEvents = {};
    Object.keys(initialEvents).forEach((x) => {
      if (initialEvents[x].blockNumber >= since) {
        filteredEvents[x] = initialEvents[x];
      }
    });
    const result = { events: filteredEvents, blockNumber: pages[page].data.blockNumber };
    const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
    const nonce = `${page}/since/${req.params.nonce}`;
    if (hashes[nonce] !== hash) {
      hashes[nonce] = hash;
      res.json(result);
    } else {
      res.json(undefined);
    }
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        const initialEvents = pages[page].data.events;
        const filteredEvents = {};
        Object.keys(initialEvents).forEach((x) => {
          if (initialEvents[x].blockNumber >= since) {
            filteredEvents[x] = initialEvents[x];
          }
        });
        const result = { events: filteredEvents, blockNumber: pages[page].data.blockNumber };
        const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
        const nonce = `${page}/since/${req.params.nonce}`;
        if (hashes[nonce] !== hash) {
          hashes[nonce] = hash;
          res.json(result);
        } else {
          res.json(undefined);
        }
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/trades', (req, res) => {
  const now = (new Date()).getTime();
  const page = '/trades';
  if (pages[page] && now < pages[page].updated + interval) {
    res.json(pages[page].data);
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        res.json(pages[page].data);
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/orders', (req, res) => {
  const now = (new Date()).getTime();
  const page = '/orders';
  if (pages[page] && now < pages[page].updated + interval) {
    res.json(pages[page].data);
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        res.json(pages[page].data);
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/orders/:tokenA/:tokenB', (req, res) => {
  const now = (new Date()).getTime();
  const page = `/orders/${req.params.tokenA}/${req.params.tokenB}`;
  if (pages[page] && now < pages[page].updated + interval) {
    res.json(pages[page].data);
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        res.json(pages[page].data);
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/topOrders', (req, res) => {
  const now = (new Date()).getTime();
  const page = '/topOrders';
  if (pages[page] && now < pages[page].updated + interval) {
    res.json(pages[page].data);
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        res.json(pages[page].data);
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/topOrders/:nonce', (req, res) => {
  const now = (new Date()).getTime();
  const page = '/topOrders';
  if (pages[page] && now < pages[page].updated + interval) {
    const result = pages[page].data;
    const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
    const nonce = `${page}/${req.params.nonce}`;
    if (hashes[nonce] !== hash) {
      hashes[nonce] = hash;
      res.json(result);
    } else {
      res.json(undefined);
    }
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        const result = pages[page].data;
        const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
        const nonce = `${page}/${req.params.nonce}`;
        if (hashes[nonce] !== hash) {
          hashes[nonce] = hash;
          res.json(result);
        } else {
          res.json(undefined);
        }
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/orders/:nonce', (req, res) => {
  const now = (new Date()).getTime();
  const page = '/orders';
  if (pages[page] && now < pages[page].updated + interval) {
    const result = pages[page].data;
    const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
    const nonce = `${page}/${req.params.nonce}`;
    if (hashes[nonce] !== hash) {
      hashes[nonce] = hash;
      res.json(result);
    } else {
      res.json(undefined);
    }
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        const result = pages[page].data;
        const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
        const nonce = `${page}/${req.params.nonce}`;
        if (hashes[nonce] !== hash) {
          hashes[nonce] = hash;
          res.json(result);
        } else {
          res.json(undefined);
        }
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.get('/orders/:nonce/:tokenA/:tokenB', (req, res) => {
  const now = (new Date()).getTime();
  const page = `/orders/${req.params.tokenA}/${req.params.tokenB}`;
  if (pages[page] && now < pages[page].updated + interval) {
    const result = pages[page].data;
    const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
    const nonce = `${page}/${req.params.nonce}`;
    if (hashes[nonce] !== hash) {
      hashes[nonce] = hash;
      res.json(result);
    } else {
      res.json(undefined);
    }
  } else {
    request(`${api}${page}`, (error, response, body) => {
      try {
        const data = JSON.parse(body);
        pages[page] = {
          data,
          updated: (new Date()).getTime(),
        };
        const result = pages[page].data;
        const hash = sha256(JSON.stringify(result ? result : '')); // eslint-disable-line no-unneeded-ternary
        const nonce = `${page}/${req.params.nonce}`;
        if (hashes[nonce] !== hash) {
          hashes[nonce] = hash;
          res.json(result);
        } else {
          res.json(undefined);
        }
      } catch (err) {
        res.status(500);
        res.json('error');
      }
    });
  }
});

app.post('/message', (req, res) => {
  const page = '/message';
  request.post(`${api}${page}`, { form: req.body }, (error, response, body) => {
    try {
      res.json(JSON.parse(body));
    } catch (err) {
      res.json('failure');
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500);
  res.json({ error: 'An error occurred.' });
});

const port = process.env.PORT || 8001;
http.listen(port, () => {
  console.log(`listening on port ${port}`);
});
