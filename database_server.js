var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var request = require('request');
var rp = require('request-promise');
const async = require('async');
var validator = require('validator');

var mongo = require('mongodb');

var app = express();

app.use(express.static(__dirname ))
   .use(cookieParser())
   .use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
      });
	  
app.get('/api/getData', function(req, res) {
	
	//var MongoClient = require('mongodb').MongoClient;
	//var url = "mongodb://localhost:27017/obscurify";

	
    res.json(
		{
			"status" : "ok"
		}
	)
});


console.log('Listening on 8082');
app.listen(8082, '0.0.0.0');
