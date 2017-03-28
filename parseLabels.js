
const parseFrontend = (line) => {
	var found = line.match(/^traefik\.frontend\.rule=(.*)$/);
	if(found) {
		var rules = found[1].split(";");
		var tmp = {
			host: '',
			path: ''
		};
		rules.forEach((item) => {
			var host = item.match(/^Host:(.*)/);
			if(host)
				tmp.host = host[1];

			var path = item.match(/^PathPrefix:(.*)/);
			if(path)
				tmp.path = path[1] + '';
		});

		var retval = tmp.host + tmp.path;
		return retval;
	}

	return undefined;
};

const parseEnabled = (line) => {
	var found = line.match(/^traefik\.enable=(.*)$/);
	if(found) {
		return (found[1] == 'true');
	}

	return undefined;
};

const parsePort = (line) => {
	var found = line.match(/^traefik\.port=(\d*)$/);
	if(found) {
		return parseInt(found[1]);
	}

	return undefined;
};

const parseCategories = (line) => {

	var found = line.match(/^registry.categories=((\([^\(\)]*\);)*\([^\(\)]*\))$/);
	if(found) {
		var cat = found[1].split(";");
		var retval = [];
		cat.forEach((item) => {
			var tmp = item.match(/^\((\w*), (-?\d*)\)/);
			retval.push({
				"name": tmp[1],
				"priority": parseInt(tmp[2])
			});
		});
		return retval;
	}

	return undefined;
};

const parseBackend = (line) => {

	var found = line.match(/^registry\.backend=(.*)$/);
	if(found) {
		return found[1];
	}

	return undefined;
};

const parseDescription = (line) => {

	var found = line.match(/^registry\.description=(.*)$/);
	if(found) {
		return found[1];
	}

	return undefined;
};

const parseModules = (line) => {

	var found = line.match(/^registry\.modules=(.*)$/);
	if(found) {
		return found[1];
	}
	return undefined;
};


module.exports = function(data) {
	var services = {};
	var categories = {};
	var modules = [];
	var attachements = [];

	// Read the label data into an object
	for(var service in data.services) {
		if(!data.services.hasOwnProperty(service)) continue;

		if(data.services[service].labels) {
			var tmp = {
				name: service,
				categories: [],
				backend: '',
				port: 80,
				description: '',
				enabled: false
			};

			var module = undefined;
			data.services[service].labels.forEach((item) => {
				var frontend = parseFrontend(item);
				if(frontend)
					tmp.frontend = frontend;

				var enabled = parseEnabled(item);
				if(enabled)
					tmp.enabled = enabled;

				var categories = parseCategories(item);
				if(categories)
					tmp.categories = categories;

				var backend = parseBackend(item);
				if(backend)
					tmp.backend = backend;

				var description = parseDescription(item);
				if(description)
					tmp.description = description;

				var port = parsePort(item);
				if(port)
					tmp.port = port;

				module = parseModules(item);
			});

			tmp.backend_url = 'http://' + service + ':' + tmp.port + tmp.backend + '/';
			tmp.frontend_url = 'http://' + tmp.frontend + '/';
			services[service] = tmp;

			if(module) {
				modules.push({
					pages_url: tmp.backend_url + module,
					url: tmp.frontend_url,
					servicename: tmp.name
				});
			}
		}
	}

	// Parse the categories from the read data
	for(var service in services) {
		if(!services.hasOwnProperty(service)) continue;

		const cur = services[service];
		cur.categories.forEach((item) => {
			if(!categories[item.name])
				categories[item.name] = [];

			categories[item.name].push({
				name: cur.name,
				enabled: cur.enabled,
				description: cur.description,
				backend: cur.backend,
				frontend: cur.frontend,
				priority: parseInt(item.priority)
			});
		});
	}

	// Sort the category data by priority
	for(var cat in categories) {
		if(!categories.hasOwnProperty(cat)) continue;

		categories[cat].sort((a, b) => {return b.priority - a.priority;});
	}

	return {
		services: services,
		categories: categories,
		modules: modules
	};
};