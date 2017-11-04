var app = angular.module('obscurify', ['ngRoute']);

app.config(function($routeProvider,$compileProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "partials/spotify.html"
    })
    .when("/home/:token", {
        templateUrl : "partials/home.html",
		controller : "mainController"
    });
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|spotify):/);
});

app.controller('mainController', function($scope, $http, $window, $routeParams) {
	
	//variables to show on the UI
	$scope.displayName = "";
	$scope.imageURL = "";
	$scope.longTermArtists = [];
	$scope.shortTermArtists = [];
	$scope.longTermTracks = [];
	$scope.shortTermTracks = [];
	$scope.obscurifyScore = null;
	$scope.topGenres = [];
	$scope.userCountByCountry = "";
	$scope.percentileByCountry = "";
	$scope.globalAverageScore = "";
	$scope.totalUserCount = "";
	$scope.country = "";
	
	//to control whether "Artists" or "Tracks" has a line-through
	$scope.trackNav = "";
	$scope.artistNav = "active";
	$scope.trackNavClicked = function(){ $scope.trackNav = "active"; $scope.artistNav = "";}
	$scope.artistNavClicked = function(){ $scope.trackNav = ""; $scope.artistNav = "active";}
		
	$http({
  			method : "get",
  			url : 'http://67.205.147.250/spotifyData/' + $routeParams.token + '/getUserData'
  		}).then(function (response) {
			
			console.log(response);
			
			if(response.data.displayName.indexOf(' ') > 0){
				response.data.displayName = response.data.displayName.substring(0, response.data.displayName.indexOf(' '));
			}
			$scope.displayName = response.data.displayName;
			$scope.imageURL = response.data.imageURL[0].url;
			$scope.longTermArtists = response.data.longTermArtists;
			$scope.shortTermArtists = response.data.shortTermArtists;
			$scope.longTermTracks = response.data.longTermTracks;
			$scope.shortTermTracks = response.data.shortTermTracks;
			$scope.obscurifyScore = response.data.obscurifyScore;
			$scope.topGenres = response.data.topGenres;
			var longTermAudioFeatures = response.data.longTermAudioFeatures;
			var shortTermAudioFeatures = response.data.shortTermAudioFeatures;
			var audioFeatureAverages = response.data.audioFeatureAverages;
			$scope.userCountByCountry = response.data.userCountByCountry;
			$scope.percentileByCountry = response.data.percentileByCountry;
			$scope.globalAverageScore = response.data.globalAverageScore;
			$scope.totalUserCount = response.data.totalUserCount;
			$scope.country = response.data.country;

			// var moodRingData = [
					  // [//Current
						// {axis:"Energy",value : shortTermAudioFeatures.energy},
						// {axis:"Happiness",value : shortTermAudioFeatures.happiness},
						// {axis:"Danceability",value : shortTermAudioFeatures.danceability},
						// {axis:"Acousticness",value : shortTermAudioFeatures.acousticness}			
					  // ],[//All Time
						// {axis:"Energy",value : longTermAudioFeatures.energy},
						// {axis:"Happiness",value : longTermAudioFeatures.happiness},
						// {axis:"Danceability",value : longTermAudioFeatures.danceability},
						// {axis:"Acousticness",value : longTermAudioFeatures.acousticness}	
					  // ],[//Obscurify Average
						// {axis:"Energy",value : audioFeatureAverages.energy},
						// {axis:"Happiness",value : audioFeatureAverages.happiness},
						// {axis:"Danceability",value : audioFeatureAverages.danceability},
						// {axis:"Acousticness",value : audioFeatureAverages.acousticness}	
					  // ]
					// ];
					

  		}, function myError(response) {
			console.log(response);		  
			//if it doesn't work, if your authorization code expired or anything, just go back to the start and log in again
			$window.location.href = 'http://67.205.147.250';
      });
	  

});