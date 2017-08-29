var config = require('./config.json');
var parse = require('./parseLabelsDocker.js');
var server = require('./server.js');
var await_services = require('./awaitServices.js');

// Parse labels from the docker socket
parse(config.docker, (parsedFile) => {
	if(config.log_verbose) {
		console.log("Registry running with configuration:");
		console.log(parsedFile);
	}

	await_services(parsedFile);

	server(parsedFile);

});
