define([
  'config',
  'controllers/home-subcontrollers/graphHandler',
  'controllers/home-subcontrollers/userHistoryHandler',
  'controllers/home-subcontrollers/playlistMaker',
  'controllers/homeController'
  ],

  function(
		config,
		graphHandler,
		userHistoryHandler,
		playlistMaker,
		homeController
	){
		
    var app = angular.module('obscurifyMusic', ['ngRoute']);
	
    app.config(config);
	app.controller('controllers/home-subcontrollers/graphHandler', graphHandler);
	app.controller('controllers/home-subcontrollers/userHistoryHandler', userHistoryHandler);
	app.controller('controllers/home-subcontrollers/playlistMaker', playlistMaker);
    app.controller('controllers/homeController', homeController);


});
