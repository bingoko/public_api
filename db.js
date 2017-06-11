const bodyParser = require('body-parser');
const app = require('express')();
const http = require('http').Server(app);
const async = require('async');
const fs = require('fs');
const compression = require('compression');

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let messages = {};
let orders = {};
let events = {};

try {
  messages = JSON.parse(fs.readFileSync('storage_messagesCache', 'utf8'));
} catch (err) {
  console.log('Messages storage file not found');
}
try {
  orders = JSON.parse(fs.readFileSync('storage_ordersCache', 'utf8'));
} catch (err) {
  console.log('Orders storage file not found');
}
try {
  events = JSON.parse(fs.readFileSync('storage_eventsCache', 'utf8'));
} catch (err) {
  console.log('Events storage file not found');
}

app.get('/', (req, res) => {
  res.redirect('https://etherdelta.github.io');
});

app.post('/addMessage', (req, res) => {
  try {
    messages[req.body.id] = JSON.parse(req.body.message);
    res.json('success');
  } catch (err) {
    res.json('failure');
  }
});

app.post('/addEvent', (req, res) => {
  try {
    events[req.body.id] = JSON.parse(req.body.event);
    res.json('success');
  } catch (err) {
    res.json('failure');
  }
});

app.post('/addOrder', (req, res) => {
  try {
    orders[req.body.id] = JSON.parse(req.body.order);
    res.json('success');
  } catch (err) {
    res.json('failure');
  }
});

app.get('/messages', (req, res) => {
  try {
    res.json(messages);
  } catch (err) {
    res.json({});
  }
});

app.get('/events', (req, res) => {
  try {
    res.json(events);
  } catch (err) {
    res.json({});
  }
});

app.get('/orders', (req, res) => {
  try {
    res.json(orders);
  } catch (err) {
    res.json({});
  }
});

app.post('/removeMessage', (req, res) => {
  try {
    delete messages[req.body.id];
    res.json('success');
  } catch (err) {
    res.json('failure');
  }
});

app.post('/removeEvent', (req, res) => {
  try {
    delete events[req.body.id];
    res.json('success');
  } catch (err) {
    res.json('failure');
  }
});

app.post('/removeOrder', (req, res) => {
  try {
    delete orders[req.body.id];
    res.json('success');
  } catch (err) {
    res.json('failure');
  }
});

async.forever(
  (next) => {
    console.log('Saving database');
    async.parallel(
      [
        (cb) => {
          fs.writeFile('storage_messagesCache', JSON.stringify(messages), () => {
            cb();
          });
        },
        (cb) => {
          fs.writeFile('storage_eventsCache', JSON.stringify(events), () => {
            cb();
          });
        },
        (cb) => {
          fs.writeFile('storage_ordersCache', JSON.stringify(orders), () => {
            cb();
          });
        }],
      () => {
        setTimeout(() => { next(); }, (60 * 1000));
      });
  },
  () => {
    console.log('Failed to save databases');
    process.exit();
  });

const port = process.env.PORT || 8001;
http.listen(port, () => {
  console.log(`listening on port ${port}`);
});
