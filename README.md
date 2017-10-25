What's up ya'll

This is one MEAN application
and by MEAN I mean....
M-ongoDB
E-xpress
A-ngular
N-ode

We like to start our server off right using pm2
by running the following commands in the root folder:

pm2 start login_server.js -- 'CLIENT_ID' 'CLIENT_SECRET' --watch
pm2 start home_server.js --watch
pm2 start database_server.js --watch

get these tasty CLIENT codes from Spotify:
https://developer.spotify.com/my-applications/

and you should be good to go.