define(['config',
  'homeController'],

  function(config, homeController){
    var app = angular.module('obscurifyMusic', ['ngRoute']);
    app.config(config);
    app.controller('homeController', homeController);

});
