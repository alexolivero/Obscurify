define([], function() {
  function userHistoryHandler($scope, $http) {
	  
	  $scope.user_history = [];
	  
	  $scope.trackHistoryClicked = function(history){
	   $http({
    			method : "get",
    			url : 'https://api.spotify.com/v1/tracks',
    			headers : {
    				"Authorization" : "Bearer " + $scope.access_token,
    				"Accept" : "application/json",
    			},
          params: { ids: history.track_ids }
    		}).then(function (response) {
				$scope.trackSixWeekRangeHeader = history.end_month + " '" + history.year % 1000;
				$scope.short_term_tracks = [];
				$scope.short_term_track_popularity = [];
			    $scope.short_term_tracks = response.data.tracks;
			    for(var i = 0; i < response.data.tracks.length; i++){
					$scope.short_term_track_popularity.push($scope.findStarRating(response.data.tracks[i].popularity));
				}
    		}, function myError(response) {
            console.log("track history error");
		});
   }
   
   $scope.artistHistoryClicked = function(history){	   
	   $http({
    			method : "get",
    			url : 'https://api.spotify.com/v1/artists',
    			headers : {
    				"Authorization" : "Bearer " + $scope.access_token,
    				"Accept" : "application/json",
    			},
          params: { ids: history.artist_ids }
    		}).then(function (response) {
				$scope.artistSixWeekRangeHeader = history.end_month + " '" + history.year % 1000;
				$scope.short_term_artists = [];
				$scope.short_term_popularity = [];
				$scope.recent_obscurify_score = 0;
			    $scope.short_term_artists = response.data.artists;
			   
			   for(var i = 0; i < $scope.short_term_artists.length; i++){

				  $scope.recent_obscurify_score = $scope.recent_obscurify_score + (50/response.data.artists.length)*(parseInt(response.data.artists[i].popularity * (1 - i/response.data.artists.length)));
				  $scope.short_term_popularity.push($scope.findStarRating(response.data.artists[i].popularity));

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
				
				$scope.recent_obscurify_score = parseInt($scope.recent_obscurify_score / 10);
		   
    		}, function myError(response) {
            console.log("artist history error");
        });
   }
   
    $scope.getHistory = function() {
		$http({
			method : "POST",
			url : 'http://obscurifymusic.com/getHistory',
			params : {
			  "user_id" : $scope.user_id
			}
		}).then(function (response) {
			//console.log(JSON.parse(response.data.body));
			$scope.user_history = JSON.parse(response.data.body);
		}, function myError(response) {
			console.log(response);
		});
    }
	
	/*
    / Simply posts all the following data to the database. Should be called after
    / getProfile -> getLongTermArtists -> getLongTermTracks -> getLongTermTrackAnalysis
    */
    $scope.postHistory = function(){
      var d = new Date();
      var n = d.getDate();
      var end_month = d.getMonth();
      var start_month = end_month - 1;
      var year = d.getFullYear();
      if(n < 9){
        start_month = start_month - 1;
        end_month = end_month - 1;
      }
      if(end_month < 0){ end_month = end_month + 12;}
      if(start_month < 0){ start_month = start_month + 12;}

     $http({
       method : "POST",
       url : 'http://obscurifymusic.com/postHistory',
       params : {
         "user_id" : $scope.user_id, //from getProfile
         "start_month" : start_month,
         "end_month" : end_month,
         "artist_ids" : $scope.short_term_artist_ids.join(),
         "track_ids" : $scope.short_term_track_ids.join(),
         "year" : year
       }
     }).then(function (response) {
         //console.log(response);
     }, function myError(response) {
         console.log(response);
     });
   }
	  
  }

  userHistoryHandler.$inject=['$scope','$http'];

  return userHistoryHandler;
});
