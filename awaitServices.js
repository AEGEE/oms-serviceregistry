var dirtyhack = require('./dirtyhack.js');
var config = require('./config.json');
var request = require('request');
var fetch_modules = require('./fetchModules.js')

module.exports = function(parsedFile) {
  // Query each enabled service for its status
  var service_log_msg = '';

  parsedFile.services.forEach((item, index) => {
    if(!item.enabled)
      return;
    parsedFile.services[index].up = false;
    var retries_left = config.ping_retries;

    var query = () => {
      request(item.status_url, (err, res, body) => {
        try {
          body = JSON.parse(body);
        } catch(_err) {
          body = {success: false};
        }

        if(err || !body.success) {
          // If we still have retries left, retry fetching a second later
          if(retries_left > 0) {
            retries_left--;
            timeout(query, 1000);
          }
          else {
            if(config.verbose_log) {
              console.log('Service ' + item.name + ' is unreachable');
            }
            parsedFile.services[index].up = false;
          } 
        } else {
          if(config.verbose_log) {
            console.log('Service ' + item.name + ' is reachable');
          }
          parsedFile.services[index].up = true;
          fetch_modules(parsedFile, item, index);
        }

      })
    }
    service_log_msg += ' ' + item.name;
    query();
  });

  if(config.verbose_log) {
    if(service_log_msg == '')
      service_log_msg = ' no services';
    console.log('Querying' + service_log_msg)
  }
}