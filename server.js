var restify = require('restify');
var plugins = require('restify-plugins');

module.exports = function(parsedFile) {
      var server = restify.createServer({
        name: 'serviceregistry',
        version: '1.0.0'
      });

      server.use(plugins.acceptParser(server.acceptable));
      server.use(plugins.queryParser());
      server.use(plugins.bodyParser());

      server.get('/status', function(req, res, next) {
        res.json({
          success: true
        });
        return next();
      })

      server.get('/services', function(req, res, next) {
        res.json({
          success: true,
          data: parsedFile.services
        });
        return next();
      });

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

      server.get('/categories', function(req, res, next) {
        res.json({
          success: true,
          data: parsedFile.categories
        });
        return next;
      })

      server.get('/categories/:name', function(req, res, next) {
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

      server.get('/frontends', function(req, res, next) {
        res.json({
          success: true,
          data: modules
        });
        return next();
      });

      server.listen(7000, function () {
        console.log('%s listening at %s', server.name, server.url);
      });

}