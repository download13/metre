var net = require('net');
var url = require('url');
var measured = require('measured');

function createCollection(name, port, host) {
	return new SharedCollection(name, port, host);
}

function SharedCollection(name, port, host) {
	this.port = port;
	this.host = host;
	this.name = name;
	this.stats = measured.createCollection();
	this.queue = [];

	self = this;
	var s = net.createConnection(port, host, function() {
		self.socket = s;
	});
	s.on('error', function() {
		s.destroy();
		self.socket = null;
	});

	setInterval(this.send.bind(this), 1000);
}
SharedCollection.prototype = {
	send: function() {
		var data = this.name + '/' + JSON.stringify(this.stats);
		var s = this.socket;
		var q = this.queue;
		if(s) {
			s.write(data);
		}
	}
};

function createMiddleware(name, port, host) {
	var c = new SharedCollection(name, port, host);
	var s = c.stats;

	return function(req, res, next) {
		var path = req.path || url.parse(req.url).pathname;
		var orgEnd = res.end;
		var stopwatch = s.timer(path).start();
		res.end = function() {
			stopwatch.end();
			orgEnd.apply(res, arguments);
		}
		next();
	}
}

exports.createMiddleware = createMiddleware;