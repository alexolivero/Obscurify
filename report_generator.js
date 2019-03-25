var cron = require('cron');

//run this cron task every 2 hours
var cronJob = cron.job("0 */2 * * *", function(){

  const MongoClient = require('mongodb').MongoClient;
  var countries = {}; // a country looks like:
  // key -> country code, ex. "US"
  // breakdown : [ { score of x : amount of users getting that score }, { } , ...]
  // averageScore : 180
  // userCount : 15,000
  // audioFeatureAverages : audioFeatureAverages

  var globalAverageScore = 0;
  var globalUserCount = 0;

  generateReport();

  async function generateReport() {
    try{
        const db = await MongoClient.connect('mongodb://localhost:27017/obscurify');

        const cursor = db.collection('users').find({},{_id: false, userID: false, email: false, longTermTrackIDs:false, userHistory:false});
        for (let user = await cursor.next(); user != null; user = await cursor.next()) {
            globalAverageScore += user.obscurifyScore;
            globalUserCount += 1;
            if(user.country in countries){
                var newUserCount = countries[user.country].userCount + 1;
                var newTotalScore = countries[user.country].averageScore * countries[user.country].userCount + user.obscurifyScore;
                var oldAudioFeatureAverages = countries[user.country].audioFeatureAverages;
                var newAudioFeatureAverages = {
                  'danceability' : (oldAudioFeatureAverages.danceability * countries[user.country].userCount + user.longTermAudioFeatures.danceability) / newUserCount,
                  'energy' : (oldAudioFeatureAverages.energy * countries[user.country].userCount + user.longTermAudioFeatures.energy) / newUserCount,
                  'happiness' : (oldAudioFeatureAverages.happiness * countries[user.country].userCount + user.longTermAudioFeatures.happiness) / newUserCount,
                  'acousticness' : (oldAudioFeatureAverages.acousticness * countries[user.country].userCount + user.longTermAudioFeatures.acousticness) / newUserCount
                };
                var breakdown = countries[user.country].breakdown;
                var topArtistIDs = countries[user.country].topArtistIDs;
                var key = user.obscurifyScore.toString();
                if(key in breakdown){
                  breakdown[key] = breakdown[key] + 1;
                }
                else{
                  breakdown[key] = 1;
                }

                for(var artistIndex = 0; artistIndex < 10; artistIndex++){ //just consider user's top 10 all-time artists
                  var artistID = user.longTermArtistIDs[artistIndex];
                  if(artistID in topArtistIDs){
                    topArtistIDs[artistID] = topArtistIDs[artistID] + 1;
                  }
                  else{
                    topArtistIDs[artistID] = 1;
                  }
                }

                countries[user.country] = {
                  "code" : user.country,
                  "breakdown" : breakdown,
                  "averageScore" : newTotalScore / newUserCount,
                  "userCount" : newUserCount,
                  "audioFeatureAverages" : newAudioFeatureAverages,
                  "topArtistIDs" : topArtistIDs
                }
            }
            else{ //new country
                var breakdown = {};
                var topArtistIDs = {};
                var key = user.obscurifyScore.toString();
                breakdown[key] = 1;
                for(var artistIndex = 0; artistIndex < 10; artistIndex++){ //just consider user's top 10 all-time artists
                  var artistID = user.longTermArtistIDs[artistIndex];
                  if(artistID in topArtistIDs){
                    topArtistIDs[artistID] = topArtistIDs[artistID] + 1;
                  }
                  else{
                    topArtistIDs[artistID] = 1;
                  }
                }
                countries[user.country] = {
                  'code' : user.country,
                  'breakdown' : breakdown,
                  'averageScore' : user.obscurifyScore,
                  'userCount' : 1,
                  'audioFeatureAverages' : user.longTermAudioFeatures,
                  'topArtistIDs' : topArtistIDs
                }
            }
        }

        globalAverageScore /= globalUserCount;

        const url = "mongodb://localhost:27017/";
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("obscurify");

            for (var country in countries) {
                if (countries.hasOwnProperty(country)) {

                    //narrow topArtistIDs "artist id : count" map down to topArtistIDsArray
                    var topArtistIDsArray = [];
                    for(var a in country.topArtistIDs){
                      topArtistIDsArray.push([a,country.topArtistIDs[a]]);
                    }

          			topArtistIDsArray.sort(Comparator);
          			topArtistIDsArray = topArtistIDsArray.splice(0,10);
          			var topTenArtistIDsArray = [];
          			for(var j = 0; j < topArtistIDsArray.length; j++){
          				topTenArtistIDsArray.push(topArtistIDsArray[j][0]);
          			}

                    dbo.collection("report").update(
                      {code : country.code},
                      {$set:
                        {
                          "breakdown" : country.breakdown,
                          "averageScore" : country.averageScore,
                          "userCount" : country.userCount,
                          "audioFeatureAverages" : country.audioFeatureAverages,
                          "totalUserCount" : globalUserCount,
                          "globalAverageScore" : globalAverageScore,
                          "topArtistIDs" : topTenArtistIDsArray
                        }
                      },
                      { upsert: true}
                    )

                }
            }
        });

        console.log("total users: " + globalUserCount + " // " + new Date());

    }
    catch(e) {
        console.log(e);
    }

  }


  console.info('cron job completed');

});
cronJob.start();





//this is just used to sort the topGenres so the client doesn't have to
function Comparator(a, b) {
  if (a[1] > b[1]) return -1;
  if (a[1] < b[1]) return 1;
  return 0;
}
