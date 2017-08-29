const config = require('./config.json');
const request = require('request');

module.exports = function(module, service) {
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
      console.error("Could not log into core" err);
      return;
    }

    var token = body.data;

    const data = {
      name: module.name,
      code: module.code,
      base_url: module.url,
      pages: JSON.stringify(module.pages),
    };

    if(config.verbose_log)
      console.log("Registering " + service.name + " to the core");

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
        return;
      }

      var parsed_body;
      try {
        parsed_body = JSON.parse(body);
      } catch(_err) {
        console.error("Could not register module with core, core replied with faulty response");
        if(config.verbose_log){
          console.log("------------ Core response ----------");
          console.log(body);
        }
      }

      if(config.verbose_log)
        console.log("Handshake token: " + parsed_body.handshake_token);
    });

  });
}
