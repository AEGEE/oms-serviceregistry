var request = require('request');
var config = require('./config.json');
var register_page = require('./hack.js');

module.exports = function(parsedFile, service, index) {
	if(config.verbose_log)
		console.log("Querying " + service.name + " on " + service.modules_url);

	request(service.modules_url, (err, res, body) => {
		if(err) {
			console.error("Could not fetch modules for " + service.name, err);
			return;
		}

		try {
			body = JSON.parse(body);
		} catch(err) {
			console.error("Could not parse modules response from " + service.name, err);
			if(config.verbose_log) {
				console.log("------------------------------- Faulty response from " + service.name + " -----------------------------");
				console.log(body);
			}
			return;
		}

		module = {
			pages: body.pages,
			name: body.name,
			code: body.code,
			url: service.frontend_url
		};
		parsedFile.modules.push(module);

		// TODO remove as soon as hack is unnecessary
		register_page(module, service);
	});
}
