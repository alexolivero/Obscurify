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
const async = require('async');

var obscurify_secret = process.argv[2];

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
			//console.log(response[0].error);
			return res.status(404).send("OMG NO :(");
		}
		var obscurifyScore = 0;
		var recentObscurifyScore = 0;
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
			longTermTracks.items[i].starRating = findStarRating(longTermTracks.items[i].popularity);
		}

		for(var i = 0; i < shortTermTracks.items.length; i++){
			shortTermTrackIDs.push(shortTermTracks.items[i].id);
			shortTermTracks.items[i].starRating = findStarRating(shortTermTracks.items[i].popularity);
		}

		for(var i = 0; i < shortTermArtists.items.length; i++){
			shortTermArtistIDs.push(shortTermArtists.items[i].id);
			shortTermArtists.items[i].randomGenres = findRandomGenres(shortTermArtists.items[i]);
			shortTermArtists.items[i].starRating = findStarRating(shortTermArtists.items[i].popularity);

			//where the magic happens
			recentObscurifyScore = recentObscurifyScore + (50/shortTermArtists.items.length)*(parseInt(shortTermArtists.items[i].popularity * (1 - i/shortTermArtists.items.length)));
		}

		for(var i = 0; i < longTermArtists.items.length; i++){
			longTermArtistIDs.push(longTermArtists.items[i].id);
			longTermArtists.items[i].randomGenres = findRandomGenres(longTermArtists.items[i]);
			longTermArtists.items[i].starRating = findStarRating(longTermArtists.items[i].popularity);

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
		recentObscurifyScore = parseInt(recentObscurifyScore/10);
		topGenres.sort(Comparator);

		//now in this section we're trying to find the energy, happiness,
		//acousticness, and danceability of your top 50 all-time/recent tracks
		//also find recommended tracks
		//and also query the Obscurify database to get user averages and whatnot
		const audioFeatureAndObscurifyUrls= [
		    "https://api.spotify.com/v1/audio-features?ids=" + longTermTrackIDs.join(),
		    "https://api.spotify.com/v1/audio-features?ids=" + shortTermTrackIDs.join(),
		    "https://obscurifymusic.com/api/getObscurifyData?obscurifyScore=" + obscurifyScore +
				"&country=" + response[4].country + "&obscurify_secret=" + obscurify_secret,
		    "https://api.spotify.com/v1/recommendations?seed_artists="
				+ longTermArtistIDs[Math.floor(Math.random() * longTermArtistIDs.length)] + ","
				+ shortTermArtistIDs[Math.floor(Math.random() * shortTermArtistIDs.length)] + "&seed_tracks="
				+ longTermTrackIDs[Math.floor(Math.random() * longTermTrackIDs.length)] + ","
				+ shortTermTrackIDs[Math.floor(Math.random() * shortTermTrackIDs.length)]
				+ "&max_popularity=55" + "&min_popularity=35" + "&limit=40",
			"https://obscurifymusic.com/api/getUserHistory?&userID=" + response[4].id + "&obscurify_secret=" + obscurify_secret

		];


		var responseToTheFrontEnd = {
						'displayName':response[4].display_name,
						'userID':response[4].id,
						'country':response[4].country,
						'imageURL':response[4].images,
						'longTermArtists':longTermArtists,
						'shortTermArtists':shortTermArtists,
						'longTermTracks':longTermTracks,
						'shortTermTracks':shortTermTracks,
						'obscurifyScore':obscurifyScore,
						'recentObscurifyScore':recentObscurifyScore,
						'topGenres':topGenres,
						'longTermAudioFeatures':null,
						'shortTermAudioFeatures':null,
						'totalUserCount':null,
						'percentileByCountry':null,
						'globalAverageScore':null,
						'userCountByCountry':null,
						'audioFeatureAverages':null,
						'recommendedTracks':null,
						'userHistory':null
					};

		async.map(audioFeatureAndObscurifyUrls, httpGet, function (err, audioFeatureAndObscurifyDataResponse){
			if (err || audioFeatureAndObscurifyDataResponse[0].error){
				//so if something went wrong, just send what we've already got back to the client
				console.log("we dun goofed: " + err);
				return res.send(responseToTheFrontEnd);
			}

			var recommendedTracksResponse = audioFeatureAndObscurifyDataResponse[3].tracks;
			var recommendedTracks = [];
			var artistsAppearingInResponse = [];
			try{
				if(recommendedTracksResponse != undefined ){
					for(var i = 0; i < recommendedTracksResponse.length; i++){
						if(
							artistsAppearingInResponse.indexOf(recommendedTracksResponse[i].artists[0].name) < 0 &&
							longTermTrackIDs.indexOf(recommendedTracksResponse[i].id) < 0 &&
							shortTermTrackIDs.indexOf(recommendedTracksResponse[i].id) < 0
							){
						  recommendedTracks.push(
							{
							  trackName : recommendedTracksResponse[i].name,
							  popularity : recommendedTracksResponse[i].popularity,
							  artistName : recommendedTracksResponse[i].artists[0].name,
							  albumName : recommendedTracksResponse[i].album.name,
							  albumImageUrl : recommendedTracksResponse[i].album.images[0].url,
							  uri : recommendedTracksResponse[i].uri
							}
						  );
						  artistsAppearingInResponse.push(recommendedTracksResponse[i].artists[0].name);
						}
					}
				}
			}
			catch(err){}

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
				for(var i = 0; i < audioFeatureAndObscurifyDataResponse[0].audio_features.length; i++){
					longTermAudioFeatures.danceability += audioFeatureAndObscurifyDataResponse[0].audio_features[i].danceability;
					longTermAudioFeatures.energy += audioFeatureAndObscurifyDataResponse[0].audio_features[i].energy;
					longTermAudioFeatures.happiness += audioFeatureAndObscurifyDataResponse[0].audio_features[i].valence;
					longTermAudioFeatures.acousticness += audioFeatureAndObscurifyDataResponse[0].audio_features[i].acousticness;
				}
				longTermAudioFeatures.danceability /= audioFeatureAndObscurifyDataResponse[0].audio_features.length;
				longTermAudioFeatures.energy /= audioFeatureAndObscurifyDataResponse[0].audio_features.length;
				longTermAudioFeatures.happiness /= audioFeatureAndObscurifyDataResponse[0].audio_features.length;
				longTermAudioFeatures.acousticness /= audioFeatureAndObscurifyDataResponse[0].audio_features.length;

				responseToTheFrontEnd.longTermAudioFeatures = longTermAudioFeatures;
			}
			catch(err){
				//console.log(err);
			}
			try{
				//now do it for short term tracks baby!!!
				for(var i = 0; i < audioFeatureAndObscurifyDataResponse[1].audio_features.length; i++){
					shortTermAudioFeatures.danceability += audioFeatureAndObscurifyDataResponse[1].audio_features[i].danceability;
					shortTermAudioFeatures.energy += audioFeatureAndObscurifyDataResponse[1].audio_features[i].energy;
					shortTermAudioFeatures.happiness += audioFeatureAndObscurifyDataResponse[1].audio_features[i].valence;
					shortTermAudioFeatures.acousticness += audioFeatureAndObscurifyDataResponse[1].audio_features[i].acousticness;
				}
				shortTermAudioFeatures.danceability /= audioFeatureAndObscurifyDataResponse[1].audio_features.length;
				shortTermAudioFeatures.energy /= audioFeatureAndObscurifyDataResponse[1].audio_features.length;
				shortTermAudioFeatures.happiness /= audioFeatureAndObscurifyDataResponse[1].audio_features.length;
				shortTermAudioFeatures.acousticness /= audioFeatureAndObscurifyDataResponse[1].audio_features.length;

				responseToTheFrontEnd.shortTermAudioFeatures = shortTermAudioFeatures;
			}
			catch(err){
				//console.log(err);
			}

			//aww yeah look at this fat payload! to angular we go!
			responseToTheFrontEnd.totalUserCount = audioFeatureAndObscurifyDataResponse[2].totalUserCount;
			responseToTheFrontEnd.percentileByCountry = audioFeatureAndObscurifyDataResponse[2].percentileByCountry;
			responseToTheFrontEnd.globalAverageScore = audioFeatureAndObscurifyDataResponse[2].globalAverageScore;
			responseToTheFrontEnd.userCountByCountry = audioFeatureAndObscurifyDataResponse[2].userCountByCountry;
			responseToTheFrontEnd.audioFeatureAverages = audioFeatureAndObscurifyDataResponse[2].audioFeatureAverages;
			responseToTheFrontEnd.recommendedTracks = recommendedTracks;
			responseToTheFrontEnd.userHistory = audioFeatureAndObscurifyDataResponse[4].userHistory;
			res.send(responseToTheFrontEnd);

			//make a call to the database_server and toss this into MONGO!!!
			if(
				longTermArtists.items.length > 14 && //only post data for users who have significant Spotify history
				longTermTracks.items.length > 14 &&
				obscurifyScore > 39 && //arbitrary number, but if your score is below 40 then something is likely wrong
				longTermAudioFeatures.happiness > 0 &&
				longTermAudioFeatures.energy > 0 &&
				longTermAudioFeatures.danceability > 0 &&
				longTermAudioFeatures.acousticness > 0
			){
				request({
					url: 'https://obscurifymusic.com/api/saveUserHistory',
					method: "POST",
					json: true,
					body: {
							'userID' : response[4].id,
							'country':response[4].country,
							'longTermArtistIDs':longTermArtistIDs,
							'longTermTrackIDs':longTermTrackIDs,
							'obscurifyScore':obscurifyScore,
							'longTermAudioFeatures':longTermAudioFeatures,
							'shortTermArtistIDs' : shortTermArtistIDs,
							'shortTermTrackIDs' : shortTermTrackIDs,
							'obscurify_secret' : obscurify_secret // so ya'll aint be cheatin
						}
				}, function (error, response, body){
				});
			}


		});

	});

	//this is just used to sort the topGenres so the client doesn't have to
	function Comparator(a, b) {
		if (a[1] > b[1]) return -1;
		if (a[1] < b[1]) return 1;
		return 0;
	}

});

