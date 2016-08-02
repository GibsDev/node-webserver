var path = require('path');
var include = require('lb-include');
var express = require('express');
var articles = express.Router();

articles.get('/', function(req, res){
	include(path.join(__dirname, 'public', 'articles', 'articles.html'), {root:__dirname + '/public'}, function(err, markup){
		if(err) throw err;
		// TODO process html even more to add articles to it
		// TODO add a custom tag type and run code with js
		res.send(markup);
	});
});

articles.use(express.static('public'));

module.exports = articles;