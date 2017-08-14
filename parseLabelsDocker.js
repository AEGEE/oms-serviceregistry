var Docker = require('dockerode');


const parseFrontend = (line) => {
	var rules = line.split(";");
	var tmp = {
		host: '',
		path: ''
	};
	rules.forEach((item) => {
		var path = item.match(/^PathPrefix:(.*)/);
		if(path)
			tmp.path = path[1] + '';
	});

	var retval = tmp.path;
	return retval;
};

const parseCategories = (line) => {

	var cat = line.split(";");
	var retval = [];
	cat.forEach((item) => {
		var tmp = item.match(/^\((\w*), (-?\d*)\)/);
		retval.push({
			"name": tmp[1],
			"priority": parseInt(tmp[2])
		});
	});
	return retval;
};


module.exports = function(docker_path, callback) {
	var docker = new Docker({socketPath: docker_path});

	var services = {};
	var categories = {};
	var modules = [];

	docker.listContainers(function (err, containers) {
		containers.forEach((container) => {
			
			if(!container.Labels || !container.Labels['com.docker.compose.service'])
				return;

			var service = container.Labels['com.docker.compose.service'];
			var tmp = {
				name: service,
				categories: [],
				backend: '',
				port: 80,
				description: '',
				enabled: false
			};
			var service_modules = undefined;

			if(container.Labels['traefik.port'])
				tmp.port = parseInt(container.Labels['traefik.port']);
			if(container.Labels['traefik.frontend.rule'])
				tmp.frontend = parseFrontend(container.Labels['traefik.frontend.rule']);
			if(container.Labels['traefik.enable'])
				tmp.enabled = container.Labels['traefik.enable'] == 'true';
			// registry entries overwrite previous values
			if(container.Labels['registry.port'])
				tmp.port = parseInt(container.Labels['registry.port']);
			if(container.Labels['registry.frontend'])
				tmp.frontend = container.Labels['registry.frontend'];
			if(container.Labels['registry.enable'])
				tmp.enabled = container.Labels['registry.enable'] == 'true';
			if(container.Labels['registry.categories'])
				tmp.categories = parseCategories(container.Labels['registry.categories']);
			if(container.Labels['registry.backend'])
				tmp.backend = container.Labels['registry.backend']
			if(container.Labels['registry.description'])
				tmp.description = container.Labels['registry.description'];
			if(container.Labels['registry.modules'])
				service_modules = container.Labels['registry.modules'];

			tmp.backend_url = 'http://' + service + ':' + tmp.port + tmp.backend;
			tmp.frontend_url = tmp.frontend;

			services[service] = tmp;

			// Parse the modules into a seperate array
			if(service_modules) {
				modules.push({
					pages_url: tmp.backend_url + service_modules,
					url: tmp.frontend_url,
					servicename: tmp.name
				});
			}

			// Parse the categories into a seperate array
			tmp.categories.forEach((item) => {
				if(!categories[item.name])
					categories[item.name] = [];

				categories[item.name].push({
					name: tmp.name,
					enabled: tmp.enabled,
					description: tmp.description,
					backend: tmp.backend,
					frontend: tmp.frontend,
					priority: parseInt(item.priority)
				});
			});
		});

		// Sort the category data by priority
		for(var cat in categories) {
			if(!categories.hasOwnProperty(cat)) continue;

			categories[cat].sort((a, b) => {return b.priority - a.priority;});
		}

		return callback({
			services: services,
			categories: categories,
			modules: modules
		});
	});
}