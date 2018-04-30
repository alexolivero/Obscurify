# What's up ya'll, welcome to Obscurify

The goal here is to show you as many interesting things about
your Spotify listening history as possible, and to quantify
how unique your taste is compared to everyone else.

#### This is one MEAN app, and by MEAN I mean....<br />
MongoDB (because I love JavaScript....Object Notation)<br />
Express (because I love JavaScript)<br />
Angular (because I love JavaScript)<br />
Node (because I love JavaScript)


Obscurify uses four server-side node programs to function. I use pm2 to run and automatically restart these node files, with the following commands:

> pm2 start login_server.js -- 'CLIENT_ID' 'CLIENT_SECRET' --watch<br />
> pm2 start spotify_data_server.js --'OBSCURIFY_SECRET' --watch<br />
> pm2 start database_server.js --'OBSCURIFY_SECRET' --watch<br />
> pm2 start report_generator.js --watch</br>

* `login_server` handles authentication with Spotify. the "/login" endpoint is hit and the flow starts when you hit the big "sign in" button.
* `spotify_data_server` handles the retrieval of user data from both Spotify's (ex. your top tracks/artists) and Obscurify's servers (ex. total user count, your "current" list history, your Obscurify score percentile)
* `database_server` handles interaction with the two MongoDB collections, "users" and "report". Only is called by `spotify_data_server`
* `report_generator` goes through the database and makes a country-by-country summary every two hours (it's very resource intensive) and puts it in the "report" collection from which `database_server` will read from in order to save a bunch of time for each user logging in

`CLIENT_ID` and `CLIENT_SECRET` keys are from [Spotify's Developer site](https://developer.spotify.com/my-applications/), `OBSCURIFY_SECRET` is present to ensure that only spotify_data_server can access database_server. It's a string I made up, it doesn't matter what you make it, just use the same string in both commands.

Make sure to change the `redirect_uri` on `login_server` if you want to run this yourself - and don't forget it needs to be on the list of Redirect URIs in your app's Spotify Developer page.


