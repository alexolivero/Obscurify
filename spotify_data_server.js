var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const async = require('async');

var app = express();

app.use(express.static(__dirname ))
   .use(cookieParser())
   .use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
      });

app.get('/spotifyData/:accessToken/getUserData', function(req, res) {
	
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

	//these are the urls we gotta hit in no particular order to find the users top artists/tracks
	//for long and short time ranges. and the last one is to get profile data such as your image URL
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
		var shortTermArtistIDs = [];
		var longTermTrackIDs = [];
		var longTermArtistIDs = [];
		
		var longTermTracks = response[2];
		var longTermArtists = response[0];
		var shortTermTracks = response[3];
		var shortTermArtists = response[1];
		
		for(var i = 0; i < longTermTracks.items.length; i++){
			longTermTrackIDs.push(longTermTracks.items[i].id);
			//findStarRating
		}
		
		for(var i = 0; i < shortTermTracks.items.length; i++){
			shortTermTrackIDs.push(shortTermTracks.items[i].id);
			//findStarRating
		}
		
		for(var i = 0; i < shortTermArtists.items.length; i++){
			shortTermArtistIDs.push(shortTermArtists.items[i].id);
			shortTermArtists.items[i].randomGenres = findRandomGenres(shortTermArtists.items[i]);
			//findStarRating
		}
	  
		for(var i = 0; i < longTermArtists.items.length; i++){
			longTermArtistIDs.push(longTermArtists.items[i].id);
			longTermArtists.items[i].randomGenres = findRandomGenres(longTermArtists.items[i]);
			//findStarRating
			
			//where the magic happens
			obscurifyScore = obscurifyScore + (50/longTermArtists.items.length)*(parseInt(longTermArtists.items[i].popularity * (1 - i/longTermArtists.items.length)));

			//Populate the genre dictionary with this artist's genres
			for(var genre = 0; genre < longTermArtists.items[i].genres.length; genre++){
				if(genres[longTermArtists.items[i].genres[genre]] != null){
					genres[longTermArtists.items[i].genres[genre]] = genres[longTermArtists.items[i].genres[genre]] + 1;
				} else{
					genres[longTermArtists.items[i].genres[genre]] = 1;
				}
			}
		}		
		for(var g in genres){
		  topGenres.push([g,genres[g]]);
		}
		
		obscurifyScore = parseInt(obscurifyScore/10);
		topGenres.sort(Comparator);
		
		
		//now in this section we're trying to find the energy, happiness,
		//acousticness, and danceability of your top 50 all-time/recent tracks		
		const audioFeatureUrls= [			  
		  "https://api.spotify.com/v1/audio-features?ids=" + longTermTrackIDs.join(),
		  "https://api.spotify.com/v1/audio-features?ids=" + shortTermTrackIDs.join()
		];
		
		var responseToTheFrontEnd = {
						'displayName':response[4].display_name,
						'country':response[4].country,
						'imageURL':response[4].images,
						'longTermArtists':longTermArtists,
						'shortTermArtists':shortTermArtists,
						'longTermTracks':longTermTracks,
						'shortTermTracks':shortTermTracks,
						'obscurifyScore':obscurifyScore,
						'topGenres':topGenres,
						'longTermAudioFeatures':null,
						'shortTermAudioFeatures':null
					};

		async.map(audioFeatureUrls, httpGet, function (err, audioFeatureResponse){
			if (err || audioFeatureResponse[0].error){
				//so if something went wrong, just send what we've already got back to the client
				return res.send(responseToTheFrontEnd);
			}

			var longTermAudioFeatures = {
				'danceability' : 0,
				'energy' : 0,
				'happiness' : 0,
				'acousticness' : 0
			};
			var shortTermAudioFeatures = {
				'danceability' : 0,
				'energy' : 0,
				'happiness' : 0,
				'acousticness' : 0
			};
			
			try{
				//this is a little process I like to call "average the audio features for your top tracks"
				//there's probably a smarter way to do this...?
				//first do it for long term tracks
				for(var i = 0; i < audioFeatureResponse[0].audio_features.length; i++){
					longTermAudioFeatures.danceability += audioFeatureResponse[0].audio_features[i].danceability;
					longTermAudioFeatures.energy += audioFeatureResponse[0].audio_features[i].energy;
					longTermAudioFeatures.happiness += audioFeatureResponse[0].audio_features[i].valence;
					longTermAudioFeatures.acousticness += audioFeatureResponse[0].audio_features[i].acousticness;
				}
				longTermAudioFeatures.danceability /= audioFeatureResponse[0].audio_features.length;
				longTermAudioFeatures.energy /= audioFeatureResponse[0].audio_features.length;
				longTermAudioFeatures.happiness /= audioFeatureResponse[0].audio_features.length;
				longTermAudioFeatures.acousticness /= audioFeatureResponse[0].audio_features.length;
				
				//now do it for short term tracks baby!!!
				for(var i = 0; i < audioFeatureResponse[1].audio_features.length; i++){
					shortTermAudioFeatures.danceability += audioFeatureResponse[1].audio_features[i].danceability;
					shortTermAudioFeatures.energy += audioFeatureResponse[1].audio_features[i].energy;
					shortTermAudioFeatures.happiness += audioFeatureResponse[1].audio_features[i].valence;
					shortTermAudioFeatures.acousticness += audioFeatureResponse[1].audio_features[i].acousticness;
				}
				shortTermAudioFeatures.danceability /= audioFeatureResponse[1].audio_features.length;
				shortTermAudioFeatures.energy /= audioFeatureResponse[1].audio_features.length;
				shortTermAudioFeatures.happiness /= audioFeatureResponse[1].audio_features.length;
				shortTermAudioFeatures.acousticness /= audioFeatureResponse[1].audio_features.length;
				
				//aww yeah look at this fat payload! to angular we go!
				responseToTheFrontEnd.longTermAudioFeatures = longTermAudioFeatures;
				responseToTheFrontEnd.shortTermAudioFeatures = shortTermAudioFeatures;
				res.send(responseToTheFrontEnd);
				
				//make a call to the database_server and toss this into MONGO!!!
				request({
					url: 'http://67.205.147.250/api/saveUserHistory',
					method: "POST",
					json: true,
					body: {
							'userID' : response[4].id,
							'email':response[4].email,
							'country':response[4].country,
							'longTermArtistIDs':longTermArtistIDs,
							'longTermTrackIDs':longTermTrackIDs,
							'obscurifyScore':obscurifyScore,
							'longTermAudioFeatures':longTermAudioFeatures,
							'shortTermArtistIDs' : shortTermArtistIDs,
							'shortTermTrackIDs' : shortTermTrackIDs
						} 
				}, function (error, response, body){});
			}
			catch(err){
				return res.send(responseToTheFrontEnd);
			}
			
			
		});						
		
	});
		
	//this is just used to sort the topGenres so the poor client doesn't have to
	function Comparator(a, b) {
		if (a[1] > b[1]) return -1;
		if (a[1] < b[1]) return 1;
		return 0;
	}
	
	function findStarRating(popularity){
		
	}
	
	function findRandomGenres(artist){
		if(artist.genres.length > 1){
			var random1 = Math.floor(Math.random() * artist.genres.length);
			var random2 = Math.floor(Math.random() * artist.genres.length);
			while (random1 == random2){
				random2 = Math.floor(Math.random() * artist.genres.length);
			}
			var returnData = {randomGenre1 : artist.genres[random1], randomGenre2 : artist.genres[random2]};
			//check to see if these genres contain the word "christmas", if so remove it
			if(returnData.randomGenre1.indexOf("christmas") > -1){
				returnData.randomGenre1 = returnData.randomGenre1.replace("christmas","");
			}
			if(returnData.randomGenre2.indexOf("christmas") > -1){
				returnData.randomGenre2 = returnData.randomGenre2.replace("christmas","");
			}
			return returnData;
		}
		else if(artist.genres.length == 1){
			return {randomGenre1 : artist.genres[0], randomGenre2 : null}
		}
		else{
			return {randomGenre1 : null, randomGenre2 : null}
		}
	}
	
});


console.log('Listening on 8081');
app.listen(8081, '0.0.0.0');
