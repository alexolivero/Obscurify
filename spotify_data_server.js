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
  //var initialTime = new Date();
	async.map(urls, httpGet, function (err, response) {
		if (err || response[0].error || response[2].items == undefined || response[3].items == undefined) {
			return res.status(404).send("AW NAH :( first round of calls failed");
		}
    //var difference = (new Date() - initialTime) / 1000;
    //console.log("You waited: " + difference + " seconds for the first round of calls");
		var obscurifyScore = 0;
		var recentObscurifyScore = 0;
		var topGenres = [];
		var genres = {};
		var shortTermTrackIDs = [];
		var shortTermArtistIDs = [];
		var longTermTrackIDs = [];
		var longTermArtistIDs = [];
		var longTermTracks = response[2].items;
		var longTermArtists = response[0].items;
		var shortTermTracks = response[3].items;
		var shortTermArtists = response[1].items;
    var spotifyUserInfo = response[4];
		for (let track of longTermTracks) {
			longTermTrackIDs.push(track.id);
			track.starRating = findStarRating(track.popularity);
		}
		for (let track of shortTermTracks) {
			shortTermTrackIDs.push(track.id);
			track.starRating = findStarRating(track.popularity);
		}
		for (let i = 0; i < shortTermArtists.length; i++) {
			shortTermArtistIDs.push(shortTermArtists[i].id);
			shortTermArtists[i].randomGenres = findRandomGenres(shortTermArtists[i]);
			shortTermArtists[i].starRating = findStarRating(shortTermArtists[i].popularity);
			recentObscurifyScore = recentObscurifyScore + (50 / shortTermArtists.length) * (parseInt(shortTermArtists[i].popularity * (1 - i / shortTermArtists.length)));
		}
		for (let i = 0; i < longTermArtists.length; i++) {
			longTermArtistIDs.push(longTermArtists[i].id);
			longTermArtists[i].randomGenres = findRandomGenres(longTermArtists[i]);
			longTermArtists[i].starRating = findStarRating(longTermArtists[i].popularity);
			obscurifyScore = obscurifyScore + (50 / longTermArtists.length) * (parseInt(longTermArtists[i].popularity * (1 - i / longTermArtists.length)));
			//Populate the genre dictionary with this artist's genres
			for (var genre = 0; genre < longTermArtists[i].genres.length; genre++) {
  				if (genres[longTermArtists[i].genres[genre]] != null) {
  					 genres[longTermArtists[i].genres[genre]] = genres[longTermArtists[i].genres[genre]] + 1;
  				} else {
  					 genres[longTermArtists[i].genres[genre]] = 1;
  				}
			}
		}
		for (var g in genres) {
		  topGenres.push([g,genres[g]]);
		}
		obscurifyScore = parseInt(obscurifyScore/10);
		recentObscurifyScore = parseInt(recentObscurifyScore/10);
		topGenres.sort(Comparator);
    //responseToTheFrontEnd with all the data we've got so far, in case we need to return just this
    var responseToTheFrontEnd = {
						'displayName':spotifyUserInfo.display_name,
						'userID':spotifyUserInfo.id,
						'country':spotifyUserInfo.country,
						'imageURL':spotifyUserInfo.images,
						'longTermArtists':longTermArtists,
						'shortTermArtists':shortTermArtists,
						'longTermTracks':longTermTracks,
						'shortTermTracks':shortTermTracks,
						'obscurifyScore':obscurifyScore,
						'recentObscurifyScore':recentObscurifyScore,
            'averageScore':null,
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
		//now in this section we're trying to find the energy, happiness,
		//acousticness, and danceability of your top 50 all-time/recent tracks, also recommended tracks,
		//and also query the Obscurify database to get user averages and whatnot
		const audioFeatureAndObscurifyUrls= [
		    "https://api.spotify.com/v1/audio-features?ids=" + longTermTrackIDs.join(),
		    "https://api.spotify.com/v1/audio-features?ids=" + shortTermTrackIDs.join(),
		    "https://obscurifymusic.com/api/getObscurifyData?obscurifyScore=" + obscurifyScore +
				    "&country=" + spotifyUserInfo.country + "&obscurify_secret=" + obscurify_secret,
		    "https://api.spotify.com/v1/recommendations?seed_artists="
				    + longTermArtistIDs[Math.floor(Math.random() * longTermArtistIDs.length)] + ","
				        + shortTermArtistIDs[Math.floor(Math.random() * shortTermArtistIDs.length)] + "&seed_tracks="
				            + longTermTrackIDs[Math.floor(Math.random() * longTermTrackIDs.length)] + ","
				                + shortTermTrackIDs[Math.floor(Math.random() * shortTermTrackIDs.length)]
				                    + "&market=" + spotifyUserInfo.country + "&max_popularity=55" + "&min_popularity=25" + "&limit=40",
			  "https://obscurifymusic.com/api/getUserHistory?&userID=" + spotifyUserInfo.id + "&obscurify_secret=" + obscurify_secret
		];
    //var secondBatchStart = new Date();
		async.map(audioFeatureAndObscurifyUrls, httpGet, function (err, audioFeatureAndObscurifyDataResponse) {
			if (err || audioFeatureAndObscurifyDataResponse[0].error) {
				//so if something went wrong, just send what we've already got back to the client
				console.log("we dun goofed on second batch of calls: " + err);
				return res.send(responseToTheFrontEnd);
			}
      var longTermAudioFeaturesResponse = audioFeatureAndObscurifyDataResponse[0];
      var shortTermAudioFeaturesResponse = audioFeatureAndObscurifyDataResponse[1];
      var obscurifyGetDataResponse = audioFeatureAndObscurifyDataResponse[2];
      var spotifyRecommendationResponse = audioFeatureAndObscurifyDataResponse[3];
      var obscurifyGetHistoryResponse = audioFeatureAndObscurifyDataResponse[4];
      //var secondDifference = (new Date() - secondBatchStart) / 1000;
      //console.log("You waited: " + secondDifference + " seconds for the second round of calls");
      if (spotifyRecommendationResponse != undefined) {
        spotifyRecommendationResponse = spotifyRecommendationResponse.tracks;
      }
      var recommendedTracks = processRecommendations(spotifyRecommendationResponse);
			var longTermAudioFeatures = {
  				'danceability' : 0,
  				'energy' : 0,
  				'happiness' : 0,
  				'acousticness' : 0,
          'tracksCounted' : 0
			};
			var shortTermAudioFeatures = {
  				'danceability' : 0,
  				'energy' : 0,
  				'happiness' : 0,
  				'acousticness' : 0,
          'tracksCounted' : 0
			};
			//this is a little process I like to call "average the audio features for your top tracks"
			//first do it for long term tracks
      if (longTermAudioFeaturesResponse.audio_features != undefined) {
          for (var i = 0; i < longTermAudioFeaturesResponse.audio_features.length; i++) {
                  if (longTermAudioFeaturesResponse.audio_features[i] != null) {
                        longTermAudioFeatures.danceability += longTermAudioFeaturesResponse.audio_features[i].danceability;
                				longTermAudioFeatures.energy += longTermAudioFeaturesResponse.audio_features[i].energy;
                				longTermAudioFeatures.happiness += longTermAudioFeaturesResponse.audio_features[i].valence;
                				longTermAudioFeatures.acousticness += longTermAudioFeaturesResponse.audio_features[i].acousticness;
                        longTermAudioFeatures.tracksCounted += 1;
                  }
    			}
    			longTermAudioFeatures.danceability /= longTermAudioFeatures.tracksCounted;
    			longTermAudioFeatures.energy /= longTermAudioFeatures.tracksCounted;
    			longTermAudioFeatures.happiness /=longTermAudioFeatures.tracksCounted;
    			longTermAudioFeatures.acousticness /= longTermAudioFeatures.tracksCounted;
      }
			responseToTheFrontEnd.longTermAudioFeatures = longTermAudioFeatures;
			//now do it for short term tracks baby!!!
      if (shortTermAudioFeaturesResponse.audio_features != undefined) {
            for (var i = 0; i < shortTermAudioFeaturesResponse.audio_features.length; i++) {
                  if (shortTermAudioFeaturesResponse.audio_features[i] != null) {
                      shortTermAudioFeatures.danceability += shortTermAudioFeaturesResponse.audio_features[i].danceability;
            					shortTermAudioFeatures.energy += shortTermAudioFeaturesResponse.audio_features[i].energy;
            					shortTermAudioFeatures.happiness += shortTermAudioFeaturesResponse.audio_features[i].valence;
            					shortTermAudioFeatures.acousticness += shortTermAudioFeaturesResponse.audio_features[i].acousticness;
                      shortTermAudioFeatures.tracksCounted += 1;
                  }
    			}
    			shortTermAudioFeatures.danceability /= shortTermAudioFeatures.tracksCounted;
    			shortTermAudioFeatures.energy /= shortTermAudioFeatures.tracksCounted;
    			shortTermAudioFeatures.happiness /= shortTermAudioFeatures.tracksCounted;
    			shortTermAudioFeatures.acousticness /= shortTermAudioFeatures.tracksCounted;
      }
			responseToTheFrontEnd.shortTermAudioFeatures = shortTermAudioFeatures;
			//aww yeah look at this fat payload! to angular we go!
			responseToTheFrontEnd.totalUserCount = obscurifyGetDataResponse.totalUserCount;
			responseToTheFrontEnd.percentileByCountry = obscurifyGetDataResponse.percentileByCountry;
			responseToTheFrontEnd.globalAverageScore = obscurifyGetDataResponse.globalAverageScore;
      responseToTheFrontEnd.averageScore = obscurifyGetDataResponse.averageScore;
			responseToTheFrontEnd.userCountByCountry = obscurifyGetDataResponse.userCountByCountry;
			responseToTheFrontEnd.audioFeatureAverages = obscurifyGetDataResponse.audioFeatureAverages;
			responseToTheFrontEnd.recommendedTracks = recommendedTracks;
			responseToTheFrontEnd.userHistory = obscurifyGetHistoryResponse.userHistory;
			res.send(responseToTheFrontEnd);
			if (longTermArtists.length > 14 && //only post data for users who have significant Spotify history
  				longTermTracks.length > 14 &&
  				obscurifyScore > 39 && //arbitrary number, but if your score is below 40 then something is likely wrong
  				longTermAudioFeatures.happiness > 0 &&
  				longTermAudioFeatures.energy > 0 &&
  				longTermAudioFeatures.danceability > 0 &&
  				longTermAudioFeatures.acousticness > 0) {
  				request({
  					url: 'https://obscurifymusic.com/api/saveUserHistory',
  					method: "POST",
  					json: true,
  					body: {
  							'userID' : spotifyUserInfo.id,
  							'country':spotifyUserInfo.country,
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




app.get('/spotifyData/getRecommendations', function(req, res) {
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
      "https://api.spotify.com/v1/recommendations?seed_artists=" + req.query.artistID
      + "&market=" + req.query.country
      + "&target_popularity=" + req.query.desiredObscurity
      + "&limit=40"
	];
	async.map(urls, httpGet, function (err, response){
  		if (err || response[0].error){
  			   console.log("error on recommendations: " + response[0].error);
  			   return res.send( {"error" : "darn it"} );
  		}
  		res.send({
  			   'recommendedTracks': processRecommendations(response[0].tracks)
  		});
	});
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
		if (err || response[0].error || response[1].error) {
			console.log("error on get history items: " + response[0].error);
			return res.send({"error" : "darn it"});
		}
		var artists = response[0].artists;
		var tracks = response[1].tracks;
		var recentObscurifyScore = 0;
		for (var i = 0; i < tracks.length; i++) {
			tracks[i].starRating = findStarRating(tracks[i].popularity);
		}
		for (var i = 0; i < artists.length; i++) {
			artists[i].randomGenres = findRandomGenres(artists[i]);
			artists[i].starRating = findStarRating(artists[i].popularity);
			recentObscurifyScore = recentObscurifyScore + (50/artists.length) * (parseInt(artists[i].popularity * (1 - i/artists.length)));
		}
		recentObscurifyScore = parseInt(recentObscurifyScore/10);
		res.send({
			"artists" : artists,
			"tracks" : tracks,
			"recentObscurifyScore" : recentObscurifyScore
		});
	});
});


function findStarRating(popularity) {
	if (popularity >= 90) { return "★★★★★"; }
	else if (popularity >= 80) { return "★★★★"; }
	else if (popularity >= 65) { return "★★★"; }
	else if (popularity >= 50) { return "★★";  }
	else if (popularity >= 35) { return "★"; }
	else { return ""; }
}

//will return up to two random genres out of the artist's array of all genres
function findRandomGenres(artist) {
  	if (artist.genres.length > 1) {
  		var random1 = Math.floor(Math.random() * artist.genres.length);
  		var random2 = Math.floor(Math.random() * artist.genres.length);
  		while (random1 == random2) {
  			random2 = Math.floor(Math.random() * artist.genres.length);
  		}
  		var returnData = { randomGenre1 : artist.genres[random1], randomGenre2 : artist.genres[random2] };
  		//check to see if these genres contain the word "christmas", if so remove it
  		if (returnData.randomGenre1.indexOf("christmas") > -1) {
  			returnData.randomGenre1 = returnData.randomGenre1.replace("christmas","");
  		}
  		if (returnData.randomGenre2.indexOf("christmas") > -1) {
  			returnData.randomGenre2 = returnData.randomGenre2.replace("christmas","");
  		}
  		return returnData;
  	}
  	else if (artist.genres.length == 1) {
  		return { randomGenre1 : artist.genres[0], randomGenre2 : null }
  	}
  	else {
  		return { randomGenre1 : null, randomGenre2 : null }
  	}
}


function processRecommendations(rawRecommendations) {
  var recommendedTracks = [];
  var artistsAppearingInResponse = [];
  try {
    if (rawRecommendations != undefined ) {
      for (var i = 0; i < rawRecommendations.length; i++){
        if (artistsAppearingInResponse.indexOf(rawRecommendations[i].artists[0].name) < 0 ) {
          recommendedTracks.push({
              trackName : rawRecommendations[i].name,
              popularity : rawRecommendations[i].popularity,
              artistName : rawRecommendations[i].artists[0].name,
              artistID : rawRecommendations[i].artists[0].id,
              albumName : rawRecommendations[i].album.name,
              albumImageUrl : rawRecommendations[i].album.images[0].url,
              uri : rawRecommendations[i].uri,
              href : rawRecommendations[i].external_urls.spotify
            }
          );
          artistsAppearingInResponse.push(rawRecommendations[i].artists[0].name);
        }
      }
    }
    return recommendedTracks;
  }
  catch(err) {}
}

// console.log('Listening on 8002');
// app.listen(8002);

var httpsServer = https.createServer(credentials, app);
console.log('Listening on 8002');
httpsServer.listen(8002);
