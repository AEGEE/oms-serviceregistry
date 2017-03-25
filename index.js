var restify = require('restify');
var plugins = require('restify-plugins');
var yaml = require('js-yaml');
var fs   = require('fs');
var fetchModules = require('./fetchModules.js');

// Get document, or throw exception on errors
var composefile = yaml.safeLoad(fs.readFileSync('/usr/src/docker-compose.yml', 'utf8'));
var parsedFile = require('./parseLabels.js')(composefile);

const server = restify.createServer({
  name: 'serviceregistry',
  version: '1.0.0'
});

server.use(plugins.acceptParser(server.acceptable));
server.use(plugins.queryParser());
server.use(plugins.bodyParser());


server.get('/service/:name', function (req, res, next) {
	var service = parsedFile.services[req.params.name];
	if(service) {
		res.json({
			success: true,
			data: service
		});
		return next();
	}

	return next(new restify.NotFoundError({body:{
		success: false,
		message: "Service " + req.params.name + " not found"
	}}));
});

server.get('/category/:name', function(req, res, next) {
	var cat = parsedFile.categories[req.params.name];
	if(cat) {
		res.json({
			success: true,
			data: cat
		});
		return next();
	}
	return next(new restify.NotFoundError({body: {
		success: false,
		message: "No services in category " + req.params.name
	}}));
});

// TODO remove
server.get('/all', function(req, res, next) {
	res.json({
		success: true,
		data: parsedFile
	});
	return next();
});

server.get('/frontend', function(req, res, next) {
	fetchModules(parsedFile.modules).then((modules) => {
		res.json({
			success: true,
			data: modules
		});
		return next();
	}).catch((err) => {
		return next(new restify.InternalError({body:{
			success: false,
			error: err,
			message: "Could not fetch modules from services"
		}}));
	});
});

server.listen(7000, function () {
  console.log('%s listening at %s', server.name, server.url);
});