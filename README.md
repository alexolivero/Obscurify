What's up ya'll, welcome to Obscurify.

The goal here is to show you as many interesting things about
your Spotify listening history as possible, and to quantify
how unique your taste is compared to everyone else.

This is one MEAN application
and by MEAN I mean....

M-ongoDB (because I love JavaScript....Object Notation)

E-xpress (because I love JavaScript)

A-ngular (because I love JavaScript)

N-ode (because I love JavaScript)

We like to start our site off right using pm2
by running the following commands in the root folder:

pm2 start login_server.js -- 'CLIENT_ID' 'CLIENT_SECRET' --watch

pm2 start spotify_data_server.js --watch

pm2 start database_server.js --watch

This makes it possible for Spotify to authenticate you.
I got these tasty CLIENT codes from Spotify:
https://developer.spotify.com/my-applications/

and you should be good to go.
