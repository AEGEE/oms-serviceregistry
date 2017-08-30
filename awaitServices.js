var config = require('./config.json');
var request = require('request');
var fetch_modules = require('./fetchModules.js');

module.exports = function(parsedFile) {
  // Query each enabled service for its status
  parsedFile.services.forEach((item, index) => {  
    if(!item.enabled)
      return;

    parsedFile.services[index].up = false;
    var retries_left = config.ping_retries;
    var status_url = item.status_url;
    if(!status_url)
      status_url = item.backend_url + '/status';
    if(config.log_verbose)
      console.log("Querying " + item.name + ' up to ' + retries_left + ' times on ' + status_url);

    var query = () => {
      request(status_url, (err, res, body) => {
        try {
          body = JSON.parse(body);
        } catch(_err) {
          body = {success: false};
        }

        if(err || !body.success) {
        //if(err) {         // TODO also read the success message
          // If we still have retries left, retry fetching a second later
          if(retries_left > 0) {
            retries_left--;
            setTimeout(query, 1000);
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