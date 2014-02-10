function createServer(opts) {
	opts = opts || {};
	var path = opts.path;

}

function createConnection(req, res) {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});
	return {
		send: function(data) {
			res.write('data: ' + data + '\n\n');
		},
		end: function() {
			res.end();
		}// on end event
	}
}

exports.createConnection = createConnection;