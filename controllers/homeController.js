define([], function() {
  function homeController($scope, $http, $routeParams, $window, $controller) {
  
    $scope.access_token = $routeParams.token;
    $scope.user_id = "";
    $scope.imageURL = null; //just to display user's image, not recorded in database
    $scope.display_name = ""; //only displayed underneath the image, not recorded in database
    var user_country = ""; //to send to the database (to do stuff with in the future)
    $scope.user_count = "all"; //to be displayed under the "Average" at the top of the page
    $scope.obscurify_score = null;
    $scope.recent_obscurify_score = null;
    $scope.global_average = null;
    var top_artist = 0; //to be sent to the database
    

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

    $scope.doneLoading = false;
	
	$scope.artistSixWeekRangeHeader = "Current";
	$scope.trackSixWeekRangeHeader = "Current";

    

    

    $scope.long_term_track_ids = []; //used to send to Spotify's track analysis API for My Taste graph to get data on All-Time tracks
    $scope.short_term_track_ids = []; //used to send to Spotify's track analysis API for My Taste graph to get data on recent tracks
    $scope.short_term_artist_ids = [];

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
  				"Authorization" : "Bearer " + $scope.access_token,
          "Accept" : "application/json"
  			}
  		}).then(function (response) {
        //console.log(response);
        $scope.user_id = response.data.id;
        try {  $scope.imageURL = response.data.images[0].url; }
        catch(err) {  $scope.imageURL = "default-user-image.png"; }
        try{  $scope.display_name = response.data.display_name; }
        catch(err){}
        try{ user_country = response.data.country; }
        catch(err){}

        getLongTermArtists();
        $scope.getShortTermArtists(false);
        $scope.getHistory();

  		}, function myError(response) {
          console.log("get profile error");

          //if it doesn't work, if your authorization code expired or anything, just go back to the start and log in again
          $window.location.href = 'http://obscurifymusic.com';
      });
  	}

    $scope.getShortTermArtists = function(repeat){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
  				"Accept" : "application/json"
  			}
  		}).then(function (response) {
			
			if(repeat != false){
				$scope.short_term_artists = [];
				$scope.short_term_artist_ids = [];
				$scope.short_term_popularity = [];
				$scope.recent_obscurify_score = 0;
				$scope.artistSixWeekRangeHeader = "Current";
			}
			
			$scope.short_term_artists = response.data.items;

			for(var i = 0; i < $scope.short_term_artists.length; i++){
				  $scope.short_term_artist_ids.push($scope.short_term_artists[i].id);

				  $scope.recent_obscurify_score = $scope.recent_obscurify_score + (50/response.data.items.length)*(parseInt(response.data.items[i].popularity * (1 - i/response.data.items.length)));
				  $scope.short_term_popularity.push($scope.findStarRating(response.data.items[i].popularity));

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
			if(repeat == false){
				$scope.getShortTermTracks(false);
			}

  		}, function myError(response) {
          console.log("short-term artist error")
      });
  	}

    var getLongTermArtists = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
  				"Accept" : "application/json"
  			}
  		}).then(function (response) {
        $scope.long_term_artists = response.data.items;

        for(var i = 0; i < $scope.long_term_artists.length; i++){
            $scope.obscurify_score = $scope.obscurify_score + (50/response.data.items.length)*(parseInt(response.data.items[i].popularity * (1 - i/response.data.items.length)));
            $scope.long_term_popularity.push($scope.findStarRating(response.data.items[i].popularity));

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

  	$scope.getShortTermTracks = function(repeat){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
  				"Accept" : "application/json"
  			}
  		}).then(function (response) {
			
			if(repeat == true){
				$scope.short_term_track_popularity = [];
				$scope.short_term_tracks = [];
				$scope.short_term_track_ids = [];
				$scope.trackSixWeekRangeHeader = "Current";
			}
			
			//console.log(response);
			for(var i = 0; i < response.data.items.length; i++){
				$scope.short_term_track_popularity.push($scope.findStarRating(response.data.items[i].popularity));
				$scope.short_term_track_ids.push(response.data.items[i].id)
			}
			$scope.short_term_tracks = response.data.items;
			if(repeat == false){
				$scope.getShortTermTrackAnalysis();
				if($scope.short_term_track_ids.length > 0 && $scope.short_term_artist_ids.length > 0){
					$scope.postHistory();
				}
			}
			
  		});
  	}

  	var getLongTermTracks = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
  				"Accept" : "application/json"
  			}
  		}).then(function (response) {
        //console.log(response);
        for(var i = 0; i < response.data.items.length; i++){
            $scope.long_term_track_popularity.push($scope.findStarRating(response.data.items[i].popularity));
            $scope.long_term_track_ids.push(response.data.items[i].id)
        }
        $scope.long_term_tracks = response.data.items;
        $scope.getLongTermTrackAnalysis();

  		});
  	}

    

    

    $scope.getRecommendations = function(){
      if($scope.long_term_tracks.length > 9 && $scope.short_term_tracks.length > 9
        && $scope.long_term_artists.length > 9 && $scope.short_term_artists.length > 9){
    		$http({
    			method : "get",
    			url : 'https://api.spotify.com/v1/recommendations',
    			headers : {
    				"Authorization" : "Bearer " + $scope.access_token,
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
                if(i > 11 || ($scope.long_term_track_ids.indexOf(response.data.tracks[i].id) < 0 && $scope.short_term_track_ids.indexOf(response.data.tracks[i].id) < 0 ) ){
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
    $scope.postData = function(){
     $http({
       method : "POST",
       url : 'http://obscurifymusic.com/postData',
       params : {
         "user_id" : $scope.user_id, //from getProfile
         "user_country" : user_country, //from getProfile
         "top_artist" : top_artist, //from getLongTermArtists
         "obscurify_score" : $scope.obscurify_score, //from getLongTermArtists
         "happiness" : $scope.happinessLT, //getLongTermTrackAnalysis
         "energy" : $scope.energyLT, //getLongTermTrackAnalysis
         "acousticness" : $scope.acousticnessLT, //getLongTermTrackAnalysis
         "danceability" : $scope.danceabilityLT //getLongTermTrackAnalysis
       }
     }).then(function (response) {
       //console.log(response);
     }, function myError(response) {
         console.log(response);
     });
   }  


    /*
    /   This section runs first, at the init(), which loads the linechart of all users' scores and does getProfile
    /   which is responsible for kicking off a bunch of other Spotify API calls
    */
    var init = function(){
  		getProfile();
		$controller('controllers/home-subcontrollers/userHistoryHandler', {$scope: $scope, $http: $http});
		$controller('controllers/home-subcontrollers/graphHandler', {$scope: $scope, $http: $http});
		$controller('controllers/home-subcontrollers/playlistMaker', {$scope: $scope, $http: $http});
  	}
    init();

    /*
    / These two functions are just here to help. Like any good friend
    */
    $scope.findStarRating = function(rating){
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

  homeController.$inject=['$scope', '$http', '$routeParams', '$window', '$controller'];

  return homeController;
});
