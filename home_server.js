var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const async = require('async');
var mongo = require('mongodb');

var app = express();

app.use(express.static(__dirname ))
   .use(cookieParser())
   .use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
      });
	  
app.get('/home/:accessToken', function(req, res) {
    res.sendFile('html/home.html', {root: __dirname })
});

app.get('/home/:accessToken/getUserData', function(req, res) {
	function httpGet(url, callback) {
	  const options = {
		url :  url,
		headers : {
				"Authorization" : "Bearer " + req.params.accessToken,
				"Accept" : "application/json"
			},
		json : true
	  };
	  request(options,
		function(err, res, body) {
		  callback(err, body);
		}
	  );
	}

	const urls= [			  
	  "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term",
	  "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term",
	  "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term",
	  "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term",
	  "https://api.spotify.com/v1/me"
	];

	async.map(urls, httpGet, function (err, response){
		if (err || response[0].error){
			return res.status(404).send("OMG NO :(");
		} 
		var obscurifyScore = 0;
		var topGenres = [];
		var genres = {};
		var shortTermTrackIDs = [];
		var longTermTrackIDs = [];
		var longTermArtistIDs = [];
		
		for(var i = 0; i < response[2].items.length; i++){
			longTermTrackIDs.push(response[2].items[i].id);
		}
		
		for(var i = 0; i < response[3].items.length; i++){
			shortTermTrackIDs.push(response[3].items[i].id);
		}
	  
		for(var i = 0; i < response[0].items.length; i++){
			longTermArtistIDs.push(response[0].items[i].id);
			
			//where the magic happens
			obscurifyScore = obscurifyScore + (50/response[0].items.length)*(parseInt(response[0].items[i].popularity * (1 - i/response[0].items.length)));

			//Populate the genre dictionary with this artist's genres
			for(var genre = 0; genre < response[0].items[i].genres.length; genre++){
				if(genres[response[0].items[i].genres[genre]] != null){
					genres[response[0].items[i].genres[genre]] = genres[response[0].items[i].genres[genre]] + 1;
				} else{
					genres[response[0].items[i].genres[genre]] = 1;
				}
			}
		}		
		for(var g in genres){
		  topGenres.push([g,genres[g]]);
		}
		
		obscurifyScore = parseInt(obscurifyScore/10);
		topGenres.sort(Comparator);
		
		//toss this stuff into the database
		var MongoClient = require('mongodb').MongoClient;
		var url = "mongodb://127.0.0.1:27017/obscurify";
		MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  db.collection("users").update(
			    {userID : response[4].id},
			    {$set:
					{
						'email':response[4].email,
						'country':response[4].country,
						'longTermArtistIDs':longTermArtistIDs,
						'longTermTrackIDs':longTermTrackIDs,
						'obscurifyScore':obscurifyScore
					}
				},
			    { upsert: true}
			)
		});
		
		//send this back to the client to populate the UI
		res.send(
			{
				'displayName':response[4].display_name,
				'country':response[4].country,
				'imageURL':response[4].images,
				'longTermArtists':response[0],
				'shortTermArtists':response[1],
				'longTermTracks':response[2],
				'shortTermTracks':response[3],
				'obscurifyScore':obscurifyScore,
				'topGenres':topGenres
			}
		)					
		
	});
		
	function Comparator(a, b) {
		if (a[1] > b[1]) return -1;
		if (a[1] < b[1]) return 1;
		return 0;
	}
	
});


console.log('Listening on 8081');
app.listen(8081, '0.0.0.0');
