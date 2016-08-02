var path = require('path');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);
var include = require('lb-include');
var fs = require('fs');

var spyfall = require('./spyfall-server.js')(io);
var articles = require('./articles.js');

app.get('/', (req, res) => {
	include(path.join(__dirname, 'public', 'index.html'), {root:__dirname + '/public'}, (err, markup) => {
		if(err) throw err;
		res.send(markup);
	});
});

app.get('*.html', (req, res) => {
	include(path.join(__dirname, 'public', req.url), {root:__dirname + '/public'}, (err, markup) => {
		if(err) throw err;
		res.send(markup);
	});
});

app.use('/spyfall', spyfall);

app.use('/articles', articles);

// TODO html include thingy here

app.use(express.static('public'));

// TODO or html include thingy

app.get('*', (req, res) => {
	if(fs.existsSync(path.join(__dirname, 'public', req.url + '.html'))){
		include(path.join(__dirname, 'public', req.url + '.html'), {root:__dirname + '/public'}, (err, markup) => {
			if(err) throw err;
			res.status(404).send(markup)
		});
	} else {
		include(path.join(__dirname, 'public', '404.html'), {root:__dirname + '/public'}, (err, markup) => {
			if(err) throw err;
			res.status(404).send(markup)
		});
	}
});

server.listen(80);