if (process.argv.length>2) {
  global.network = String(process.argv[2]);
  console.log(global.network)
}
var API = require('./etherdelta.github.io/api.js');
var fs = require('fs');
var async = require('async');

fs.readFile('provider',{ encoding: 'utf8' }, function(err, data) {
  var provider = data;
  API.init(function(err,result){
    API.readStorage('storage_messagesCache', function(err, messages){
      async.each(
        Object.values(messages),
        function(message, callbackEach) {
          API.addOrderFromMessage(message, function(err, result){
            callbackEach(null);
          })
        },
        function(err) {
          API.saveOrders(function(err, result){
            console.log('Done')
          });
        }
      );
    });
  }, true, './etherdelta.github.io/', provider);
});
