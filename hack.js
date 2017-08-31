const config = require('./config.json');
const request = require('request');
const fs = require('fs');

module.exports = function(module, service) {

  var query_token = function(error_callback, success_callback) {
    fs.readFile("/usr/src/shared/api-key", 'utf-8', function(err, token) {
      if(err || !token) {
        if(config.log_verbose)
          console.log("No token read from file");
        return error_callback();;
      }

      const data = {
        name: module.name,
        code: module.code,
        base_url: module.url,
        pages: JSON.stringify(module.pages),
      };

      if(config.log_verbose)
        console.log("Registering " + service.name + " to the core with api-key " + token);

      request({
        url: config.hack.core_url + '/api/microservice/register',
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Api-Key': token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: data,
      }, (err, res, body) => {

        if(err) {
          console.error("Could not register module with core", err);
          return error_callback();
        }

        var parsed_body;
        try {
          parsed_body = JSON.parse(body);
        } catch(_err) {
          console.error("Could not register module with core, core replied with faulty response");
          if(config.log_verbose){
            console.log("------------ Core response ----------");
            console.log(body);
          }
          return error_callback();
        }

        if(!parsed_body.handshake_token) {
          if(config.log_verbose)
            console.log("Core did not send a handshake token", parsed_body)
          return error_callback();
        }

        console.log("Successfully registered " + service.name + " to the core");
        if(config.log_verbose)
          console.log("Handshake token: " + parsed_body.handshake_token);
        return success_callback();
      });
    })
  }

  var query_login = function(error_callback, success_callback) {
     
    request.post({
      url: config.hack.core_url + '/api/login',
      method: 'POST',
      json: true,
      body: {
        username: config.hack.username,
        password: config.hack.password
      }
    }, (err, res, body) => {
      if(err) {
        if(config.log_verbose)
          console.log("Could not log into core", err);
        return error_callback();;
      }
      var token = body.data;
      if(!token) {
        if(config.log_verbose)
          console.log("No token received from core");
        return error_callback();;
      }

      const data = {
        name: module.name,
        code: module.code,
        base_url: module.url,
        pages: JSON.stringify(module.pages),
      };

      if(config.log_verbose)
        console.log("Registering " + service.name + " to the core with auth-token " + token);

      request({
        url: config.hack.core_url + '/api/microservice/register',
        method: 'POST',
        headers: {
          'X-Auth-Token': token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: data,
      }, (err, res, body) => {

        if(err) {
          console.error("Could not register module with core", err);
          return error_callback();
        }

        var parsed_body;
        try {
          parsed_body = JSON.parse(body);
        } catch(_err) {
          console.error("Could not register module with core, core replied with faulty response");
          if(config.log_verbose){
            console.log("------------ Core response ----------");
            console.log(body);
          }
          return error_callback();
        }

        if(config.log_verbose)
          console.log("Handshake token: " + parsed_body.handshake_token);
        return success_callback();
      });
    });
  };

  var retries = 50;
  var rescue = function() {
    if(retries > 0) {
      retries--;
      // Try both with login and token to register the microservice to the core
      if(retries%2)
        setTimeout(query_token, 1000, rescue, () => {});
      else
        setTimeout(query_login, 1000, rescue, () => {});
    } else {
      console.error("Could not register " + service.name + " to the core");
    }
  }

  rescue();
 
}
