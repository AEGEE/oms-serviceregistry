var config = require('./config.json');
var request = require('request');
var fetch_modules = require('./fetchModules.js');

module.exports = function(parsedFile) {
  // Query each enabled service for its status
  parsedFile.services.forEach((item, index) => {  
    if(!item.enabled)
      return;

    if(!item.status_url) {
      fetch_modules(parsedFile, item, index);
      return;
    }

    parsedFile.services[index].up = false;
    var retries_left = config.ping_retries;
    if(config.log_verbose)
      console.log("Querying " + item.name + ' up to ' + retries_left + ' times on ' + item.status_url);

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
            setTimeout(query, config.ping_delay);
          }
          else {
            if(config.log_verbose) {
              console.log('Service ' + item.name + ' is unreachable');
            }
            parsedFile.services[index].up = false;
          } 
        } else {
          if(config.log_verbose) {
            console.log('Service ' + item.name + ' is reachable');
          }
          parsedFile.services[index].up = true;
          fetch_modules(parsedFile, item, index);
        }
      })
    }
    query();
  });

}