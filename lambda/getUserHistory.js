// dependencies
var AWS = require('aws-sdk');

// Set the region
AWS.config.update({ region: 'us-east-2' });

// Create DynamoDB service object
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });


exports.handler = function(event, context, callback) {
    var userID = event['queryStringParameters']['userID'] || null;
    var hex = event['queryStringParameters']['hex'] || null;
    if (userID == undefined || hex == undefined) {
  		callback('supply userID and hex')
  	}
    //var initialTime = new Date();
    var params = {
      TableName: 'users',
      Key: {
        'userID': { S: userID }
      },
      ProjectionExpression: 'userHistory, hex'
    };
    ddb.getItem(params, function(err, data) {
        if (err) {
          console.log("Error on user history read:", err);
          callback(err);
        } else {
          if (data.Item == undefined || data.Item.userHistory == undefined) {
            callback(null, {
                  "statusCode": 200,
                  "headers": {
                      "X-Requested-With": '*',
                      "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
                      "Access-Control-Allow-Origin": '*',
                      "Access-Control-Allow-Methods": 'GET,OPTIONS'
                  },
                  "body": JSON.stringify({
                    "message" : "getUserHistory returned nothing on DB read"
                  }),
              });
          } else if (data.Item.hex.S != hex) {
            callback("query hex does not match DB hex");
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
              callback(null, {
                  "statusCode": 200,
                  "headers": {
                      "X-Requested-With": '*',
                      "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
                      "Access-Control-Allow-Origin": '*',
                      "Access-Control-Allow-Methods": 'GET,OPTIONS'
                  },
                  "body": JSON.stringify({
                    'userID' : userID,
                    'userHistory' : formattedHistory
                  }),
              });
          }
        }
      });
   
};
