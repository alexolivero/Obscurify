var cron = require('cron');
var cronJob = cron.job("0 */2 * * *", function(){

  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("obscurify");
    var query = {  };
    dbo.collection("users").find(query, {
      //only supposed to specify what you DON'T want returned
      _id: false, userID: false, email: false, longTermArtistIDs:false, longTermTrackIDs:false, userHistory:false
      //country, obscurifyScore, longTermAudioFeatures are getting returned
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
          breakdown = {};
          var key = result[i].obscurifyScore.toString();
          breakdown[key] = 1;
          var country = {
            'code' : result[i].country,
            'breakdown' : breakdown,
            'averageScore' : result[i].obscurifyScore,
            'userCount' : 1,
            'audioFeatureAverages' : result[i].longTermAudioFeatures
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
          var key = result[i].obscurifyScore.toString();
          if(key in breakdown){
            breakdown[key] = breakdown[key] + 1;
          }
          else{
            breakdown[key] = 1;
          }

          countries[index] = {
            "code" : result[i].country,
            "breakdown" : breakdown,
            "averageScore" : newTotalScore / newUserCount,
            "userCount" : newUserCount,
            "audioFeatureAverages" : newAudioFeatureAverages
          }
        }
      }
      globalAverageScore /= result.length;

      MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("obscurify");

      for(var i = 0; i < countries.length; i++){

        dbo.collection("report").update(
          {code : countries[i].code},
          {$set:
            {
              "breakdown" : countries[i].breakdown,
              "averageScore" : countries[i].averageScore,
              "userCount" : countries[i].userCount,
              "audioFeatureAverages" : countries[i].audioFeatureAverages,
              "totalUserCount" : result.length,
              "globalAverageScore" : globalAverageScore
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
