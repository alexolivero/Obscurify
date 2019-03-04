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

	if(req.body.country == null ||
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

	  //db.close();
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

	if(req.query.obscurifyScore == undefined ||
		req.query.country == undefined ||
		req.query.obscurify_secret != obscurify_secret
		){
		return res.send({"status" : "uh oh"});
	}


	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;

    var audioFeatureAverages = {
      'danceability' : 0,
      'energy' : 0,
      'happiness' : 0,
      'acousticness' : 0
    };
    var percentileByCountry = 0;


    db.collection("report").find({code : req.query.country}, {}).toArray(function(err, result) {
      if (err) throw err;
      if(result[0] == undefined){
        percentileByCountry = 100;
  			audioFeatureAverages.danceability = 0.57;
  			audioFeatureAverages.energy = 0.65;
  			audioFeatureAverages.happiness = 0.45;
  			audioFeatureAverages.acousticness = 0.22; //values pulled from obscurify 1.0 global averages
      }
      else{

        var usersBelow = 0;

        var value;
        Object.keys(result[0].breakdown).forEach(function(key) {
            value = result[0].breakdown[key];
            if( parseInt(key) < parseInt(req.query.obscurifyScore)){
              usersBelow += value;
            }
        });
        var usersAbove = result[0].userCount - usersBelow;

  		  percentileByCountry = ( usersAbove / result[0].userCount ) * 100;

        res.send(
    			{
    				"percentileByCountry" : percentileByCountry,
    				"globalAverageScore" : result[0].globalAverageScore,
    				"totalUserCount" : result[0].totalUserCount,
    				"userCountByCountry" : result[0].userCount,
    				"audioFeatureAverages" : result[0].audioFeatureAverages,
            "averageScore" : result[0].averageScore
    			}
    		)

      }
      });

	  });
	});


app.get('/api/getCountryBreakdown/:countryCode/:accessToken', function(req, res) {

	if(req.params.countryCode == undefined){
		return res.send({"status" : "we need a country code dog"});
	}

	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://127.0.0.1:27017/obscurify";

	MongoClient.connect(url, function(err, db) {
	    if (err) throw err;

    db.collection("report").find({code : req.params.countryCode}, {}).toArray(function(err, result) {
    if (err) throw err;

			request({
				url: 'https://api.spotify.com/v1/artists?ids=' + result[0].topArtistIDs.join(),
				method: "GET",
				headers : {
				"Authorization" : "Bearer " + req.params.accessToken,
				"Accept" : "application/json"
				},
				json: true
			}, function (error, response, body){
				res.send(
					{
						"country" : req.params.countryCode,
						"topArtists" : response.body.artists //the 10 artists that appear on the most Top 10 all-time artist lists
					}
				);
			});

	    });
	});

	//this is just used to sort the topGenres so the client doesn't have to
	function Comparator(a, b) {
		if (a[1] > b[1]) return -1;
		if (a[1] < b[1]) return 1;
		return 0;
	}

});

app.get('/api/getUserHistory', function(req, res) {
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://127.0.0.1:27017/obscurify";

	if(req.query.userID == undefined ||	req.query.obscurify_secret != obscurify_secret){
		return res.send({"status" : "uh oh"});
	}

	MongoClient.connect(url, function(err, db) {
	    if (err){
            console.log(err);
            throw err;
        }

	    db.collection("users").find({userID : req.query.userID}, {
			//only supposed to specify what you DON'T want returned
			_id: false,
			//userID: true,
			email: false,
			country: false,
			longTermArtistIDs:false,
			longTermTrackIDs:false,
			obscurifyScore:false,
			longTermAudioFeatures:false
			//userHistory:true
		}).toArray(function(err, result) {
			if (err) throw err;
			if(result[0] == undefined){
				res.send({
					'userID' : req.query.userID,
					'userHistory' : null
				});
			}else{
				res.send({
					'userID' : req.query.userID,
					'userHistory' : result[0].userHistory
				});
			}
			//db.close();
	    });
	});



});

//console.log('Listening on 8082');
//app.listen(8082, '0.0.0.0');

var httpsServer = https.createServer(credentials, app);
console.log('Listening on 8445');
httpsServer.listen(8445);
