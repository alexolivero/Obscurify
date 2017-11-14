var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('/etc/letsencrypt/live/obscurifymusic.com/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/obscurifymusic.com/fullchain.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const async = require('async');
var moment = require('moment');
var mongo = require('mongodb');

var obscurify_secret = process.argv[2];

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
	
	if(req.body.email == null ||
		req.body.country == null ||
		req.body.longTermArtistIDs == null ||
		req.body.longTermTrackIDs == null ||
		req.body.obscurifyScore == null ||
		req.body.longTermAudioFeatures == null ||
		req.body.obscurify_secret != obscurify_secret //this file and spotify_data_server.js should have the same obscurify_secret
		){
			return res.send({"status" : "no WAY DUDE!!"});
	}
	
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
	
    return res.json(
		{
			"status" : "ok!"
		}
	)
});
	  
app.get('/api/getObscurifyData', function(req, res) {
	
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://127.0.0.1:27017/obscurify";
	
	if(req.query.obscurifyScore == undefined || req.query.obscurifyScore == undefined){
		return res.send({"status" : "uh oh"});
	}
	
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var mySort = { obscurifyScore: -1 };
	  db.collection("users").find({}, { 
			//only supposed to specify what you DON'T want returned
			_id: false,
			userID: false,
			email: false,
			//country: true,
			longTermArtistIDs:false,
			longTermTrackIDs:false,
			//obscurifyScore:true,
			//longTermAudioFeatures:true,
			userHistory:false
		}).sort(mySort).toArray(function(err, result) {
		if (err) throw err;
		
		var obscurifyScores = []; //only includes scores from the user's country
		var globalAverageScore = 0;
		var percentileByCountry = 0;
		var audioFeatureAverages = {
			'danceability' : 0,
			'energy' : 0,
			'happiness' : 0,
			'acousticness' : 0
		};
		
		for(var i = 0; i < result.length; i++){
			globalAverageScore += result[i].obscurifyScore;
			
			if(result[i].country == req.query.country){
				obscurifyScores.push(result[i].obscurifyScore);
				
				audioFeatureAverages.danceability += result[i].longTermAudioFeatures.danceability;
				audioFeatureAverages.energy += result[i].longTermAudioFeatures.energy;
				audioFeatureAverages.happiness += result[i].longTermAudioFeatures.happiness;
				audioFeatureAverages.acousticness += result[i].longTermAudioFeatures.acousticness;
			}			
		}
		globalAverageScore /= result.length;
		
		
		if(obscurifyScores.length == 0){
			percentileByCountry = 100;
			audioFeatureAverages.danceability = 0.57;
			audioFeatureAverages.energy = 0.65;
			audioFeatureAverages.happiness = 0.45;
			audioFeatureAverages.acousticness = 0.22; //values pulled from obscurify 1.0 global averages
			
		} else{
			var scoreIndex = -1;
			for(var i = 0; i < obscurifyScores.length; i++){
				if(req.query.obscurifyScore >= obscurifyScores[i]){
					scoreIndex = i;
					break;
				}
			}
			if(scoreIndex != -1){
				percentileByCountry = (scoreIndex/obscurifyScores.length)*100;
			}
			
			audioFeatureAverages.danceability /= obscurifyScores.length;
			audioFeatureAverages.energy /= obscurifyScores.length;
			audioFeatureAverages.happiness /= obscurifyScores.length;
			audioFeatureAverages.acousticness /= obscurifyScores.length;
		}

		res.send(
			{
				"percentileByCountry" : percentileByCountry,
				"globalAverageScore" : globalAverageScore,
				"totalUserCount" : result.length,
				"userCountByCountry" : obscurifyScores.length,
				"audioFeatureAverages" : audioFeatureAverages
			}
		)
		db.close();
	  });
	});
	 
});

//console.log('Listening on 8082');
//app.listen(8082, '0.0.0.0');

var httpsServer = https.createServer(credentials, app);
console.log('Listening on 8445');
httpsServer.listen(8445);

