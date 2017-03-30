var request = require('request');

module.exports = function(modules) {
	return new Promise((resolve, reject) => {

		if(modules.length === 0)
			return resolve([]);

		var counter = modules.length;
		modules.forEach((module, i) => {
			if(module.pages_url) {
				request(module.pages_url, (err, res, body) => {
					if(err) {
						console.log(err);
						modules[i].pages = [];
						modules[i].error = err;
					}
					else {
						try {
							body = JSON.parse(body);
						} catch(err) {
							console.log("Could not fetch frontend pages for " + modules[i].servicename, err);
							console.log(body);
							modules[i].pages = [];
							modules[i].error = err;
						}
						modules[i].pages = body.pages;
						modules[i].name = body.name;
						modules[i].code = body.code;
					}

					counter--;
					if(counter === 0) {
						return resolve(modules);
					}
				});
			}
		});

	});
};