What's up ya'll, welcome to Obscurify.


The goal here is to show you as many interesting things about
your Spotify listening history as possible, and to quantify
how unique your taste is compared to everyone else.


This is one MEAN application
and by MEAN I mean....

MongoDB (because I love JavaScript....Object Notation)

Express (because I love JavaScript)

Angular (because I love JavaScript)

Node (because I love JavaScript)


We like to start our site off right using pm2
by running the following commands (with --watch for auto-restart) in the root folder:

pm2 start login_server.js -- 'CLIENT_ID' 'CLIENT_SECRET' --watch

pm2 start home_server.js --watch

pm2 start database_server.js --watch


This makes it possible for Spotify to authenticate you
so you can get all that delicious data.
I got these tasty CLIENT codes from Spotify:
https://developer.spotify.com/my-applications/


and you should be good to go.
