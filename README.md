What's up ya'll, welcome to Obscurify.

The goal here is to show you as many interesting things about
your Spotify listening history as possible, and to quantify
how unique your taste is compared to everyone else.

This is one MEAN application

and by MEAN I mean....<br />
MongoDB (because I love JavaScript....Object Notation)<br />
Express (because I love JavaScript)<br />
Angular (because I love JavaScript)<br />
Node (because I love JavaScript)

We like to start our site off right using pm2
by running the following commands (with --watch for auto-restart on file change) in the root folder:

pm2 start login_server.js -- 'CLIENT_ID' 'CLIENT_SECRET' --watch<br />
pm2 start spotify_data_server.js --'OBSCURIFY_SECRET' --watch<br />
pm2 start database_server.js --'OBSCURIFY_SECRET' --watch<br />


I have these running on ports 8080, 8081, and 8082 respectively, with an nginx reverse proxy (sounds fancier than it really is) routing urls to the right node app.


I got those tasty CLIENT codes from Spotify:
https://developer.spotify.com/my-applications/

I made up my own OBSCURIFY_SECRET code. It doesn't matter what it is as long as spotify_data_server.js and database_server.js get the same thing.

