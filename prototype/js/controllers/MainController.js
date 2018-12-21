define([
	'app.controllers',
	'base'
	], 
	function (
			controllers,
			base
	) {
	"use strict";
	controllers.controller("MainController", [
		"$rootScope", 
		"$scope",
		"AuthenticationService",
		"SocketService",
		"routeProvider",
		"eventTypeProvider",
		"conf",
		"$location",
		
		function (
				$rootScope, 
				$scope,
				AuthenticationService,
				SocketService,
				routeProvider,
				eventTypeProvider,
				conf,
				$location
		) {
			
			$scope.authorized = false;
			var logout = function(){
				$scope.user = undefined;
				$scope.tribe = undefined;
				$scope.world = undefined;
//				$(".homeshow").removeClass("homeshow").addClass("homehide");
				if(!$scope.$$phase) {
					$scope.$apply();
				}
				AuthenticationService.clearCredentials();
				$location.path(base.URL_BASE + '/');
			}
			,
			init = function ($event){
				
				SocketService.emit(routeProvider.SEARCH_WORLDS, {}, function(msg){
					if (msg.type == routeProvider.SEARCH_WORLDS.type){
						$scope.worlds = msg.data.worlds;
					}
				});

				if($rootScope.globals.currentUser){ //usuário logado
					$scope.user = conf.USER = $rootScope.globals.currentUser;
//					if($scope.user.role == "admin" || $scope.user.role == "lider"){
//						$scope.authorized = true;
//					} else {
//						$scope.authorized = false;
//					}
					if(!conf.USER.world_id){logout(); return !1}
					SocketService.emit(routeProvider.SEARCH_WORLD, {}, function(msg){
						if (msg.type == routeProvider.SEARCH_WORLD.type){
							$scope.world = conf.WORLD = msg.data.world;
							if(!conf.USER.character_id){logout(); return !1}
							SocketService.emit(routeProvider.SEARCH_TRIBE, {}, function(msg){
								if (msg.type == routeProvider.SEARCH_TRIBE.type){
									if(!msg.data){logout(); return !1}
									$scope.character = msg.data.tribe_character.character;
									$scope.tribe = conf.TRIBE = msg.data.tribe_character.tribe;
//									$(".homehide").removeClass("homehide").addClass("homeshow");
									if(!$scope.$$phase) {
										$scope.$apply();
									}
								}
							});
						}
					});
					
				} else { //usuário não logado
					logout();	
				};
			};
			
			$scope.logout 				= logout;
			init();

			$scope.$on(eventTypeProvider.UPDATE_WORLD, init);
		}]);
});

