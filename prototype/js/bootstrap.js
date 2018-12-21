define([
	'require',
	'angular',
	'app',
	'ngRoute',
	'ngCookies'
	], function (
			require, 
			angular
	) {
	'use strict';

	require([
		'domReady!',
		], 
		function (
				document
				) {
		angular.bootstrap(document, ['app']);
	});
});
