var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const async = require('async');
var moment = require('moment');
var mongo = require('mongodb');

var app = express();

app.use(express.static(__dirname ))
   .use(bodyParser.json())
   .use(cookieParser())
   .use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
      });
	  
app.post('/api/saveUserHistory', function(req, res) {
	
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://127.0.0.1:27017/obscurify";
	
	var historyInstance = {
		'shortTermArtistIDs' : req.body.shortTermArtistIDs,
		'shortTermTrackIDs' : req.body.shortTermTrackIDs,
		'formattedDate' : moment().format("MMM Do YY"),
		'dayOfYear' : moment().dayOfYear(),
		'year' : moment().year()
	};
	
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  
	  var userHistory = [];	  
	  var query = { "userID" : req.body.userID };
	  db.collection("users").find(query).toArray(function(err, result) {
		if (err) throw err;
		
		if(result.length == 0){
			userHistory.unshift(historyInstance);
		} 
		else{
			userHistory = result[0].userHistory;
			if(moment().year() > userHistory[0].year){
				userHistory.unshift(historyInstance);
			}
			else{
				var differenceInDays = moment().dayOfYear() - userHistory[0].dayOfYear;
				if(differenceInDays > 21){
					userHistory.unshift(historyInstance);
				}				
			}
		}
		
		db.collection("users").update(
			{userID : req.body.userID},
			{$set:
				{
					'email' : req.body.email,
					'country' : req.body.country,
					'longTermArtistIDs' : req.body.longTermArtistIDs,
					'longTermTrackIDs' : req.body.longTermTrackIDs,
					'obscurifyScore' : req.body.obscurifyScore,
					'longTermAudioFeatures' : req.body.longTermAudioFeatures,
					'userHistory' : userHistory
				}
			},
			{ upsert: true}
		)
		
	  });
	  
	  
	});
	
    res.json(
		{
			"status" : "ok!"
		}
	)
});


console.log('Listening on 8082');
app.listen(8082, '0.0.0.0');
