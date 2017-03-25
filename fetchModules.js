var request = require('request');

module.exports = function(modules) {
	return new Promise((resolve, reject) => {

		if(modules.length === 0)
			return resolve([]);

		var counter = modules.length;
		modules.forEach((module, i) => {
			request(module.pages_url, (err, res, body) => {
				delete modules[i].pages_url;
				if(err) {
					console.log(err);
					modules[i].pages = [];
					modules[i].error = err;
				}
				else {
					try {
						modules[i].pages = JSON.parse(body);
						if(!Array.isArray(modules[i].pages)) {
							console.log("Response from service was no array");
							modules[i].pages = [];
							modules[i].error = "Response from service was no array";
						}
					} catch(e) {
						console.log(e);
						modules[i].pages = [];
						modules[i].error = e;
					}
				}

				counter--;
				if(counter === 0) {
					return resolve(modules);
				}
			});
		});
	});
};