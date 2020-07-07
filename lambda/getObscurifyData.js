// dependencies
var AWS = require('aws-sdk');

// Set the region
AWS.config.update({ region: 'us-east-2' });

// Create DynamoDB service object
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });


exports.handler = function(event, context, callback) {
    var obscurifyScore = event['queryStringParameters']['obscurifyScore'] || null;
    var recentObscurifyScore = event['queryStringParameters']['recentObscurifyScore'] || null;
    var code = event['queryStringParameters']['code'] || null;
    if (obscurifyScore == null || code == null || recentObscurifyScore == null) {
      return callback('provide parameters');
    }
    var audioFeatureAverages = {
      'danceability' : 0,
      'energy' : 0,
      'happiness' : 0,
      'acousticness' : 0
    };
    var percentileByCountryAllTime = 0;
    var percentileByCountryRecent = 0;
    let params = {
      TableName: 'countries',
      Key: {
        'code': { S: code }
      }
    };
    // Call DynamoDB to read the item from the table
    ddb.getItem(params, function(err, data) {
      if (err) {
        console.log("Error on countries read", err);
        callback(err);
      } else {
        console.log("Success", data.Item);
        if (data.Item == undefined) {
          percentileByCountryAllTime = null;
          percentileByCountryRecent = null;
          //values pulled from obscurify 1.0 global averages
      		audioFeatureAverages.danceability = 0.57;
      		audioFeatureAverages.energy = 0.65;
      		audioFeatureAverages.happiness = 0.45;
      		audioFeatureAverages.acousticness = 0.22;
        } else {
          var usersBelowAllTime = 0;
          var usersBelowRecent = 0;
          var value;
          Object.keys(data.Item.breakdown.M).forEach(function(key) {
              value = data.Item.breakdown.M[key];
              if (parseInt(key) < parseInt(obscurifyScore)) {
                usersBelowAllTime += parseInt(value.N);
              }
              if (parseInt(key) < parseInt(recentObscurifyScore)) {
                usersBelowRecent += parseInt(value.N);
              }
          });
          var usersAboveAllTime = data.Item.userCount.N - usersBelowAllTime;
          var usersAboveRecent = data.Item.userCount.N - usersBelowRecent;
    		  percentileByCountryAllTime = ( usersAboveAllTime / data.Item.userCount.N ) * 100;
    		  percentileByCountryRecent = ( usersAboveRecent / data.Item.userCount.N ) * 100;
          let globalParams = {
            TableName: 'global',
            Key: {
              'planet': { S: 'earth' }
            }
          };
          ddb.getItem(globalParams, function(err2, globalData) {
            if (err2 || globalData.Item.averageScore == undefined) {
                console.log("Error on global table get:", err);
                return callback(null, JSON.stringify({
                    "percentileByCountryAllTime" : null,
                    "percentileByCountryRecent" : null,
                    "globalAverageScore" : null,
                    "totalUserCount" : null,
                    "userCountByCountry" : null,
                    "audioFeatureAverages" : null,
                    "averageScore" : null,
                    "breakdown" : null
                  }));
            } else {
              callback(null, {
                  "statusCode": 200,
                  "headers": {
                      "X-Requested-With": '*',
                      "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
                      "Access-Control-Allow-Origin": '*',
                      "Access-Control-Allow-Methods": 'GET,OPTIONS'
                  },
                  "body": JSON.stringify({
                    "percentileByCountryAllTime" : percentileByCountryAllTime,
                    "percentileByCountryRecent" : percentileByCountryRecent,
                    "globalAverageScore" : globalData.Item.averageScore.N,
                    "totalUserCount" : globalData.Item.userCount.N,
                    "userCountByCountry" : data.Item.userCount.N,
                    "audioFeatureAverages" : data.Item.audioFeatureAverages.M,
                    "averageScore" : data.Item.averageScore.N,
                    "breakdown" : data.Item.breakdown.M
                  }),
              });
            }
          });
        }

      }
    });

};
