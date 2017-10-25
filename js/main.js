var app = angular.module('obscurify', ['ngRoute']);

app.controller('mainController', function($scope, $http, $window) {
	
	var access_token = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
	if(access_token.indexOf('#') > 0){
		//weird case when the callback appends #!#_=_ to the end of the token, so just strip it
		//TODO: understand why this happens
		access_token = access_token.substring(0, access_token.indexOf('#'));
	}
	
	$scope.displayName = "";	$scope.imageURL = "";	$scope.longTermArtists = [];
	$scope.shortTermArtists = [];	$scope.longTermTracks = [];	$scope.shortTermTracks = [];
	$scope.obscurifyScore = null;	$scope.topGenres = [];
	
	$http({
  			method : "get",
  			url : 'http://67.205.147.250/home/' + access_token + '/getUserData'
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

  		}, function myError(response) {
			console.log(response);		  
			//if it doesn't work, if your authorization code expired or anything, just go back to the start and log in again
			$window.location.href = 'http://67.205.147.250';
      });
	  

});