define([], function() {
  function homeController($scope, $http, $routeParams, $window) {

    var access_token = $routeParams.token;
    var user_id = "";
    $scope.imageURL = null; //just to display user's image, not recorded in database
    $scope.display_name = ""; //only displayed underneath the image, not recorded in database
    var user_country = ""; //to send to the database (to do stuff with in the future)
    $scope.user_count = "all"; //to be displayed under the "Average" at the top of the page
    $scope.obscurify_score = null;
    $scope.recent_obscurify_score = null;
    $scope.global_average = null;
    var top_artist = 0; //to be sent to the database
    $scope.obscurify_top_artists = []; //goes hand in hand with $scope.obscurify_top_artists_counts, these are the artist objects
    $scope.obscurify_top_artists_counts = []; //to display the top artists at the bottom of the page, $scope.obscurify_top_artists[i]'s count of #1 listings
    $scope.country_user_counts = []; //count of users from 5 countries (US, Brazil, UK, Sweden, Australia)
    $scope.country_average_scores = [];//average scores of users from 5 countries

    // All of the artists returned from Spotify's API for the user's top (max 50) artists of all time
    $scope.long_term_artists = [];
    // This array contains the popularity of $scope.long_term_artists[i], only to make it easier to display the stars
    $scope.long_term_popularity = [];

    //All of the artists returned from Spotify's API for the user's top (max 50) artists of the last 6 weeks
    $scope.short_term_artists = [];
    //This array contains the popularity of $scope.short_term_artists[i], only to make it easier to display the stars
    $scope.short_term_popularity = [];

    //All of the artists returned from Spotify's API for the user's top (max 50) tracks of all time
    $scope.long_term_tracks = [];
    //This array contains the popularity of $scope.long_term_tracks[i], only to make it easier to display the stars
    $scope.long_term_track_popularity = [];

    //All of the artists returned from Spotify's API for the user's top (max 50) tracks of the last 6 weeks
    $scope.short_term_tracks = [];
    //This array contains the popularity of $scope.short_term_tracks[i], only to make it easier to display the stars
    $scope.short_term_track_popularity = [];

    $scope.recommended_tracks = [];

    var genres = {}; // all of every artists' genres will be placed into this dictionary, the genres with the most occurrences will be put in $scope.top_genres
    $scope.top_genres = []; //list of top genres to be displayed under My Top Genres

    /*
    /variables for the My Taste graph
    */
    var acousticnessST = 0; var acousticnessLT = 0; var acousticnessGlobal = 0;
    var danceabilityST = 0; var danceabilityLT = 0; var danceabilityGlobal = 0;
    var happinessST = 0; var happinessLT = 0; var happinessGlobal = 0;
    var energyST = 0; var energyLT = 0; var energyGlobal = 0;

    var long_term_ids = []; //used to send to Spotify's track analysis API for My Taste graph to get data on All-Time tracks
    var short_term_ids = []; //used to send to Spotify's track analysis API for My Taste graph to get data on recent tracks

    var short_term_artist_ids = [];

    /*
    / This part is just so the tabs work and stuff for their ng-classes so they appear correctly
    */
    $scope.artistsShow = true;   $scope.tracksShow = false; $scope.artistsTab = "active";   $scope.tracksTab = ""; $scope.showHelp = false;
    $scope.showArtists = function(){$scope.artistsShow = true; $scope.tracksShow = false; $scope.tracksTab = ""; $scope.artistsTab = "active";}
    $scope.showTracks = function(){$scope.artistsShow = false; $scope.tracksShow = true; $scope.tracksTab = "active"; $scope.artistsTab = "";}

    var getProfile = function($location){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/me',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
          "Accept" : "application/json"
  			}
  		}).then(function (response) {
        //console.log(response);
        user_id = response.data.id;
        try {  $scope.imageURL = response.data.images[0].url; }
        catch(err) {  $scope.imageURL = "default-user-image.png"; }
        try{  $scope.display_name = response.data.display_name; }
        catch(err){}
        try{ user_country = response.data.country; }
        catch(err){}

        getGlobalData();
        getLongTermArtists();
        getShortTermArtists();
        getHistory();

  		}, function myError(response) {
          console.log("get profile error");

          //if it doesn't work, if your authorization code expired or anything, just go back to the start and log in again
          $window.location.href = 'http://obscurifymusic.com';
      });
  	}

    var getGlobalData = function(){
     $http({
       method : "POST",
       url : 'http://obscurifymusic.com/getData'
     }).then(function (response) {
       //console.log(response.data.body);
       var data = JSON.parse(response.data.body);
       $scope.global_average = parseInt(data.obscurify_score);
       energyGlobal = parseFloat(data.energy);
       happinessGlobal = parseFloat(data.happiness);
       danceabilityGlobal = parseFloat(data.danceability);
       acousticnessGlobal = parseFloat(data.acousticness);
       drawBarChart();

     }, function myError(response) {
         console.log(response);
     });
   }

    var getShortTermArtists = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json"
  			}
  		}).then(function (response) {
        $scope.short_term_artists = response.data.items;

        for(var i = 0; i < $scope.short_term_artists.length; i++){
              short_term_artist_ids.push($scope.short_term_artists[i].id);

              $scope.recent_obscurify_score = $scope.recent_obscurify_score + (50/response.data.items.length)*(parseInt(response.data.items[i].popularity * (1 - i/response.data.items.length)));
              $scope.short_term_popularity.push(findStarRating(response.data.items[i].popularity));

              if($scope.short_term_artists[i].genres.length > 1){
                  var random1 = Math.floor(Math.random() * $scope.short_term_artists[i].genres.length);
                  var random2 = Math.floor(Math.random() * $scope.short_term_artists[i].genres.length);
                  while (random1 == random2){
                    random2 = Math.floor(Math.random() * $scope.short_term_artists[i].genres.length);
                  }
                  $scope.short_term_artists[i].randomGenre1 = $scope.short_term_artists[i].genres[random1];
                  if($scope.short_term_artists[i].randomGenre1.indexOf("christmas") > -1){
                    $scope.short_term_artists[i].randomGenre1 = $scope.short_term_artists[i].randomGenre1.replace("christmas","");
                  }
                  $scope.short_term_artists[i].randomGenre2 = " · " + $scope.short_term_artists[i].genres[random2];
                  if($scope.short_term_artists[i].randomGenre2.indexOf("christmas") > -1){
                    $scope.short_term_artists[i].randomGenre2 = $scope.short_term_artists[i].randomGenre2.replace("christmas","");
                  }
              }
              else if($scope.short_term_artists[i].genres.length == 1){
                  $scope.short_term_artists[i].randomGenre1 = $scope.short_term_artists[i].genres[0];
              }

        }

        //Remove last digit from your score
        $scope.recent_obscurify_score = parseInt($scope.recent_obscurify_score / 10);

        /*
        / Okay,
        */
        getShortTermTracks();


  		}, function myError(response) {
          console.log("short-term artist error")
      });
  	}

    var getLongTermArtists = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json"
  			}
  		}).then(function (response) {
        $scope.long_term_artists = response.data.items;

        for(var i = 0; i < $scope.long_term_artists.length; i++){
            $scope.obscurify_score = $scope.obscurify_score + (50/response.data.items.length)*(parseInt(response.data.items[i].popularity * (1 - i/response.data.items.length)));
            $scope.long_term_popularity.push(findStarRating(response.data.items[i].popularity));

            //Populate the genre dictionary with this artist's genres
            for(var genre = 0; genre < response.data.items[i].genres.length; genre++){
                if(genres[response.data.items[i].genres[genre]] != null){
                    genres[response.data.items[i].genres[genre]] = genres[response.data.items[i].genres[genre]] + 1;
                } else{
                    genres[response.data.items[i].genres[genre]] = 1;
                }
            }

        }

        //Take care of My Top Genres
        for(var g in genres){
          $scope.top_genres.push([g,genres[g]]);
        }
        $scope.top_genres.sort(Comparator);

        //Remove last digit from your score
        $scope.obscurify_score = parseInt($scope.obscurify_score / 10);

        //Assign user's top artist
        if($scope.long_term_artists.length > 0){
          top_artist = $scope.long_term_artists[0].id;
        }

        for(var i = 0; i < $scope.long_term_artists.length; i++){
            if($scope.long_term_artists[i].genres.length > 1){
                var random1 = Math.floor(Math.random() * $scope.long_term_artists[i].genres.length);
                var random2 = Math.floor(Math.random() * $scope.long_term_artists[i].genres.length);
                while (random1 == random2){
                    random2 = Math.floor(Math.random() * $scope.long_term_artists[i].genres.length);
                }
                $scope.long_term_artists[i].randomGenre1 = $scope.long_term_artists[i].genres[random1];
                $scope.long_term_artists[i].randomGenre2 = " · " + $scope.long_term_artists[i].genres[random2];
                if($scope.long_term_artists[i].randomGenre1.indexOf("christmas") > -1){
                  $scope.long_term_artists[i].randomGenre1 = $scope.long_term_artists[i].randomGenre1.replace("christmas","");
                }
                if($scope.long_term_artists[i].randomGenre2.indexOf("christmas") > -1){
                  $scope.long_term_artists[i].randomGenre2 = $scope.long_term_artists[i].randomGenre2.replace("christmas","");
                }

            }
            else if($scope.long_term_artists[i].genres.length == 1){
                $scope.long_term_artists[i].randomGenre1 = $scope.long_term_artists[i].genres[0];
            }
        }

        getLongTermTracks();

  		}, function myError(response) {
          console.log("long-term artist error")
      });
  	}

  	var getShortTermTracks = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json"
  			}
  		}).then(function (response) {
        //console.log(response);
        for(var i = 0; i < response.data.items.length; i++){
            $scope.short_term_track_popularity.push(findStarRating(response.data.items[i].popularity));
            short_term_ids.push(response.data.items[i].id)
        }
        $scope.short_term_tracks = response.data.items;
        getShortTermTrackAnalysis();
        if(short_term_ids.length > 0 && short_term_artist_ids.length > 0){
          postHistory();
        }
  		});
  	}

  	var getLongTermTracks = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json"
  			}
  		}).then(function (response) {
        //console.log(response);
        for(var i = 0; i < response.data.items.length; i++){
            $scope.long_term_track_popularity.push(findStarRating(response.data.items[i].popularity));
            long_term_ids.push(response.data.items[i].id)
        }
        $scope.long_term_tracks = response.data.items;
        getLongTermTrackAnalysis();

  		});
  	}

    var getShortTermTrackAnalysis = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/audio-features',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json",
  			},
        params: { ids: short_term_ids.join() }
  		}).then(function (response) {
        //console.log(response);
          var happiness = 0;
          var energy = 0;
          var danceability = 0;
          var acousticness = 0;
          try{
            for(var i = 0; i < response.data.audio_features.length; i++){
              happiness += response.data.audio_features[i].valence;
              energy += response.data.audio_features[i].energy;
              danceability += response.data.audio_features[i].danceability;
              acousticness += response.data.audio_features[i].acousticness;
            }
            happinessST = happiness/response.data.audio_features.length;
            energyST = energy/response.data.audio_features.length;
            danceabilityST = danceability/response.data.audio_features.length;
            acousticnessST = acousticness/response.data.audio_features.length;
          }
          catch(err){
            console.log(err);
          }

          drawBarChart();
          $scope.getRecommendations();
  		});
  	}

    /*
    / Spotify needs the ids of the tracks you want in an array
    / Use the long_term_ids array populated by getLongTermTracks
    / Get the average for happiness, energy, etc.
    */
    var getLongTermTrackAnalysis = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/audio-features',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json",
  			},
        params: { ids: long_term_ids.join() }
  		}).then(function (response) {
          var happiness = 0;
          var energy = 0;
          var danceability = 0;
          var acousticness = 0;
          try{
            for(var i = 0; i < response.data.audio_features.length; i++){
              happiness += response.data.audio_features[i].valence;
              energy += response.data.audio_features[i].energy;
              danceability += response.data.audio_features[i].danceability;
              acousticness += response.data.audio_features[i].acousticness;
            }
            happinessLT = happiness/response.data.audio_features.length;
            energyLT = energy/response.data.audio_features.length;
            danceabilityLT = danceability/response.data.audio_features.length;
            acousticnessLT = acousticness/response.data.audio_features.length;
          }
          catch(err){
            console.log("long term analysis error");
            alert("Something went wrong. You likely don't have enough Spotify history for Obscurify to work.");
          }

          //only data in database is from people who've got 20 or more long term tracks and artists
          if(response.data.audio_features.length > 19 && $scope.long_term_artists.length > 19){
            postData();
          }

          drawBarChart();
  		});
  	}

    $scope.getRecommendations = function(){
      if($scope.long_term_tracks.length > 9 && $scope.short_term_tracks.length > 9
        && $scope.long_term_artists.length > 9 && $scope.short_term_artists.length > 9){
    		$http({
    			method : "get",
    			url : 'https://api.spotify.com/v1/recommendations',
    			headers : {
    				"Authorization" : "Bearer " + access_token,
    				"Accept" : "application/json",
    			},
          params: { seed_artists: ($scope.long_term_artists[Math.floor(Math.random() * 10)].id + ","
                                + $scope.short_term_artists[Math.floor(Math.random() * 10)].id),
                    seed_tracks: ($scope.long_term_tracks[Math.floor(Math.random() * 10)].id + ","
                                + $scope.short_term_tracks[Math.floor(Math.random() * 10)].id),
                    target_popularity : 45
                  }
    		}).then(function (response) {
          $scope.recommended_tracks = [];
            for(var i = 0; i < response.data.tracks.length; i++){
                if(i > 11 || (long_term_ids.indexOf(response.data.tracks[i].id) < 0 && short_term_ids.indexOf(response.data.tracks[i].id) < 0 ) ){
                  $scope.recommended_tracks.push(
                    {
                      track_name : response.data.tracks[i].name,
                      popularity : response.data.tracks[i].popularity,
                      artist_name : response.data.tracks[i].artists[0].name,
                      album_name : response.data.tracks[i].album.name,
                      album_image_url : response.data.tracks[i].album.images[0].url,
                      uri : response.data.tracks[i].uri
                    }
                  );
                }
            }
    		}, function myError(response) {
            console.log(response);

            //if it doesn't work, if your authorization code expired or anything, just go back to the start and log in again
            $window.location.href = 'http://obscurifymusic.com';
        });
      }
  	}

    /*
    / Simply posts all the following data to the database. Should be called after
    / getProfile -> getLongTermArtists -> getLongTermTracks -> getLongTermTrackAnalysis
    */
    var postData = function(){
     $http({
       method : "POST",
       url : 'http://obscurifymusic.com/postData',
       params : {
         "user_id" : user_id, //from getProfile
         "user_country" : user_country, //from getProfile
         "top_artist" : top_artist, //from getLongTermArtists
         "obscurify_score" : $scope.obscurify_score, //from getLongTermArtists
         "happiness" : happinessLT, //getLongTermTrackAnalysis
         "energy" : energyLT, //getLongTermTrackAnalysis
         "acousticness" : acousticnessLT, //getLongTermTrackAnalysis
         "danceability" : danceabilityLT //getLongTermTrackAnalysis
       }
     }).then(function (response) {
       //console.log(response);
     }, function myError(response) {
         console.log(response);
     });
   }

   /*
   / This function gets the number of users that got every score.
   / it sets the $scope.user_count, draws the User Scores graph and calls getTopArtists
   */
    function getScores() {
       $http({
         method : "GET",
         url : 'http://obscurifymusic.com/getScores',
       }).then(function (response) {
         var rawData = JSON.parse(response.data.body);
         $scope.user_count = 0;
         for(var i = 0; i < rawData.length; i++){
           $scope.user_count = $scope.user_count + rawData[i][1];
         }
         //call getTopArtists here because the HTML that goes with it is associated with
         //$scope.user_count so it'll all display at once with the correct percentage(not NaN)
         getTopArtists();
         var key = [];
         key.push("Score");
         key.push("Number of users");
         rawData.unshift(key);
         var data = google.visualization.arrayToDataTable(rawData);
         var options = {
           legend: { position: 'bottom', textStyle: {color: '#F5F5F5'} },
           backgroundColor: "#303030",
           curveType: 'function',
           hAxis : {
              textStyle : {color : "#F5F5F5"}
            },
          vAxis : {
             textStyle : {color : "#F5F5F5"},
             gridlines : {color : "white"}
           },
           chartArea : {top : 10},
           colors: ['#00c853']
         };
         var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
         chart.draw(data, options);

       }, function myError(response) {
           console.log(response);
       });
    }

    /*
    /
    */
    var getTopArtists = function(){
  		$http({
  			method : "get",
  			url : 'http://obscurifymusic.com/getTopArtists'
  		}).then(function (response) {

        $http({
    			method : "get",
    			url : 'http://obscurifymusic.com/getCountryUserCounts'
    		}).then(function (response) {
           var data = JSON.parse(response.data.body);
           for(var i = 0; i < data.length; i++){
              $scope.country_user_counts.push(data[i][0].fans);
              $scope.country_average_scores.push(Math.round(data[i][0].avg_score));
           }
    		}, function myError(response) {
            console.log(response);
        });

        var data = JSON.parse(response.data.body);
        var obscurify_top_artists_ids = [];
        for(var i = 0; i < data.length; i++){
          for(var j = 0; j < data[i].length; j++){
            if(data[i][j].top_artist != null){
              obscurify_top_artists_ids.push(data[i][j].top_artist);
              $scope.obscurify_top_artists_counts.push(data[i][j].fans);
            }
          }
        }
        $http({
    			method : "get",
    			url : 'https://api.spotify.com/v1/artists',
    			headers : {
    				"Authorization" : "Bearer " + access_token,
    				"Accept" : "application/json",
    			},
          params: { ids: obscurify_top_artists_ids.join()}
    		}).then(function (response) {
           $scope.obscurify_top_artists = response.data.artists;
    		}, function myError(response) {
            console.log("top artists error");
        });

  		}, function myError(response) {
          console.log("obscurify top artists error");
      });
  	}

    /*
    / This function gets called by 3 different places (short term analysis, long term analyis and getGlobalData)
    / when their data returns from their HTTP calls. All of the variables set in the chart are already initialized
    / to be 0 so it's okay if this function is called before data comes in, it'll just draw a chart with no bar
    */
    function drawBarChart() {
           var data = google.visualization.arrayToDataTable([
             ['Aspect', 'Recent', 'All', 'Average'],
             ['Energy', energyST, energyLT, energyGlobal],
             ['Happiness', happinessST, happinessLT, happinessGlobal],
             ['Danceability', danceabilityST, danceabilityLT, danceabilityGlobal],
             ['Acousticness', acousticnessST, acousticnessLT, acousticnessGlobal]
           ]);

          var options = {
            bar: {groupWidth: "70%"},
            legend: { position: "bottom", textStyle : {color : "#F5F5F5"} },
            backgroundColor: "#303030",
            hAxis : { textStyle : {color : "#F5F5F5"} },
            vAxis : { textStyle : {color : "#F5F5F5"} },
            chartArea : {top : 10, backgroundColor: "#303030" },
            colors: ['#512da8','#f44336','#00c853']
          };
          var chart = new google.visualization.ColumnChart(document.getElementById("columnchart"));
          chart.draw(data, options);
    }


    $scope.makeAllTimePlaylist = function(){
  		$http({
  			method : "post",
  			url : 'https://api.spotify.com/v1/users/' + user_id + '/playlists',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json"
  			},
  			data: { name: 'All-Time Top Tracks // Obscurify' }
  		}).then(function (response) {
  			//console.log(response);
  			var playlist_id = response.data.id;
  			var uri_array = [];
  			for(var i = 0; i < $scope.long_term_tracks.length; i++){
  				uri_array.push($scope.long_term_tracks[i].uri);
  			}
  			$http({
  			method : "post",
  			url : 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + playlist_id + '/tracks',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json"
  			},
  			data: { uris: uri_array }
  			}).then(function (response) {
  				//console.log(response);
          alert("Playlist created, give Spotify a little time to update!");
  			});
  		});
    }

    $scope.makeSixWeekPlaylist = function(){
  		var dateObj = new Date();
  		var month = dateObj.getMonth() + 1; //months from 1-12
  		var day = dateObj.getDate();
  		var year = dateObj.getFullYear();
  		var newdate = month + "/" + day + "/" + year;
  		$http({
  			method : "post",
  			url : 'https://api.spotify.com/v1/users/' + user_id + '/playlists',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json"
  			},
  			data: { name: 'Six Week: ' + newdate + ' // Obscurify' }
  			}).then(function (response) {
  			//console.log(response);
  			var playlist_id = response.data.id;
  			var uri_array = [];
  			for(var i = 0; i < $scope.short_term_tracks.length; i++){
  				uri_array.push($scope.short_term_tracks[i].uri);
  			}
  			$http({
  			method : "post",
  			url : 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + playlist_id + '/tracks',
  			headers : {
  				"Authorization" : "Bearer " + access_token,
  				"Accept" : "application/json"
  			},
  			data: { uris: uri_array }
  			}).then(function (response) {
  				//console.log(response);
          alert("Playlist created, give Spotify a little time to update!");
  			});
  		});
    }

    /*
    / Simply posts all the following data to the database. Should be called after
    / getProfile -> getLongTermArtists -> getLongTermTracks -> getLongTermTrackAnalysis
    */
    var postHistory = function(){
      var d = new Date();
      var n = d.getDate();
      var end_month = d.getMonth();
      var start_month = end_month - 1;
      var year = d.getFullYear();
      if(n < 6){
        start_month = start_month - 1;
        end_month = end_month - 1;
      }
      if(end_month < 0){ end_month = end_month + 12;}
      if(start_month < 0){ start_month = start_month + 12;}

     $http({
       method : "POST",
       url : 'http://obscurifymusic.com/postHistory',
       params : {
         "user_id" : user_id, //from getProfile
         "start_month" : start_month,
         "end_month" : end_month,
         "artist_ids" : short_term_artist_ids.join(),
         "track_ids" : short_term_ids.join(),
         "year" : year
       }
     }).then(function (response) {
         //console.log(response);
     }, function myError(response) {
         console.log(response);
     });
   }

   var getHistory = function() {
      $http({
        method : "POST",
        url : 'http://obscurifymusic.com/getHistory',
        params : {
          "user_id" : user_id
        }
      }).then(function (response) {
          console.log(JSON.parse(response.data.body));
      }, function myError(response) {
          console.log(response);
      });
   }


    /*
    /   This section runs first, at the init(), which loads the linechart of all users' scores and does getProfile
    /   which is responsible for kicking off a bunch of other Spotify API calls
    */
    var init = function(){
      getScores();
  		getProfile();

  	}
    init();

    /*
    / These two functions are just here to help. Like any good friend
    */
    var findStarRating = function(rating){
        if(rating >= 90){ return "★★★★★"; }
        else if(rating >= 80){ return "★★★★"; }
        else if(rating >= 65){ return "★★★"; }
        else if(rating >= 50){ return "★★";  }
        else if(rating >= 35){ return "★"; }
        else{ return ""; }
    }
    function Comparator(a, b) {
     if (a[1] > b[1]) return -1;
     if (a[1] < b[1]) return 1;
     return 0;
   }


  }

  homeController.$inject=['$scope', '$http', '$routeParams', '$window'];

  return homeController;
});
