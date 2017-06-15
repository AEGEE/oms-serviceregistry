// As the core doesn't manage to integrate the new registry, we fake all registerMicroservice requests from the registry and pass a resulting api-key as a token to the storage
// TODO remove this whole file!

const mongoose = require('mongoose');
const config = require('./config.json');
const fetchModules = require('./fetchModules.js');
const fs = require('fs');
const request = require('request');


hackSchema = mongoose.Schema({
  instance: {type: String, default: config.instance},
  core_api_key: String
});

Hack = mongoose.model('Hack', hackSchema);

var registerStuff = function(parsedFile) {
  Hack.findOne().exec((err, res) => {
    if(err || res)
      return;
    console.log("Registering all the frontend pages for all modules");
    // We have to query the core :/ 
    fetchModules(parsedFile.modules).then((modules) => {
      // Add dummy module in case no module is there
      modules.push({
        url: "Get your shit going core!",
        name: "Really, this is bullshit!",
        code: "abcdefghijklmnop",
        pages: [],
        pages_url: ''
      });
      var secret = fs.readFileSync('/usr/src/shared/api-key', 'utf8');
      var api_key;
      modules.forEach((item) => {
        // Call the request to the core
        const data = {
          name: item.name,
          code: item.code,
          base_url: item.url,
          pages: JSON.stringify(item.pages),
        };

        console.log("Registering " + item.servicename);
        request({
          url: `http://omscore-nginx/api/registerMicroservice`,
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Api-Key': secret,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          form: data,
        }, function(err, res, body) {
          if(err) {
            console.log("Fock", err);
            return;
          }
          body = JSON.parse(body);
          console.log(body);
          if(!api_key) {
            api_key = body.handshake_token;
            console.log("Pirated api-key: " + api_key);
            h = new Hack({
              core_api_key: api_key
            });
            h.save();
          }
        });
      });
    }).catch((err) => {
      console.log("Could not fetch modules", err);
      return;
    });
  });
}

exports.registerStuff = function(parsedFile) {
  var readToken = function(parsedFile) {
    fs.readFile('/usr/src/shared/strapstate/omscore', (err, res) => {
        if(err) {
          setTimeout(readToken, 1000, parsedFile);
          console.log("Bootstrapping not yet finished");
        }
        else
          registerStuff(parsedFile);
    });
  }

  readToken(parsedFile);
}
exports.getToken = function(callback) {
  Hack.findOne().exec((err, res) => {
    callback(err, res);
  });
};