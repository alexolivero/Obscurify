define([],function(){
  function config($routeProvider,$compileProvider) {
    $routeProvider.when("/", {templateUrl: "partials/spotify.html"})
      .when("/home/:token", {templateUrl: "partials/home.html", controller: "homeController"})
      .when("/help", {templateUrl: "partials/help.html"})
      .otherwise({templateUrl: "partials/spotify.html"});
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|spotify):/);
  }
  config.$inject=['$routeProvider','$compileProvider'];

  return config;
});
