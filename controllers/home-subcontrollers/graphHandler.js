define([], function() {
  function graphHandler($scope, $http) {
	  
	var lineChartData;
	  
	  /*
    /variables for the My Taste graph
    */
    var acousticnessST = 0; $scope.acousticnessLT = 0; var acousticnessGlobal = 0;
    var danceabilityST = 0; $scope.danceabilityLT = 0; var danceabilityGlobal = 0;
    var happinessST = 0; $scope.happinessLT = 0; var happinessGlobal = 0;
    var energyST = 0; $scope.energyLT = 0; var energyGlobal = 0;
	
	
	$scope.obscurify_top_artists = []; //goes hand in hand with $scope.obscurify_top_artists_counts, these are the artist objects
    $scope.obscurify_top_artists_counts = []; //to display the top artists at the bottom of the page, $scope.obscurify_top_artists[i]'s count of #1 listings
	
	$scope.country_user_counts = []; //count of users from 5 countries (US, Brazil, UK, Sweden, Australia)
    $scope.country_average_scores = [];//average scores of users from 5 countries
	  
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
		 getGlobalData();
         //call getTopArtists here because the HTML that goes with it is associated with
         //$scope.user_count so it'll all display at once with the correct percentage(not NaN)
         getTopArtists();
         var key = [];
         key.push("Score");
         key.push("Number of users");
         rawData.unshift(key);
         lineChartData = google.visualization.arrayToDataTable(rawData);
       }, function myError(response) {
           console.log(response);
       });
    }
	  
	  /*
    / This function gets called by 3 different places (short term analysis, long term analyis and getGlobalData)
    / when their data returns from their HTTP calls. All of the variables set in the chart are already initialized
    / to be 0 so it's okay if this function is called before data comes in, it'll just draw a chart with no bar
    */
    $scope.drawBarChart = function() {
	   var data = google.visualization.arrayToDataTable([
		 ['Aspect', 'Current', 'All-time', 'Global Average'],
		 ['Energy', energyST, $scope.energyLT, energyGlobal],
		 ['Happiness', happinessST, $scope.happinessLT, happinessGlobal],
		 ['Danceability', danceabilityST, $scope.danceabilityLT, danceabilityGlobal],
		 ['Acousticness', acousticnessST, $scope.acousticnessLT, acousticnessGlobal]
	   ]);

	  var options = {
		bar: {groupWidth: "70%"},
		legend: { position: "bottom", textStyle : {color : "#F5F5F5"} },
		backgroundColor: "#303030",
		hAxis : { textStyle : {color : "#F5F5F5"} },
		vAxis : { textStyle : {color : "#F5F5F5"} },
		chartArea : {top : 10, left : 20, right : 20, backgroundColor: "#303030" },
		colors: ['#512da8','#f44336','#00c853']
	  };
	  var chart = new google.visualization.ColumnChart(document.getElementById("columnchart"));
	  chart.draw(data, options);
    }
	
	$scope.drawLineChart = function() {
      var options = {
        legend: { position: 'none', textStyle: {color: '#F5F5F5', italic : false} },
        backgroundColor: "#303030",
        curveType: 'function',
        hAxis : {
			title : "Score",
			titleTextStyle: {color: "#F5F5F5"},
			textStyle : {color : "#F5F5F5"}
         },
       vAxis : {
		  title : "Number of users",
		  titleTextStyle: {color: "#F5F5F5"},
		  viewWindowMode : "maximized",
          textStyle : {color : "#F5F5F5"},
          gridlines : {color : "white"}
        },
        chartArea : {top : 10, left : 20, right : 20, backgroundColor: "#303030" },
        colors: ['#00c853']
      };
      var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
      chart.draw(lineChartData, options);
	  $scope.doneLoading = true;
    }
	
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
    				"Authorization" : "Bearer " + $scope.access_token,
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

     }, function myError(response) {
         console.log(response);
     });
   }
   
   $scope.getShortTermTrackAnalysis = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/audio-features',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
  				"Accept" : "application/json",
  			},
        params: { ids: $scope.short_term_track_ids.join() }
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

          $scope.drawBarChart();
          $scope.drawLineChart();
          $scope.getRecommendations();
  		});
  	}
	
	/*
    / Spotify needs the ids of the tracks you want in an array
    / Use the long_term_track_ids array populated by getLongTermTracks
    / Get the average for happiness, energy, etc.
    */
    $scope.getLongTermTrackAnalysis = function(){
  		$http({
  			method : "get",
  			url : 'https://api.spotify.com/v1/audio-features',
  			headers : {
  				"Authorization" : "Bearer " + $scope.access_token,
  				"Accept" : "application/json",
  			},
        params: { ids: $scope.long_term_track_ids.join() }
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
            $scope.happinessLT = happiness/response.data.audio_features.length;
            $scope.energyLT = energy/response.data.audio_features.length;
            $scope.danceabilityLT = danceability/response.data.audio_features.length;
            $scope.acousticnessLT = acousticness/response.data.audio_features.length;
          }
          catch(err){
            console.log("long term analysis error");
            alert("Something went wrong. You likely don't have enough Spotify history for Obscurify to work.");
          }

          //only data in database is from people who've got 30 or more long term tracks and artists
          if(response.data.audio_features.length > 29 && $scope.long_term_artists.length > 29){
            $scope.postData();
          }
          $scope.drawBarChart();
          $scope.drawLineChart();
  		});
  	}
	
	
	//init
	getScores();
	  
	  
  }

  graphHandler.$inject=['$scope', '$http'];

  return graphHandler;
});
