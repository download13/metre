/*
Idea for analytics system
Look at how hummingbird does it
Each meter type has set of viewers that make sense for it
Can also use a map function to change the data
Use measured
Support clustering, counter/gauges/etc reports that come in are named and combined

Dashboard with SVG or canvas graphs showing live data
Gauge showing a high and low
Map showing heatmap // Maybe use 2D 
RPS gauges/counters
Time graph
*/
var net = require('net');
var http = require('http');
var fs = require('fs');
var sw = require('simpleware');
var sse = require('./sse');

var dataString = {};
var conns = {};
function setData(name, d) {
	dataString[name] = d;
}
function setConns(name, c) {
	conns[name] = conns[name] || [];
	conns[name].push(c);
}

var app = sw.createRouter();
app.get('/', function(req, res) {
	fs.createReadStream('dashboard.html').pipe(res);
});
app.get(/\/stream\/([a-zA-Z0-9-_.]+)/, function(req, res) {
	var name = req.params[0];
	var c = sse.createConnection(req, res);
	setConns(name, c);
});

http.createServer(app).listen(8080, function() {
	console.log('HTTP Listening');
});

var server = net.createServer(function(c) {
	c.setEncoding('utf8');
	c.on('readable', function() {
		var length = parseInt(c.read(8), 16);
		var packet = c.read(length);
		var bp = packet.indexOf('/');
		var name = packet.substr(0, bp);
		var data = packet.substr(bp + 1);
		setData(name, data);

		console.log(name, Object.keys(dataString));
		conns[name] && conns[name].forEach(function(c) {
			c.send(dataString[name]);
		});
	});
	c.on('error', function(err) {
		console.log(err);
		c.destroy();
	});
});
server.on('error', function(err) {
	console.log(err);
	server.close();
}).listen(9781, function() {
	console.log('TCP Listening');
});
