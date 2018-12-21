define([
	"app.configs",
	"base",
	], function (
			configs,
			base
	) {	
	configs.config([
		'$routeProvider',
		'$locationProvider',
		function(
				$routeProvider, 
				$locationProvider
		) {
			$locationProvider.html5Mode({
				enabled: true,
				requireBase: false
			});
			$routeProvider
			.when(base.URL_BASE + '/login', {
				templateUrl: "https://mendelssohntw.github.io/robot.tw2/prototype/assets/templates/login.html",
				controller : "LoginController"
			})
//			.when(base.URL_BASE + '/register', {
//				templateUrl: "assets/templates/register.html",
//				controller : "RegisterController"
//			})
			.when(base.URL_BASE + 'https://mendelssohntw.github.io/robot.tw2/prototype/reservation', {
				templateUrl: "assets/templates/reservation.html",
				controller : "ReservationController"
			})
//			.when(base.URL_BASE + '/donation', {
//				templateUrl: "assets/templates/donation.html",
//				controller : "DonationsController"
//			})
//			.when(base.URL_BASE + '/app', {
//				templateUrl: "assets/templates/mapa.html",
//				controller : "MapController"
//			})
			.otherwise({
				redirectTo : base.URL_BASE + '/'
			});
		}])
});