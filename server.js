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

app.get('/', function(req, res){
	include(path.join(__dirname, 'public', 'index.html'), {root:__dirname + '/public'}, function(err, markup){
		if(err) throw err;
		res.send(markup);
	});
});

app.get('*.html', function(req, res){
	include(path.join(__dirname, 'public', req.url), {root:__dirname + '/public'}, function(err, markup){
		if(err) throw err;
		res.send(markup);
	});
});

spyfall.get('/rules', function(req, res){
	include(path.join(__dirname, 'public', 'spyfall', 'rules.html'), {root:__dirname + '/public'}, function(err, markup){
		if(err) throw err;
		res.send(markup);
	});
});

app.use('/spyfall', spyfall);

app.use('/articles', articles);

app.use(express.static('public'));

app.get('*', function(req, res){
	if(fs.existsSync(path.join(__dirname, 'public', req.url + '.html'))){
		include(path.join(__dirname, 'public', req.url + '.html'), {root:__dirname + '/public'}, function(err, markup){
			if(err) throw err;
			res.status(404).send(markup)
		});
	} else {
		include(path.join(__dirname, 'public', '404.html'), {root:__dirname + '/public'}, function(err, markup){
			if(err) throw err;
			res.status(404).send(markup)
		});
	}
});

server.listen(80);