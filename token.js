const restify = require('restify');
const storage = require('./tokenStorage.js');

exports.validateToken = function(req, res, next) {
	storage.validateToken(req.body.x_api_key, (err, found) => {
		if(err) {
			console.log("Could not fetch token from db", err);
			res.json({
				success: false,
				message: err.message
			});
			return next();
		}

		found = found.toObject();
		delete found._id;
		delete found.__v;
		delete found.id;
		res.json({
			success: true,
			data: found
		});
		return next();
	});
};

exports.createToken = function(req, res, next) {
	storage.createToken(req.body.name, req.body.api_key, (err, token) => {
		if(err) {
			res.json({
				success: false,
				message: err.message
			});
			return next();
		}

		token = token.toObject();
		delete token._id;
		delete token.__v;
		delete token.id;
		res.json({
			success: true,
			data: token
		});
		return next();
	});
};