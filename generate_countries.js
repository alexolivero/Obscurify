////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// Utility that updates the 'countries' and 'global' tables based on 'users'  //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////


// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'us-east-2'});
// Create DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
var params = {
    TableName: "users",
    ProjectionExpression: "longTermAudioFeatures, country, obscurifyScore"
};
var requests = [];
var batches = [];
var countries = {}; // a country looks like:
// key -> country code, ex. "US"
// breakdown : [ { score of x : amount of users getting that score }, { } , ...]
// averageScore : 180
// userCount : 15,000
// audioFeatureAverages : audioFeatureAverages
var globalAverageScore = 0;
var globalUserCount = 0;
try {
  ddb.scan(params, onScan);
} catch (err) {
  console.log(err);
}
async function onScan(err, data) {
    var count = 0;
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Scan succeeded.");
        data.Items.forEach(function(user) {
            if (user.obscurifyScore != undefined) {
              globalAverageScore += parseInt(user.obscurifyScore.N);
              globalUserCount += 1;
              if (user.country.S in countries) {
                  var newUserCount = parseInt(countries[user.country.S].userCount) + 1;
                  var newTotalScore = parseFloat(countries[user.country.S].averageScore) * parseInt(countries[user.country.S].userCount) + parseFloat(user.obscurifyScore.N);
                  var oldAudioFeatureAverages = countries[user.country.S].audioFeatureAverages;
                  var newAudioFeatureAverages = {
                    'danceability' : { N: ((parseFloat(oldAudioFeatureAverages.danceability.N) * parseInt(countries[user.country.S].userCount) + parseFloat(user.longTermAudioFeatures.M.danceability.N)) / newUserCount).toString() },
                    'energy' : { N: ((parseFloat(oldAudioFeatureAverages.energy.N) * parseInt(countries[user.country.S].userCount) + parseFloat(user.longTermAudioFeatures.M.energy.N)) / newUserCount).toString() },
                    'happiness' : { N: ((parseFloat(oldAudioFeatureAverages.happiness.N) * parseInt(countries[user.country.S].userCount) + parseFloat(user.longTermAudioFeatures.M.happiness.N)) / newUserCount).toString() },
                    'acousticness' : { N: ((parseFloat(oldAudioFeatureAverages.acousticness.N) * parseInt(countries[user.country.S].userCount) + parseFloat(user.longTermAudioFeatures.M.acousticness.N)) / newUserCount).toString() }
                  };
                  var breakdown = countries[user.country.S].breakdown;
                  var key = user.obscurifyScore.N.toString();
                  if (key in breakdown) {
                      breakdown[key] = breakdown[key] + 1;
                  }
                  else {
                      breakdown[key] = 1;
                  }
                  countries[user.country.S] = {
                    "code" : user.country.S,
                    "breakdown" : breakdown,
                    "averageScore" : newTotalScore / newUserCount,
                    "userCount" : newUserCount,
                    "audioFeatureAverages" : newAudioFeatureAverages
                  }
              }
              else { //new country
                  var breakdown = {};
                  var key = user.obscurifyScore.N.toString();
                  breakdown[key] = 1;
                  countries[user.country.S] = {
                    'code' : user.country.S,
                    'breakdown' : breakdown,
                    'averageScore' : user.obscurifyScore.N,
                    'userCount' : 1,
                    'audioFeatureAverages' : user.longTermAudioFeatures.M
                  }
              }
            }
        });
        // continue scanning if we have more items
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            ddb.scan(params, onScan);
        } else {
          let params = {
              TableName: 'global',
              Item: {
                'planet' : { S: 'earth' },
                'userCount' : { N: globalUserCount.toString() },
                'averageScore' : { N: (globalAverageScore / globalUserCount).toString() }
              }
          };
          ddb.putItem(params, function(err, data) {
              if (err) {
                console.log(err);
              } else {
                console.log(data);
              }
          });
          for (country in countries) {
              Object.keys(countries[country].breakdown).forEach(function(key) {
                  countries[country].breakdown[key] = { N: countries[country].breakdown[key].toString() };
              });
              let request = {
                  PutRequest: {
                    Item: {
                      'code' : { S: countries[country].code },
                      'audioFeatureAverages' : { M: countries[country].audioFeatureAverages },
                      'averageScore' : { N: countries[country].averageScore.toString() },
                      'breakdown' : { M: countries[country].breakdown },
                      'userCount' : { N: countries[country].userCount.toString() }
                    }
                  }
              }
              requests.push(request);
          }
          batches = splitRecordsIntoBatches(requests);
          const dbResponse = await Promise.all(batches.map(batch => putRecordsIntoDynamo(batch)));
        }
    }

}


function putRecordsIntoDynamo(requests) {
  return new Promise(async(resolve, reject) => {
      var dbParams = {
          RequestItems: {
              "countries": requests
          }
      };
      let attemptCount = 0;
      var processItemsCallback = function(err, data) {
          if (err) {
              return reject(err);
          }
          else {
              var params = {};
              params.RequestItems = data.UnprocessedItems;
              if (Object.keys(params.RequestItems).length != 0 && attemptCount < 5) {
                  attemptCount += 1;
                  console.log("attempt #" + attemptCount + ": " + data);
                  ddb.batchWriteItem(params, processItemsCallback);
              }
              else {
                  console.log(data);
                  return resolve(data);
              }
          }
      };
      ddb.batchWriteItem(dbParams, processItemsCallback);
  });
}


function splitRecordsIntoBatches(records) {
    let batches = [];
    while (records.length > 0) {
        let batch = [];
        if (records.length > 25) {
            batch = records.slice(0, 25);
            records = records.slice(25, records.length);
        }
        else {
            batch = records;
            records = [];
        }
        batches.push(batch);
    }
    return batches;
}
