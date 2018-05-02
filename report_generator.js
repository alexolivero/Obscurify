var cron = require('cron');

//run this cron task every 2 hours
var cronJob = cron.job("0 */2 * * *", function(){

  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("obscurify");
    var query = {  };
    dbo.collection("users").find(query, {
      //only supposed to specify what you DON'T want returned
      _id: false, userID: false, email: false, longTermTrackIDs:false, userHistory:false
      //country, obscurifyScore, longTermAudioFeatures, longTermArtistIDs are getting returned
    }).toArray(function(err, result) {
      if (err) throw err;

      var countries = []; // a country looks like:
      // code : "US"
      // breakdown : [ { score of x : amount of users getting that score }, { } , ...]
      // averageScore : 180
      // userCount : 15,000
      // audioFeatureAverages : audioFeatureAverages

      var globalAverageScore = 0;

      for(var i = 0; i < result.length; i++){
        globalAverageScore += result[i].obscurifyScore;

        //see if this user's country is already there
        var index = -1;
        for(var j = 0; j < countries.length; j++){
          if(result[i].country == countries[j].code){ index = j; }
        }



        if(index == -1){ //new country
          var breakdown = {};
          var topArtistIDs = {};
          var key = result[i].obscurifyScore.toString();
          breakdown[key] = 1;

          for(var artistIndex = 0; artistIndex < 10; artistIndex++){ //just consider user's top 10 all-time artists
            var artistID = result[i].longTermArtistIDs[artistIndex];
            if(artistID in topArtistIDs){
              topArtistIDs[artistID] = topArtistIDs[artistID] + 1;
            }
            else{
              topArtistIDs[artistID] = 1;
            }
          }


          var country = {
            'code' : result[i].country,
            'breakdown' : breakdown,
            'averageScore' : result[i].obscurifyScore,
            'userCount' : 1,
            'audioFeatureAverages' : result[i].longTermAudioFeatures,
            'topArtistIDs' : topArtistIDs
          }
          countries.push(country);

        }

        else{ //country is already in the countries array

          var newUserCount = countries[index].userCount + 1;
          var newTotalScore = countries[index].averageScore * countries[index].userCount + result[i].obscurifyScore;
          var oldAudioFeatureAverages = countries[index].audioFeatureAverages;
          var newAudioFeatureAverages = {
            'danceability' : (oldAudioFeatureAverages.danceability * countries[index].userCount + result[i].longTermAudioFeatures.danceability) / newUserCount,
            'energy' : (oldAudioFeatureAverages.energy * countries[index].userCount + result[i].longTermAudioFeatures.energy) / newUserCount,
            'happiness' : (oldAudioFeatureAverages.happiness * countries[index].userCount + result[i].longTermAudioFeatures.happiness) / newUserCount,
            'acousticness' : (oldAudioFeatureAverages.acousticness * countries[index].userCount + result[i].longTermAudioFeatures.acousticness) / newUserCount
          };
          var breakdown = countries[index].breakdown;
          var topArtistIDs = countries[index].topArtistIDs;
          var key = result[i].obscurifyScore.toString();
          if(key in breakdown){
            breakdown[key] = breakdown[key] + 1;
          }
          else{
            breakdown[key] = 1;
          }

          for(var artistIndex = 0; artistIndex < 10; artistIndex++){ //just consider user's top 10 all-time artists
            var artistID = result[i].longTermArtistIDs[artistIndex];
            if(artistID in topArtistIDs){
              topArtistIDs[artistID] = topArtistIDs[artistID] + 1;
            }
            else{
              topArtistIDs[artistID] = 1;
            }
          }

          countries[index] = {
            "code" : result[i].country,
            "breakdown" : breakdown,
            "averageScore" : newTotalScore / newUserCount,
            "userCount" : newUserCount,
            "audioFeatureAverages" : newAudioFeatureAverages,
            "topArtistIDs" : topArtistIDs
          }
        }
      }
      globalAverageScore /= result.length;

      MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("obscurify");

      for(var i = 0; i < countries.length; i++){

        //narrow topArtistIDs "artist id : count" map down to topArtistIDsArray
        var topArtistIDsArray = [];
        for(var a in countries[i].topArtistIDs){
          topArtistIDsArray.push([a,countries[i].topArtistIDs[a]]);
        }

  			topArtistIDsArray.sort(Comparator);
  			topArtistIDsArray = topArtistIDsArray.splice(0,10);
  			var topTenArtistIDsArray = [];
  			for(var j = 0; j < topArtistIDsArray.length; j++){
  				topTenArtistIDsArray.push(topArtistIDsArray[j][0]);
  			}
        console.log(topArtistIDsArray);


        dbo.collection("report").update(
          {code : countries[i].code},
          {$set:
            {
              "breakdown" : countries[i].breakdown,
              "averageScore" : countries[i].averageScore,
              "userCount" : countries[i].userCount,
              "audioFeatureAverages" : countries[i].audioFeatureAverages,
              "totalUserCount" : result.length,
              "globalAverageScore" : globalAverageScore,
              "topArtistIDs" : topTenArtistIDsArray
            }
          },
          { upsert: true}
        )

      }

    });

      db.close();
    });
  });

    console.info('cron job completed');

});
cronJob.start();




//this is just used to sort the topGenres so the client doesn't have to
function Comparator(a, b) {
  if (a[1] > b[1]) return -1;
  if (a[1] < b[1]) return 1;
  return 0;
}
