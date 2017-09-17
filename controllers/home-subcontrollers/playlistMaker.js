define([], function() {
	function playlistMaker($scope, $http) {
	  
	  $scope.makeAllTimePlaylist = function(){
  		$http({
  			method : "post",
  			url : 'https://api.spotify.com/v1/users/' + $scope.user_id + '/playlists',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
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
  			url : 'https://api.spotify.com/v1/users/' + $scope.user_id + '/playlists/' + playlist_id + '/tracks',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
  				"Accept" : "application/json"
  			},
  			data: { uris: uri_array }
  			}).then(function (response) {
  				//console.log(response);
				alert("Playlist 'All-Time Top Tracks // Obscurify' created, give Spotify a little time to update!");
  			});
  		});
    }

    $scope.makeSixWeekPlaylist = function(){
  		var dateObj = new Date();
  		var month = dateObj.getMonth() + 1; //months from 1-12
  		var day = dateObj.getDate();
  		var year = dateObj.getFullYear();
  		var newdate = month + "." + year;
		var playlistName = newdate + ' // Obscurify';
		if($scope.trackSixWeekRangeHeader != "Current"){
			playlistName = $scope.trackSixWeekRangeHeader + ' // Obscurify';
		}
  		$http({
  			method : "post",
  			url : 'https://api.spotify.com/v1/users/' + $scope.user_id + '/playlists',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
  				"Accept" : "application/json"
  			},
  			data: { name: playlistName }
  			}).then(function (response) {
  			//console.log(response);
  			var playlist_id = response.data.id;
  			var uri_array = [];
  			for(var i = 0; i < $scope.short_term_tracks.length; i++){
  				uri_array.push($scope.short_term_tracks[i].uri);
  			}
  			$http({
  			method : "post",
  			url : 'https://api.spotify.com/v1/users/' + $scope.user_id + '/playlists/' + playlist_id + '/tracks',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
  				"Accept" : "application/json"
  			},
  			data: { uris: uri_array }
  			}).then(function (response) {
  				//console.log(response);
				alert("Playlist '" + playlistName + "' created, give Spotify a little time to update!");
  			});
  		});
    }
	  
	}

	playlistMaker.$inject=['$scope','$http'];

	return playlistMaker;
});
