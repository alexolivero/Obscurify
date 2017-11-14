var app = angular.module('obscurify', ['ngRoute', 'ngAnimate']);

app.config(function($routeProvider,$compileProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "partials/landing.html"
    })
	.when("/faq", {
        templateUrl : "partials/faq.html"
    })
	.when("/about", {
        templateUrl : "partials/about.html"
    })
	.when("/error", {
        templateUrl : "partials/error.html"
    })
    .when("/home/:token", {
        templateUrl : "partials/home.html",
		controller : "mainController"
    });
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|spotify):/);
});

app.controller('mainController', function($scope, $http, $window, $routeParams) {

	$scope.doneLoading = false;
	var userID = null;
	
	//to control whether "Artists" or "Tracks" has a line-through
	$scope.trackNav = "";
	$scope.artistNav = "active";
	$scope.trackNavClicked = function(){ $scope.trackNav = "active"; $scope.artistNav = "";}
	$scope.artistNavClicked = function(){ $scope.trackNav = ""; $scope.artistNav = "active";}
	
	$scope.currentMoodNav = "active";
	$scope.allTimeMoodNav = "";
	$scope.currentMoodNavClicked = function(){ $scope.currentMoodNav = "active"; $scope.allTimeMoodNav = "";}
	$scope.allTimeMoodNavClicked = function(){ $scope.currentMoodNav = ""; $scope.allTimeMoodNav = "active";}
	
	var recommendedTracks = [];
	$scope.recommendedTrackDisplayGroup = []; //should have max size of 6
		
	$http({
  			method : "get",
  			url : 'https://obscurifymusic.com/spotifyData/' + $routeParams.token + '/getUserData'
  		}).then(function (response) {
			
			console.log(response);
			
			if(response.data.displayName != null && response.data.displayName.indexOf(' ') > 0){
				response.data.displayName = response.data.displayName.substring(0, response.data.displayName.indexOf(' '));
			}
			$scope.displayName = response.data.displayName;
			if(response.data.imageURL.length > 0){
				$scope.imageURL = response.data.imageURL[0].url;
			}			
			$scope.longTermArtists = response.data.longTermArtists;
			$scope.shortTermArtists = response.data.shortTermArtists;
			$scope.longTermTracks = response.data.longTermTracks;
			$scope.shortTermTracks = response.data.shortTermTracks;
			$scope.obscurifyScore = response.data.obscurifyScore;
			$scope.recentObscurifyScore = response.data.recentObscurifyScore;
			$scope.topGenres = response.data.topGenres;
			userID = response.data.userID;
			var longTermAudioFeatures = response.data.longTermAudioFeatures;
			var shortTermAudioFeatures = response.data.shortTermAudioFeatures;
			var audioFeatureAverages = response.data.audioFeatureAverages;
			$scope.userCountByCountry = response.data.userCountByCountry;
			$scope.percentileByCountry = Math.trunc(response.data.percentileByCountry);
			$scope.globalAverageScore = Math.round(response.data.globalAverageScore);
			$scope.totalUserCount = response.data.totalUserCount;
			$scope.country = response.data.country;
			recommendedTracks = response.data.recommendedTracks;
			if(recommendedTracks != null && recommendedTracks.length > 0){
				$scope.showMoreClicked();
			}			
			
			try{
				var longTermHappinessRatio = longTermAudioFeatures.happiness / audioFeatureAverages.happiness;
				var longTermEnergyRatio = longTermAudioFeatures.energy / audioFeatureAverages.energy;
				var longTermDanceabilityRatio = longTermAudioFeatures.danceability / audioFeatureAverages.danceability;
				var longTermAcousticnessRatio = longTermAudioFeatures.acousticness / audioFeatureAverages.acousticness;
				
				var shortTermHappinessRatio = shortTermAudioFeatures.happiness / audioFeatureAverages.happiness;
				var shortTermEnergyRatio = shortTermAudioFeatures.energy / audioFeatureAverages.energy;
				var shortTermDanceabilityRatio = shortTermAudioFeatures.danceability / audioFeatureAverages.danceability;
				var shortTermAcousticnessRatio = shortTermAudioFeatures.acousticness / audioFeatureAverages.acousticness;
				
				$scope.longTermHappinessLevel = findBarCSSClass(longTermHappinessRatio);
				$scope.longTermAcousticnessLevel = findBarCSSClass(longTermAcousticnessRatio);
				$scope.longTermDanceabilityLevel = findBarCSSClass(longTermDanceabilityRatio);
				$scope.longTermEnergyLevel = findBarCSSClass(longTermEnergyRatio);
				
				$scope.shortTermHappinessLevel = findBarCSSClass(shortTermHappinessRatio);
				$scope.shortTermAcousticnessLevel = findBarCSSClass(shortTermAcousticnessRatio);
				$scope.shortTermDanceabilityLevel = findBarCSSClass(shortTermDanceabilityRatio);
				$scope.shortTermEnergyLevel = findBarCSSClass(shortTermEnergyRatio);
				
				$scope.shortTermHappinessDescriptor = findMoodDescriptor(shortTermHappinessRatio);
				$scope.shortTermEnergyDescriptor = findMoodDescriptor(shortTermEnergyRatio);
				$scope.shortTermDanceabilityDescriptor = findMoodDescriptor(shortTermDanceabilityRatio);
				$scope.shortTermAcousticnessDescriptor = findMoodDescriptor(shortTermAcousticnessRatio);
				$scope.longTermHappinessDescriptor = findMoodDescriptor(longTermHappinessRatio);
				$scope.longTermEnergyDescriptor = findMoodDescriptor(longTermEnergyRatio);
				$scope.longTermDanceabilityDescriptor = findMoodDescriptor(longTermDanceabilityRatio);
				$scope.longTermAcousticnessDescriptor = findMoodDescriptor(longTermAcousticnessRatio);
			}
			catch(error){
				console.log(error);
				$window.location.href = 'https://obscurifymusic.com/#!/error';
			}
			
			$scope.doneLoading = true;					

  		}, function myError(response) {
			$scope.doneLoading = true;
			console.log(response);		  
			//if it doesn't work, if your authorization code expired or anything, just go back to the start and log in again
			$window.location.href = 'https://obscurifymusic.com';
        });

	$scope.makePlaylist = function(allTimeSelected){
	
		var playlistName = "";
		if(allTimeSelected){
			playlistName = "All Time Top Tracks // Obscurify";
		}
		else{
			var dateObj = new Date();
			var month = dateObj.getMonth() + 1; //months from 1-12
			var day = dateObj.getDay();
			var year = dateObj.getFullYear();
			var newdate = month + "." + day + "." + year;
			playlistName = newdate + ' // Obscurify';
		}
  		$http({
  			method : "post",
  			url : 'https://api.spotify.com/v1/users/' + userID + '/playlists',
  			headers : {
  				"Authorization" : "Bearer " + $routeParams.token,
  				"Accept" : "application/json"
  			},
  			data: { name: playlistName }
  			}).then(function (response) {
  			//console.log(response);
  			var playlist_id = response.data.id;
  			var uri_array = [];
			
			var tracksSelected = [];
			if(allTimeSelected){
				tracksSelected = $scope.longTermTracks;
			}
			else{
				tracksSelected = $scope.shortTermTracks;
			}
  			for(var i = 0; i < tracksSelected.items.length; i++){
  				uri_array.push(tracksSelected.items[i].uri);
  			}
  			$http({
  			method : "post",
  			url : 'https://api.spotify.com/v1/users/' + userID + '/playlists/' + playlist_id + '/tracks',
  			headers : {
  				"Authorization" : "Bearer " + $routeParams.token,
  				"Accept" : "application/json"
  			},
  			data: { uris: uri_array }
  			}).then(function (response) {
  				//console.log(response);
				alert("Playlist '" + playlistName + "' created, give Spotify a little time to update!");
  			});
  		});
    }
	
	$scope.showMoreClicked = function(){
		$scope.recommendedTrackDisplayGroup = [];
		for(var i = 0; i < 6; i++){
			var track = recommendedTracks.pop();
			recommendedTracks.unshift(track);
			$scope.recommendedTrackDisplayGroup.push(track);
		}
	}
	
	var findBarCSSClass = function(ratio){
		
		if(ratio > 1.8){return "equalizer-container level-nine";}
		else if(ratio > 1.4){return "equalizer-container level-eight";}
		else if(ratio > 1.2){return "equalizer-container level-seven";}
		else if(ratio > 1.05){return "equalizer-container level-six";}
		else if(ratio > 0.95){return "equalizer-container level-five";}
		else if(ratio > 0.8){return "equalizer-container level-four";}
		else if(ratio > 0.6){return "equalizer-container level-three";}
		else if(ratio > 0.4){return "equalizer-container level-two";}
		else{ return "equalizer-container level-one";}
		
	}
	
	var findMoodDescriptor = function(ratio){
		
		if(ratio > 1.009){
			var percentDifference = ratio*100 - 100;
			return percentDifference.toFixed(1) + "% higher than";
		}
		else if(ratio < 0.999){
			var percentDifference = 100 - ratio*100;
			return percentDifference.toFixed(1) + "% lower than";
		}
		else{
			return "right at the"
		}
		
	}
	
	  

});