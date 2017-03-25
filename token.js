const fs = require('fs');
const config = require('./config.json');
const crypto = require('crypto');
const restify = require('restify');


const api_key = (new Buffer(crypto.randomBytes(256)).toString('base64'));

var token = [];

exports.validateToken = function(req, res, next) {
	var found = token.find((item) => {
		return item.expires > (new Date()) && item.instance_key == req.body.instance_key;
	});

	var valid = found === undefined;

	res.json({
		success: true,
		data: {
			valid: valid,
			expires: found.expires,
			name: found.name
		}
	});


	return next();
};

exports.createToken = function(req, res, next) {
	if(req.body.api_key != api_key) {
		return next(new restify.ForbiddenError({body:{
			success: false,
			message: "Wrong api key provided"
		}}));
	}

	var expires = new Date();
	expires.setDate(expires.getDate() + 1);
	var newtoken = {
		instance_key: (new Buffer(crypto.randomBytes(64)).toString('base64')),
		expires: expires,
		name: req.body.name
	};

	// "save" token
	token.push(newtoken);

	res.json({
		success: true,
		data: newtoken
	});
	return next();
};

exports.writeTokenFile = function() {
	fs.writeFile(config.api_key, api_key, (err) => {
		if (err) throw err;
	});
};