app.get('/spotifyData/getHistoryItems', function(req, res) {

	function httpGet(url, callback) {
	  const options = {
		url :  url,
		headers : {
				"Authorization" : "Bearer " + req.query.accessToken,
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
		"https://api.spotify.com/v1/artists?ids=" + req.query.artistIDs,
		"https://api.spotify.com/v1/tracks?ids=" + req.query.trackIDs
	];

	async.map(urls, httpGet, function (err, response){
		if (err || response[0].error){
			console.log(err);
			return res.send({"error" : "darn it"});
		}

		var artists = response[0].artists;
		var tracks = response[1].tracks;
		var recentObscurifyScore = 0;

		for(var i = 0; i < tracks.length; i++){
			tracks[i].starRating = findStarRating(tracks[i].popularity);
		}

		for(var i = 0; i < artists.length; i++){
			artists[i].randomGenres = findRandomGenres(artists[i]);
			artists[i].starRating = findStarRating(artists[i].popularity);

			//where the magic happens
			recentObscurifyScore = recentObscurifyScore + (50/artists.length)*(parseInt(artists[i].popularity * (1 - i/artists.length)));
		}
		recentObscurifyScore = parseInt(recentObscurifyScore/10);

		res.send({
			"artists" : artists,
			"tracks" : tracks,
			"recentObscurifyScore" : recentObscurifyScore
		});


	});

});

function findStarRating(popularity){
	if(popularity >= 90){ return "★★★★★"; }
	else if(popularity >= 80){ return "★★★★"; }
	else if(popularity >= 65){ return "★★★"; }
	else if(popularity >= 50){ return "★★";  }
	else if(popularity >= 35){ return "★"; }
	else{ return ""; }
}

//will return up to two random genres out of the artist's array of all genres
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

//console.log('Listening on 8081');
//app.listen(8081, '0.0.0.0');

var httpsServer = https.createServer(credentials, app);
console.log('Listening on 8444');
httpsServer.listen(8444);
