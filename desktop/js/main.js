var app = angular.module('obscurify', ['ngRoute', 'ngAnimate']);

app.config(function($routeProvider,$compileProvider) {
    $routeProvider
        .when("/", {
            templateUrl : "desktop/partials/landing.html",
            controller : "loginController"
        })
        .when("/faq", {
            templateUrl : "desktop/partials/faq.html"
        })
        .when("/about", {
            templateUrl : "desktop/partials/about.html"
        })
        .when("/privacy", {
            templateUrl : "desktop/partials/privacy_policy.html"
        })
        .when("/error", {
            templateUrl : "desktop/partials/error.html"
        })
        .when("/home/:token", {
            templateUrl : "desktop/partials/home.html",
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
    $scope.trackNavClicked = function(){ $scope.trackNav = "active"; $scope.artistNav = "";};
    $scope.artistNavClicked = function(){ $scope.trackNav = ""; $scope.artistNav = "active";};
    $scope.currentMoodNav = "active";
    $scope.allTimeMoodNav = "";
    $scope.currentMoodNavClicked = function(){ $scope.currentMoodNav = "active"; $scope.allTimeMoodNav = "";};
    $scope.allTimeMoodNavClicked = function(){ $scope.currentMoodNav = ""; $scope.allTimeMoodNav = "active";};
    var recommendedTracks = [];
    $scope.userHistory = [];
    var hex = "";
    $scope.recommendedTrackDisplayGroup = []; //should have max size of 6
    $http({
        method : "get",
        url : 'https://obscurifymusic.com/spotifyData/' + $routeParams.token + '/getUserData'
    }).then(function (response) {
        if (response.data.displayName != null && response.data.displayName.indexOf(' ') > 0) {
            $scope.displayName = " " + response.data.displayName.substring(0, response.data.displayName.indexOf(' '));
        } else if (response.data.displayName != null) {
            $scope.displayName = " " + response.data.displayName;
        } else if (response.data.displayName == null) {
            $scope.displayName = "";
        }
        if (response.data.imageURL.length > 0) {
            $scope.imageURL = response.data.imageURL[0].url;
        } else {
            $scope.imageURL = null;
        }
        $scope.longTermArtists = response.data.longTermArtists;
        $scope.shortTermArtists = response.data.shortTermArtists;
        $scope.longTermTracks = response.data.longTermTracks;
        $scope.shortTermTracks = response.data.shortTermTracks;
        $scope.obscurifyScore = response.data.obscurifyScore;
        $scope.recentObscurifyScore = response.data.recentObscurifyScore;
        $scope.topGenres = response.data.topGenres;
        hex = response.data.hex;
        userID = response.data.userID;
        var longTermAudioFeatures = response.data.longTermAudioFeatures;
        var shortTermAudioFeatures = response.data.shortTermAudioFeatures;
        var audioFeatureAverages = response.data.audioFeatureAverages;
        for (key in audioFeatureAverages) {
          audioFeatureAverages[key] = audioFeatureAverages[key].N;
        }
        $scope.userCountByCountry = response.data.userCountByCountry;
        $scope.percentileByCountry = Math.round(response.data.percentileByCountry);
        $scope.globalAverageScore = Math.round(response.data.globalAverageScore);
        $scope.totalUserCount = response.data.totalUserCount;
        $scope.shortTermHeader = "Current";
        $scope.country = response.data.country;
        recommendedTracks = response.data.recommendedTracks;
        if (recommendedTracks != null && recommendedTracks.length > 0) {
            $scope.showMoreClicked();
        }
        try {
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
        } catch(error) {}
        try {
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
        } catch(error) {}
        $scope.doneLoading = true;
    }, function myError(err) {
        $scope.doneLoading = true;
        console.log(err);
        //if it doesn't work, if your authorization code expired or anything, just go back to the start and log in again
        $window.location.href = 'https://obscurifymusic.com/';
    });

    $scope.makePlaylist = function(allTimeSelected) {
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var playlistName = "";
        if (allTimeSelected) {
            playlistName = "All Time Top Tracks // Obscurify";
        } else if ($scope.shortTermHeader != "Current") {
            playlistName = $scope.shortTermHeader + ' // Obscurify';
        } else {
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
            var playlist_id = response.data.id;
            var uri_array = [];
            var tracksSelected = [];
            if (allTimeSelected) {
                tracksSelected = $scope.longTermTracks;
            } else {
                tracksSelected = $scope.shortTermTracks;
            }
            for (var i = 0; i < tracksSelected.length; i++) {
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
            }).then(function () {
                alert("Playlist '" + playlistName + "' created!");
            });
        });
    };

    $scope.getUserHistory = function() {
      if ($scope.userHistory.length == 0) {
        $http({
            method : "get",
            url : "https://obscurifymusic.com/api/getUserHistory?userID=" + userID + "&hex=" + hex
        }).then(function (response) {
            $scope.userHistory = response.data.userHistory;
            if ($scope.userHistory == undefined || $scope.userHistory.length == 0) {
              $scope.noUserHistoryFlag = true;
            }
        });
      }
    }

    $scope.historySelected = function(history) {
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
        });
    };

    $scope.showMoreClicked = function() {
        $scope.recommendedTrackDisplayGroup = [];
        for (var i = 0; i < 6; i++) {
            var track = recommendedTracks.pop();
            recommendedTracks.unshift(track);
            $scope.recommendedTrackDisplayGroup.push(track);
        }
    };

    var findBarCSSClass = function(ratio) {
        if (ratio > 1.8) {return "equalizer-container level-nine"; }
        else if (ratio > 1.4) {return "equalizer-container level-eight"; }
        else if (ratio > 1.15) {return "equalizer-container level-seven"; }
        else if (ratio > 1.05) {return "equalizer-container level-six"; }
        else if (ratio > 0.95) {return "equalizer-container level-five"; }
        else if (ratio > 0.85) {return "equalizer-container level-four"; }
        else if (ratio > 0.6) {return "equalizer-container level-three"; }
        else if (ratio > 0.4) {return "equalizer-container level-two"; }
        else { return "equalizer-container level-one"; }
    };

    var findMoodDescriptor = function(ratio) {
        if (ratio > 1.01) {
            var percentDifference = ratio * 100 - 100;
            return percentDifference.toFixed(1) + "% higher";
        }
        else if (ratio < 0.99) {
            var percentDifference = 100 - ratio * 100;
            return percentDifference.toFixed(1) + "% lower";
        }
        else {
            return "right on";
        }
    };

});


app.controller('loginController', function($scope) {
    $scope.mobileDetected = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
});
