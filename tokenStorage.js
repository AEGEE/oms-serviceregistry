// The token storage stores and manages api keys and per-service tokens
// The global api-key expires after 100 days and will cause one failing request somewhen after that 
// (a service queries the storage with the old key, the storage will update the key and thus invalidate the old one)
// TODO: fix this by introducing crons
// Instance-tokens are only valid one day, as they are passed around a lot more often and thus are smaller

const mongoose = require('mongoose');
const config = require('./config.json');
const crypto = require('crypto');
const fs = require('fs');
const dirtyhack = require('./dirtyhack.js');

const storageSchema = mongoose.Schema({
  instance: String,
  api_key: String,
  started: {type: Date, default: Date.now(), expires: 8640000} // 100d
});

Storage = mongoose.model('Storage', storageSchema);


const tokenSchema = mongoose.Schema({
  created: {type: Date, default: Date.now(), expires: 86400}, // 1d
  x_api_key: {type: String, required: true, unique: true, index: true},
  name: String
}, {
  toObject: {virtuals: true},
  toJSON: {virtuals: true}
});

tokenSchema.virtual('expires')
.get(function () {
  return new Date(this.created.getTime() + 86400000);
})

Token = mongoose.model('Token', tokenSchema);




// Finds the storage object or creates one if not yet existing
const findInstance = function(callback) {
  Storage
  .findOne({instance: config.instance})
  .exec((err, res) => {
    if(err)
      return callback(err, null);

    // First time start, create an api key
    if(!res) {
      var api_key = (new Buffer(crypto.randomBytes(256)).toString('base64'));
      var s = new Storage({
        instance: config.instance,
        api_key: api_key
      });

      fs.writeFile(config.api_key, api_key, (err) => {
        if(err)
          return callback(err, null);
        s.save((err) => {
          if(err)
            return callback(err, null);
          console.log("Empty database, created new api-key");
          return callback(null, s);
        });
      });
    } else {
      // Otherwise just return the result
      return callback(null, res);
    }
  });
};

// Make sure there is an api-key after startup
findInstance((err, res) => {
  if(err)
    console.log("Could not initialize database", err);
});

exports.validateToken = function(token, callback) {
  Token.findOne({x_api_key: token}).exec((err, res) => {
    if(err)
      return callback(err, null);
    if(!res)
      return callback(new Error('Token not known to the registry, it might be expired'), null);
    return callback(null, res);
  });
};

exports.createToken = function(name, api_key, callback) {
  findInstance((err, storage) => {
    if(err)
      return callback(err, null);

    if(storage.api_key !== String(api_key))
      return callback(new Error('Mismatching api-key'), null);

    // Create a new token and store it in the DB
    var token = new Token({
      x_api_key: (new Buffer(crypto.randomBytes(64)).toString('base64')),
      name: name
    });

    // TODO remove next 2 lines
    dirtyhack.getToken((err, core_token) => {
      token.x_api_key = core_token.core_api_key;

      token.save((err) => {
        if(err)
          return callback(err, null);

        return callback(null, token);
      });
    });
  });
}