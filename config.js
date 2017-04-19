define([],function(){
  function config($routeProvider) {
    $routeProvider.when("/", {templateUrl: "partials/spotify.html"})
      .when("/home/:token", {templateUrl: "partials/home.html", controller: "homeController"})
      .otherwise({templateUrl: "partials/spotify.html"});
  }
  config.$inject=['$routeProvider'];

  return config;
});
