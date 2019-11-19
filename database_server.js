var fs = require('fs');
var http = require('http');
var https = require('https');
var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-2'});
var privateKey  = fs.readFileSync('/etc/letsencrypt/live/obscurifymusic.com/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/obscurifymusic.com/fullchain.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const async = require('async');
var moment = require('moment');

var obscurify_secret = process.argv[2];

var app = express();

app.use(express.static(__dirname ))
   .use(bodyParser.json())
   .use(cookieParser())
   .use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
      });

var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var minDaysBetweenUpdateUser = 28;

app.get('/api/getObscurifyData', function(req, res) {
	if(req.query.obscurifyScore == undefined ||
		req.query.country == undefined ||
		req.query.obscurify_secret != obscurify_secret)
    {
		    return res.send({ "error" : "uh oh" });
	  }
    var audioFeatureAverages = {
      'danceability' : 0,
      'energy' : 0,
      'happiness' : 0,
      'acousticness' : 0
    };
    var percentileByCountry = 0;
    let params = {
      TableName: 'countries',
      Key: {
        'code': { S: req.query.country }
      }
    };
    ddb.getItem(params, function(err, data) {
      if (err) {
        console.log("Error on countries read:", err);
        return res.send(err);
      } else {
        if (data.Item == undefined) {
          percentileByCountry = 100;
          //values pulled from obscurify 1.0 global averages
      		audioFeatureAverages.danceability = 0.57;
      		audioFeatureAverages.energy = 0.65;
      		audioFeatureAverages.happiness = 0.45;
      		audioFeatureAverages.acousticness = 0.22;
        } else {
          var usersBelow = 0;
          var value;
          Object.keys(data.Item.breakdown.M).forEach(function(key) {
              value = data.Item.breakdown.M[key];
              if (parseInt(key) < parseInt(req.query.obscurifyScore)) {
                usersBelow += parseInt(value.N);
              }
          });
          var usersAbove = data.Item.userCount.N - usersBelow;
    		  percentileByCountry = ( usersAbove / data.Item.userCount.N ) * 100;
          let globalParams = {
            TableName: 'global',
            Key: {
              'planet': { S: 'earth' }
            }
          };
          ddb.getItem(globalParams, function(err2, globalData) {
            if (err2 || globalData.Item.averageScore == undefined) {
                console.log("Error on global table get:", err);
                return res.send(
                    {
                      "percentileByCountry" : percentileByCountry,
                      "globalAverageScore" : null,
                      "totalUserCount" : null,
                      "userCountByCountry" : data.Item.userCount.N,
                      "audioFeatureAverages" : data.Item.audioFeatureAverages.M,
                      "averageScore" : data.Item.averageScore.N
                    }
                );
            } else {
                return res.send(
                    {
                      "percentileByCountry" : percentileByCountry,
                      "globalAverageScore" : globalData.Item.averageScore.N,
                      "totalUserCount" : globalData.Item.userCount.N,
                      "userCountByCountry" : data.Item.userCount.N,
                      "audioFeatureAverages" : data.Item.audioFeatureAverages.M,
                      "averageScore" : data.Item.averageScore.N
                    }
                );
            }
          });
        }
      }
    });
});


