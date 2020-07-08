// dependencies
var AWS = require('aws-sdk');
var moment = require('moment');

// Set the region
AWS.config.update({ region: 'us-east-2' });

// Create DynamoDB service object
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var minDaysBetweenUpdateUser = 28;

exports.handler = function(event, context, callback) {
    var body = JSON.parse(event['body']);
    var country = body['country'] || null;
    var userID = body['userID'] || null;
    var longTermArtistIDs = body['longTermArtistIDs'] || null;
    var longTermTrackIDs = body['longTermTrackIDs'] || null;
    var obscurifyScore = body['obscurifyScore'] || null;
    var longTermAudioFeatures = body['longTermAudioFeatures'] || null;
    var shortTermArtistIDs = body['shortTermArtistIDs'] || null;
    var shortTermTrackIDs = body['shortTermTrackIDs'] || null;
    var hex = body['hex'] || null;
    if (country == null || longTermArtistIDs == null || longTermTrackIDs == null ||
        obscurifyScore == null || longTermAudioFeatures == null || hex == null) {
  		    callback('missing params');
  	}
  	var historyInstance = {
  		'shortTermArtistIDs' : shortTermArtistIDs,
  		'shortTermTrackIDs' : shortTermTrackIDs,
  		'formattedDate' : moment().format("MMM Do YY"),
  		'dayOfYear' : moment().dayOfYear(),
  		'year' : moment().year()
  	};
    var userHistory = [];
    var params = {
      TableName: 'users',
      Key: {
        'userID': { S: userID }
      },
      ProjectionExpression: 'userHistory, obscurifyScore, longTermAudioFeatures, hex'
    };
    ddb.getItem(params, function(err, data) {
      if (err) {
        console.log("Error on users table get:", err);
        return callback(err)
      } else if (data.Item.hex == undefined || data.Item.hex.S != hex) {
        return callback('hex probs')
      } else {
        longTermArtistIDs = longTermArtistIDs.map(id => ({"S" : id }) );
        longTermTrackIDs = longTermTrackIDs.map(id => ({"S" : id }) );
        for (let feature in longTermAudioFeatures) {
            longTermAudioFeatures[feature] = { "N" : longTermAudioFeatures[feature].toString() };
        }
        var formattedHistory = {};
        if ((shortTermArtistIDs == undefined || shortTermArtistIDs.length == 0)
            || (shortTermTrackIDs == undefined || shortTermTrackIDs.length == 0)) {
          //
        } else {
          shortTermArtistIDs = historyInstance.shortTermArtistIDs.map(id => ({"S" : id }) );
          shortTermTrackIDs = historyInstance.shortTermTrackIDs.map(id => ({"S" : id }) );
          formattedHistory.shortTermArtistIDs = { "L" : shortTermArtistIDs };
          formattedHistory.shortTermTrackIDs = { "L" : shortTermTrackIDs };
          formattedHistory.formattedDate = { "S" : historyInstance.formattedDate };
          formattedHistory.dayOfYear = { "N" : historyInstance.dayOfYear.toString() };
          formattedHistory.year = { "N" : historyInstance.year.toString() };
        }
        if (data.Item == undefined || data.Item.userHistory == undefined || data.Item.userHistory.L == undefined) {
              //user history not found in DB
              if (shortTermTrackIDs.length > 0 && formattedHistory.year != undefined) {
                userHistory.unshift( { "M" : formattedHistory} );
              }
              addOrUpdateUser(userHistory, longTermAudioFeatures, obscurifyScore.toString(),
                                    longTermTrackIDs, longTermArtistIDs, country, userID,
                                    true, null, null);
        } else {
            //existing user
            userHistory = data.Item.userHistory.L;
            if (userHistory.length == 0) {
              if (formattedHistory.year == undefined || formattedHistory.shortTermTrackIDs == undefined) {
                callback(null, {
                  "statusCode": 200,
                  "headers": {
                      "X-Requested-With": '*',
                      "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
                      "Access-Control-Allow-Origin": '*',
                      "Access-Control-Allow-Methods": 'POST,OPTIONS'
                  },
                  "body": JSON.stringify({"status" : "ok, no update history still empty"}),
              });
              } else {
                userHistory.unshift( { "M" : formattedHistory} );
                addOrUpdateUser(userHistory, longTermAudioFeatures, obscurifyScore.toString(),
                                    longTermTrackIDs, longTermArtistIDs, country, userID,
                                    false, data.Item.longTermAudioFeatures.M, data.Item.obscurifyScore.N);
              }
            } else if (moment().year() > userHistory[0].M.year.N || (moment().dayOfYear() - userHistory[0].M.dayOfYear.N > minDaysBetweenUpdateUser)) {
                if (formattedHistory.year != undefined && formattedHistory.shortTermTrackIDs != undefined) {
                  userHistory.unshift( { "M" : formattedHistory} );
                }
                addOrUpdateUser(userHistory, longTermAudioFeatures, obscurifyScore.toString(),
                                    longTermTrackIDs, longTermArtistIDs, country, userID,
                                    false, data.Item.longTermAudioFeatures.M, data.Item.obscurifyScore.N);
          	} else {
          	  callback(null, {
                  "statusCode": 200,
                  "headers": {
                      "X-Requested-With": '*',
                      "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
                      "Access-Control-Allow-Origin": '*',
                      "Access-Control-Allow-Methods": 'POST,OPTIONS'
                  },
                  "body": JSON.stringify({"status" : "ok, no update because last history is recent"}),
              });
          	}
        }
      }
    });


    function addOrUpdateUser(userHistory, longTermAudioFeatures, obscurifyScore,
                            longTermTrackIDs, longTermArtistIDs, country, userID,
                            newUserFlag, oldLongTermAudioFeatures, oldObscurifyScore) {
      let userParams = {
        TableName: 'users',
        Item: {
          'userID' : { S: userID },
          'hex' : { S: hex },
          'country' : { S: country },
          'longTermArtistIDs' : { L: longTermArtistIDs },
          'longTermTrackIDs' : { L: longTermTrackIDs },
          'obscurifyScore' : { N: obscurifyScore },
          'longTermAudioFeatures' : { M: longTermAudioFeatures },
          'userHistory' : { L: userHistory }
        }
      };
      ddb.putItem(userParams, function(err, userData) {
          if (err) {
            console.log("Error on user table insert:", err);
            callback(err)
          } else {
            //now update the countries table
            let countryParams = {
              TableName: 'countries',
              Key: {
                'code' : { S: country }
              }
            };
            ddb.getItem(countryParams, function(err2, countryData) {
              if (err2) {
                console.log("Error on countries table get:", err2);
                callback(err2)
              } else {
                  if (countryData.Item == undefined) {
                      addNewCountry(country, longTermAudioFeatures, obscurifyScore);
                  } else {
                      updateCountry(countryData.Item, longTermAudioFeatures, obscurifyScore,
                        newUserFlag, oldLongTermAudioFeatures, oldObscurifyScore);
                  }
              }
            });
          }
      });
    }

    function updateCountry(countryData, longTermAudioFeatures, obscurifyScore,
                          newUserFlag, oldLongTermAudioFeatures, oldObscurifyScore) {
        if (newUserFlag) {
            let breakdown = countryData.breakdown.M;
            if (breakdown[obscurifyScore.toString()]) {
                let newValue = parseInt(breakdown[obscurifyScore.toString()].N) + 1;
                breakdown[obscurifyScore.toString()] = { N: newValue.toString()};
            } else {
                breakdown[obscurifyScore.toString()] = { N: "1" };
            }
            let oldUserCount = parseInt(countryData.userCount.N);
            let oldAverageScore = parseFloat(countryData.averageScore.N);
            let averageScore = ((oldUserCount * oldAverageScore) + parseInt(obscurifyScore)) / (oldUserCount + 1);
            let userCount = (oldUserCount + 1).toString();
            let audioFeatureAverages = countryData.audioFeatureAverages.M;
            for (let key in audioFeatureAverages) {
                let oldAudioFeature = parseFloat(audioFeatureAverages[key].N);
                let audioFeature = ((oldUserCount * oldAudioFeature) + parseFloat(longTermAudioFeatures[key].N)) / (oldUserCount + 1);
                audioFeatureAverages[key].N = audioFeature.toString();
            }
            let params = {
                TableName: 'countries',
                Item: {
                  'code' : { S: countryData.code.S },
                  'audioFeatureAverages' : { M: audioFeatureAverages },
                  'averageScore' : { N: averageScore.toString() },
                  'breakdown' : { M: breakdown },
                  'userCount' : { N: userCount }
                }
            };
            ddb.putItem(params, function(err, data) {
                if (err) {
                  console.log("Error on country table update:", err);
                  callback(err)
                } else {
                  updateGlobalTable(true, obscurifyScore, null);
                }
            });
        } else {
          let breakdown = countryData.breakdown.M;
          if (breakdown[oldObscurifyScore.toString()]) {
              let newValue = parseInt(breakdown[oldObscurifyScore.toString()].N) - 1;
              breakdown[oldObscurifyScore.toString()] = { N: newValue.toString()};
          }
          if (breakdown[obscurifyScore.toString()]) {
              let newValue = parseInt(breakdown[obscurifyScore.toString()].N) + 1;
              breakdown[obscurifyScore.toString()] = { N: newValue.toString()};
          } else {
              breakdown[obscurifyScore.toString()] = { N: "1" };
          }
          let userCount = parseInt(countryData.userCount.N);
          let oldAverageScore = parseFloat(countryData.averageScore.N);
          let averageScore = ((userCount * oldAverageScore) - parseInt(oldObscurifyScore) + parseInt(obscurifyScore)) / userCount;
          let audioFeatureAverages = countryData.audioFeatureAverages.M;
          for (let key in audioFeatureAverages) {
              let oldAudioFeature = parseFloat(audioFeatureAverages[key].N);
              let audioFeature = ((userCount * oldAudioFeature) + parseFloat(longTermAudioFeatures[key].N) - parseFloat(oldLongTermAudioFeatures[key].N)) / userCount;
              audioFeatureAverages[key].N = audioFeature.toString();
          }
          let params = {
              TableName: 'countries',
              Item: {
                'code' : { S: countryData.code.S },
                'audioFeatureAverages' : { M: audioFeatureAverages },
                'averageScore' : { N: averageScore.toString() },
                'breakdown' : { M: breakdown },
                'userCount' : { N: userCount.toString() }
              }
          };
          ddb.putItem(params, function(err, data) {
              if (err) {
                console.log("Error on country table update:", err);
                callback(err)
              } else {
                updateGlobalTable(false, obscurifyScore, oldObscurifyScore);
              }
          });
        }
    }

    function addNewCountry(country, longTermAudioFeatures, obscurifyScore) {
        let breakdown = {};
        breakdown[obscurifyScore.toString()] = { N: "1" };
        if (longTermAudioFeatures["tracksCounted"]) { delete longTermAudioFeatures["tracksCounted"]; }
        let params = {
            TableName: 'countries',
            Item: {
              'code' : { S: country },
              'audioFeatureAverages' : { M: longTermAudioFeatures },
              'averageScore' : { N: obscurifyScore },
              'breakdown' : { M: breakdown },
              'userCount' : { N: "1" }
            }
        };
        ddb.putItem(params, function(err, data) {
            if (err) {
              console.log("Error on country table insert:", err);
              callback(err)
            } else {
              updateGlobalTable(true, obscurifyScore, null);
            }
        });
    }


    function updateGlobalTable(newUserFlag, obscurifyScore, oldObscurifyScore) {
        let params = {
          TableName: 'global',
          Key: {
            'planet' : { S: 'earth' }
          }
        };
        ddb.getItem(params, function(err, data) {
            if (err) {
              console.log("Error on global table get:", err);
              callback(err)
            } else {
                if (data.Item == undefined) {
                  let globalParams = {
                      TableName: 'global',
                      Item: {
                        'planet' : { S: 'earth' },
                        'userCount' : { N: '1' },
                        'averageScore' : { N: obscurifyScore.toString() }
                      }
                  };
                  ddb.putItem(globalParams, function(err2, globalData) {
                      if (err2) {
                        console.log("Error on global table insert:", err2);
                        callback(err2)
                      } else {
                        callback(null, {
                            "statusCode": 200,
                            "headers": {
                                "X-Requested-With": '*',
                                "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
                                "Access-Control-Allow-Origin": '*',
                                "Access-Control-Allow-Methods": 'POST,OPTIONS'
                            },
                            "body": JSON.stringify({"status" : "all clear -- fresh global table began"}),
                        });
                      }
                  });
                } else {
                    let averageScore = parseFloat(data.Item.averageScore.N);
                    let userCount = parseInt(data.Item.userCount.N);
                    if (newUserFlag && oldObscurifyScore == null) {
                        averageScore = ((userCount * averageScore) + parseInt(obscurifyScore)) / (userCount + 1);
                        userCount += 1;
                    } else {
                        averageScore = ((userCount * averageScore) - parseInt(oldObscurifyScore) + parseInt(obscurifyScore)) / userCount;
                    }
                    let globalParams = {
                        TableName: 'global',
                        Item: {
                          'planet' : { S: 'earth' },
                          'userCount' : { N: userCount.toString() },
                          'averageScore' : { N: averageScore.toString() }
                        }
                    };
                    ddb.putItem(globalParams, function(err2, globalData) {
                        if (err2) {
                          console.log("Error on global table insert:", err2);
                          callback(err2)
                        } else {
                            callback(null, {
                                "statusCode": 200,
                                "headers": {
                                    "X-Requested-With": '*',
                                    "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
                                    "Access-Control-Allow-Origin": '*',
                                    "Access-Control-Allow-Methods": 'POST,OPTIONS'
                                },
                                "body": JSON.stringify({"status" : newUserFlag ? "all clear - new user added" : "all clear - user updated"}),
                            });
                        }
                    });
                }
            }
        });
    }

};
