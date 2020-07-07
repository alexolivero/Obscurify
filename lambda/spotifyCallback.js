const axios = require("axios");
const querystring = require('querystring');
var crypto = require('crypto');
var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-2' });

// Create DynamoDB service object
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

var redirect_uri = process.env.redirect_uri;
var client_id = process.env.client_id;
var client_secret = process.env.client_secret;

module.exports.handler = (event, context, callback) => {
    var code = event['queryStringParameters']['code'] || null;
    var state = event['queryStringParameters']['state'] || null;
    const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
          }
    axios.post('https://accounts.spotify.com/api/token?grant_type=authorization_code&code='
    + code + '&redirect_uri=' + redirect_uri, querystring.stringify({}), {
        headers: headers
    })
    .then(function(response) {
        const headers2 = {
            'Accept' : 'application/json',
            'Authorization': 'Bearer ' + response.data.access_token
          }
        axios.get("https://api.spotify.com/v1/me", {
            headers: headers2
        })
        .then(function(response2) {
            let userID = response2.data.id;
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
                if (data.Item != undefined && data.Item.hex != undefined && data.Item.hex.S.length > 0) {
                    callback(null, {
                                statusCode: 301,
                                headers: {
                                    Location: process.env.callback_uri + '?spotifyToken=' + response.data.access_token +
                                        '&obscurifyToken=' + data.Item.hex.S
                                },
                            });
                } else {
                    // insert new user to dynamo with a hex key
                    let hex = crypto.randomBytes(20).toString('hex');
                    let userParams = {
                        TableName: 'users',
                        Item: {
                            'userID' : { S: userID },
                            'hex' : { S: hex }
                        }
                    };
                    ddb.putItem(userParams, function(err, userData) {
                        if (err) {
                            console.log("Error on user table insert for adding hex:", err);
                            callback(err)
                        } else {
                            callback(null, {
                                statusCode: 301,
                                headers: {
                                    Location: process.env.callback_uri + '?spotifyToken=' + response.data.access_token + '&obscurifyToken=' + hex
                                },
                            });
                        }
                    });
                }
            }
          });
        })
        .catch(function(err) {
          console.error("Error: " + err);
          callback(err);
        });
    })
    .catch(function(err) {
       console.error("Error: " + err);
       callback(err);
    });
};
