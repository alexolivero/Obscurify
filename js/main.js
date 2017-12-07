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
		
	$scope.countries = [
		{code: 'AU',	text: 'Australia', demonym: 'Australian'}, 
		{code: 'BR',	text: 'Brazil',	demonym: 'Brazilian'},
		{code: 'CA',	text: 'Canada',	demonym: 'Canadian' }, 
		{code: 'DK',	text: 'Denmark', demonym: 'Danish'}, 
		{code: 'FR',	text: 'France',	demonym: 'French'}, 
		{code: 'DE',	text: 'Germany', demonym: 'German'}, 
		{code: 'IT',	text: 'Italy', demonym: 'Italian'}, 
		{code: 'MX',	text: 'Mexico',	demonym: 'Mexican'}, 
		{code: 'NL',	text: 'Netherlands', demonym: 'Dutch'}, 
		{code: 'NZ',	text: 'New Zealand', demonym: 'New Zealand'}, 
		{code: 'NO',	text: 'Norway',	demonym: 'Norwegian'},
		{code: 'PL',	text: 'Poland',	demonym: 'Polish'}, 
		{code: 'PT',	text: 'Portugal', demonym: 'Portuguese'},
		{code: 'ES',	text: 'Spain', demonym: 'Spanish'}, 
		{code: 'SE',	text: 'Sweden',	demonym: 'Swedish'}, 
		{code: 'TR',	text: 'Turkey', demonym: 'Turkish'},
		{code: 'US',	text: 'United States',	demonym: 'US' }, 
		{code: 'GB',	text: 'United Kingdom',	demonym: 'UK' }
	];
		
	$http({
  			method : "get",
  			url : 'https://obscurifymusic.com/spotifyData/' + $routeParams.token + '/getUserData'
  		}).then(function (response) {
			
			console.log(response);
			
			if(response.data.displayName != null && response.data.displayName.indexOf(' ') > 0){
				$scope.displayName = " " + response.data.displayName.substring(0, response.data.displayName.indexOf(' '));
			}
			else if(response.data.displayName == null){
				$scope.displayName = "";
			}
			if(response.data.imageURL.length > 0){
				$scope.imageURL = response.data.imageURL[0].url;
			} else{
				$scope.imageURL = null;
			}			
			$scope.longTermArtists = response.data.longTermArtists.items;
			$scope.shortTermArtists = response.data.shortTermArtists.items;
			$scope.longTermTracks = response.data.longTermTracks.items;
			$scope.shortTermTracks = response.data.shortTermTracks.items;
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
			$scope.shortTermHeader = "Current";
			var country = response.data.country;
			$scope.countryDemonym = findCountryDemonymFromCode(response.data.country);
			$scope.countryBreakdown = null;
			recommendedTracks = response.data.recommendedTracks;			
			if(recommendedTracks != null && recommendedTracks.length > 0){
				$scope.showMoreClicked();
			}			
			$scope.userHistory = response.data.userHistory;
			
			try{
				var longTermHappinessRatio = longTermAudioFeatures.happiness / audioFeatureAverages.happiness;
				var longTermEnergyRatio = longTermAudioFeatures.energy / audioFeatureAverages.energy;
				var longTermDanceabilityRatio = longTermAudioFeatures.danceability / audioFeatureAverages.danceability;
				var longTermAcousticnessRatio = longTermAudioFeatures.acousticness / audioFeatureAverages.acousticness;
				
				$scope.longTermHappinessLevel = findBarCSSClass(longTermHappinessRatio);
				$scope.longTermAcousticnessLevel = findBarCSSClass(longTermAcousticnessRatio);
				$scope.longTermDanceabilityLevel = findBarCSSClass(longTermDanceabilityRatio);
				$scope.longTermEnergyLevel = findBarCSSClass(longTermEnergyRatio);
				
				$scope.longTermHappinessDescriptor = findMoodDescriptor(longTermHappinessRatio);
				$scope.longTermEnergyDescriptor = findMoodDescriptor(longTermEnergyRatio);
				$scope.longTermDanceabilityDescriptor = findMoodDescriptor(longTermDanceabilityRatio);
				$scope.longTermAcousticnessDescriptor = findMoodDescriptor(longTermAcousticnessRatio);
			}
			catch(error){}
				
			try{
				var shortTermHappinessRatio = shortTermAudioFeatures.happiness / audioFeatureAverages.happiness;
				var shortTermEnergyRatio = shortTermAudioFeatures.energy / audioFeatureAverages.energy;
				var shortTermDanceabilityRatio = shortTermAudioFeatures.danceability / audioFeatureAverages.danceability;
				var shortTermAcousticnessRatio = shortTermAudioFeatures.acousticness / audioFeatureAverages.acousticness;
				
				$scope.shortTermHappinessLevel = findBarCSSClass(shortTermHappinessRatio);
				$scope.shortTermAcousticnessLevel = findBarCSSClass(shortTermAcousticnessRatio);
				$scope.shortTermDanceabilityLevel = findBarCSSClass(shortTermDanceabilityRatio);
				$scope.shortTermEnergyLevel = findBarCSSClass(shortTermEnergyRatio);
				
				$scope.shortTermHappinessDescriptor = findMoodDescriptor(shortTermHappinessRatio);
				$scope.shortTermEnergyDescriptor = findMoodDescriptor(shortTermEnergyRatio);
				$scope.shortTermDanceabilityDescriptor = findMoodDescriptor(shortTermDanceabilityRatio);
				$scope.shortTermAcousticnessDescriptor = findMoodDescriptor(shortTermAcousticnessRatio);
			}
			catch(error){}
			
			//get country breakdown
			var countryCode = 'US';
			$scope.selectedCountry = $scope.countries[ $scope.countries.length - 2]; // US is default, and its second from last
			for(var i = 0 ; i < $scope.countries.length; i++){
				if(country == $scope.countries[i].code){
					countryCode = country;
					$scope.selectedCountry = $scope.countries[i];
					break;
				}
			}
			$scope.getCountryBreakdown(countryCode);
			
			$scope.doneLoading = true;					

  		}, function myError(response) {
			$scope.doneLoading = true;
			console.log(response);		  
			//if it doesn't work, if your authorization code expired or anything, just go back to the start and log in again
			$window.location.href = 'https://obscurifymusic.com';
        });

	$scope.makePlaylist = function(allTimeSelected){
		var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
			"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
		];
	
		var playlistName = "";
		if(allTimeSelected){
			playlistName = "All Time Top Tracks // Obscurify";
		}
		else if($scope.shortTermHeader != "Current"){
			playlistName = $scope.shortTermHeader + ' // Obscurify';
		}
		else{
			var dateObj = new Date();
			var month = monthNames[dateObj.getMonth()]; //months from 1-12
			var day = dateObj.getDay();
			var year = dateObj.getFullYear() % 100;
			var newdate = month + " " + day + " " + year;
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
  			for(var i = 0; i < tracksSelected.length; i++){
  				uri_array.push(tracksSelected[i].uri);
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
	
	$scope.historySelected = function(history){
		$http({
  			method : "get",
  			url : 'https://obscurifymusic.com/spotifyData/getHistoryItems?artistIDs=' +
				history.shortTermArtistIDs.join() + 
				"&trackIDs=" + history.shortTermTrackIDs.join() +
				"&accessToken=" + $routeParams.token
  			}).then(function (response) {
				$scope.shortTermHeader = history.formattedDate;
				$scope.shortTermArtists = response.data.artists;
				$scope.shortTermTracks = response.data.tracks;
				$scope.recentObscurifyScore = response.data.recentObscurifyScore;
  				console.log(response);
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
	
	$scope.getCountryBreakdown = function(code){
		$scope.countryBreakdown = [];
		$http({
			method : "get",
			url : 'https://obscurifymusic.com/api/getCountryBreakdown/' + code + '/' + $routeParams.token
		}).then(function (response) {
			$scope.countryBreakdown = response.data;
			console.log(response.data);
		}, function myError(err) {
			console.log(err);
		});	
	}
	
	var findBarCSSClass = function(ratio){
		
		if(ratio > 1.8){return "equalizer-container level-nine";}
		else if(ratio > 1.4){return "equalizer-container level-eight";}
		else if(ratio > 1.15){return "equalizer-container level-seven";}
		else if(ratio > 1.05){return "equalizer-container level-six";}
		else if(ratio > 0.95){return "equalizer-container level-five";}
		else if(ratio > 0.85){return "equalizer-container level-four";}
		else if(ratio > 0.6){return "equalizer-container level-three";}
		else if(ratio > 0.4){return "equalizer-container level-two";}
		else{ return "equalizer-container level-one";}
		
	}
	
	var findMoodDescriptor = function(ratio){
		
		if(ratio > 1.01){
			var percentDifference = ratio*100 - 100;
			return percentDifference.toFixed(1) + "% higher";
		}
		else if(ratio < 0.99){
			var percentDifference = 100 - ratio*100;
			return percentDifference.toFixed(1) + "% lower";
		}
		else{
			return "right at the"
		}
		
	}
	
	var findCountryDemonymFromCode = function(code){		
			
		for(var i = 0 ; i < $scope.countries.length; i++){
			if(code == $scope.countries[i].code){
				return $scope.countries[i].demonym;
				break;
			}
		}
		return code;
	}
	
	
	
	  

});