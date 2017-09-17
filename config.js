define([],function(){
  function config($routeProvider,$compileProvider) {
    $routeProvider.when("/", {templateUrl: "views/spotify.html"})
      .when("/home/:token", {templateUrl: "views/home.html", controller: "controllers/homeController"})
      .when("/help", {templateUrl: "views/help.html"})
      .otherwise({templateUrl: "views/spotify.html"});
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|spotify):/);
  }
  config.$inject=['$routeProvider','$compileProvider'];

  return config;
});