app.post('/api/saveUserHistory', function(req, res) {
  	if (req.body.country == null ||
  		req.body.longTermArtistIDs == null ||
  		req.body.longTermTrackIDs == null ||
  		req.body.obscurifyScore == null ||
  		req.body.longTermAudioFeatures == null ||
  		req.body.obscurify_secret != obscurify_secret) {
  		    return res.send({"error" : "no WAY DUDE!!"});
  	}
  	var historyInstance = {
  		'shortTermArtistIDs' : req.body.shortTermArtistIDs,
  		'shortTermTrackIDs' : req.body.shortTermTrackIDs,
  		'formattedDate' : moment().format("MMM Do YY"),
  		'dayOfYear' : moment().dayOfYear(),
  		'year' : moment().year()
  	};
    var userHistory = [];
    var query = { "userID" : req.body.userID };
    var params = {
      TableName: 'users',
      Key: {
        'userID': { S: req.body.userID }
      },
      ProjectionExpression: 'userHistory, obscurifyScore, longTermAudioFeatures'
    };
    ddb.getItem(params, function(err, data) {
      if (err) {
        console.log("Error on users table get:", err);
        return res.json({ "error" : "not ok :(" });
      } else {
        let longTermArtistIDs = req.body.longTermArtistIDs.map(id => ({"S" : id }) );
        let longTermTrackIDs = req.body.longTermTrackIDs.map(id => ({"S" : id }) );
        let longTermAudioFeatures = req.body.longTermAudioFeatures;
        for (feature in longTermAudioFeatures) {
            longTermAudioFeatures[feature] = { "N" : longTermAudioFeatures[feature].toString() };
        }
        var formattedHistory = {};
        let shortTermArtistIDs = historyInstance.shortTermArtistIDs.map(id => ({"S" : id }) );
        let shortTermTrackIDs = historyInstance.shortTermTrackIDs.map(id => ({"S" : id }) );
        formattedHistory.shortTermArtistIDs = { "L" : shortTermArtistIDs };
        formattedHistory.shortTermTrackIDs = { "L" : shortTermTrackIDs };
        formattedHistory.formattedDate = { "S" : historyInstance.formattedDate };
        formattedHistory.dayOfYear = { "N" : historyInstance.dayOfYear.toString() };
        formattedHistory.year = { "N" : historyInstance.year.toString() };
        if (data.Item == undefined || data.Item.userHistory.L == undefined) {
              //user not found in DB
              userHistory.unshift( { "M" : formattedHistory} );
              addOrUpdateUser(userHistory, longTermAudioFeatures, req.body.obscurifyScore.toString(),
                                    longTermTrackIDs, longTermArtistIDs, req.body.country, req.body.userID,
                                    true, null, null);
        } else {
            //existing user
            userHistory = data.Item.userHistory.L;
            if (moment().year() > userHistory[0].M.year.N || (moment().dayOfYear() - userHistory[0].M.dayOfYear.N > minDaysBetweenUpdateUser)) {
                userHistory.unshift( { "M" : formattedHistory} );
                addOrUpdateUser(userHistory, longTermAudioFeatures, req.body.obscurifyScore.toString(),
                                    longTermTrackIDs, longTermArtistIDs, req.body.country, req.body.userID,
                                    false, data.Item.longTermAudioFeatures.M, data.Item.obscurifyScore.N);
          	} else {
                return res.json({"status" : "ok, no update"});
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
            return res.json({"error" : "failed on the user table insert"});
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
                return res.json({"error" : "failed on the country table get"});
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
            for (key in audioFeatureAverages) {
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
                  return res.json({"error" : "failed on the country table update"});
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
          for (key in audioFeatureAverages) {
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
                return res.json({"error" : "failed on the country table update"});
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
              return res.json({"error" : "failed on the country table insert, new user"});
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
              return res.json({"error" : "failed on the global table get"});
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
                        return res.json({"error" : "failed on the fresh global table insert"});
                      } else {
                        return res.json({"status" : "all clear -- fresh global table began"});
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
                          return res.json({"error" : "failed on the global table insert"});
                        } else {
                          return res.json({"status" : "all clear"});
                        }
                    });
                }
            }
        });
    }
});


app.get('/api/getUserHistory', function(req, res) {
  	if (req.query.userID == undefined ||	req.query.obscurify_secret != obscurify_secret) {
  		return res.send({"error" : "uh oh"});
  	}
    //var initialTime = new Date();
    var params = {
      TableName: 'users',
      Key: {
        'userID': { S: req.query.userID }
      },
      ProjectionExpression: 'userHistory'
    };
    ddb.getItem(params, function(err, data) {
        if (err) {
          console.log("Error on user history read:", err);
          return res.json({ "error" : "getUserHistory failed on DB read" });
        } else {
          if (data.Item == undefined || data.Item.userHistory == undefined) {
            return res.json({ "error" : "getUserHistory returned nothing on DB read" });
          } else {
              //var difference = (new Date() - initialTime) / 1000;
              //console.log("DB :: You waited " + difference + " seconds for the get history call");
              let formattedHistory = data.Item.userHistory.L;
              formattedHistory = data.Item.userHistory.L.map(x => x.M);
              for (let history of formattedHistory) {
                  history.shortTermArtistIDs = history.shortTermArtistIDs.L;
                  history.shortTermArtistIDs = history.shortTermArtistIDs.map(x => x.S);
                  history.shortTermTrackIDs = history.shortTermTrackIDs.L;
                  history.shortTermTrackIDs = history.shortTermTrackIDs.map(x => x.S);
                  history.dayOfYear = history.dayOfYear.N;
                  history.year = history.year.N;
                  history.formattedDate = history.formattedDate.S;
              }
              res.send({
                'userID' : req.query.userID,
                'userHistory' : formattedHistory
              });
          }
        }
      });
});


// console.log('Listening on 8003');
// app.listen(8003);

var httpsServer = https.createServer(credentials, app);
console.log('Listening on 8003');
httpsServer.listen(8003);
