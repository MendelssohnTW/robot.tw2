define([
	"app.controllers"
	], 
	function (
			controllers
	) {
	"use strict";
	controllers.controller("LoginController", [
		"$rootScope", 
		"$scope", 
		"$location", 
		"AuthenticationService", 
		"SocketService",
		"routeProvider",
		"eventTypeProvider",
		"conf",
		"SendMsg",
		function (
				$rootScope, 
				$scope, 
				$location, 
				AuthenticationService, 
				SocketService,
				routeProvider,
				eventTypeProvider,
				conf,
				SendMsg
		) {
			AuthenticationService.clearCredentials();
			$scope.passalt = false;
			var login = function () {
				$scope.dataLoading = true;
				var user = {
						world_id	: $scope.world.id,
						nickname	: $scope.nickname,
						pass		: $scope.pass
				}
				AuthenticationService.login(user, function(response) {
					if(response.success) {
						AuthenticationService.setCredentials(user);
						SendMsg("Logado com sucesso!");
						$rootScope.$broadcast(eventTypeProvider.UPDATE_WORLD); //MainController init()
						$location.path('./');
					} else {
						SendMsg(response.message);
					}
					$scope.dataLoading = false;
					if(!$scope.$$phase) {
						$scope.$apply();
					};

				});
			}
			, initTabNav = function initTabNav() {
				const tabMenu = document.querySelectorAll('.js-tabmenu li');
				const tabContent = document.querySelectorAll('.js-tabcontent form');

				if (tabMenu.length && tabContent.length) {
					tabContent[0].classList.add('ativo');
					tabMenu[0].classList.add('ativo');
					function activeTab(index) {
						tabContent.forEach((form) => {
							form.classList.remove('ativo');
						});
						tabContent[index].classList.add('ativo');
					}

					function activeMenu(index) {
						tabMenu.forEach((li) => {
							li.classList.remove('ativo');        
						});
						tabMenu[index].classList.add('ativo');
					}

					tabMenu.forEach((itemMenu, index) => {
						itemMenu.addEventListener('click', () => {
							activeMenu(index);
							activeTab(index);
						});
					});
				}
			}
			, initModal = function initModal() {
				const botaoAbrir = document.querySelector('[data-modal="abrir"]');
				const botaoFechar = document.querySelector('[data-modal="fechar"]');
				const containerModal = document.querySelector('[data-modal="container"]');

				if (botaoAbrir && botaoFechar && containerModal) {
					function toggleModal(event) {
						event.preventDefault();
						containerModal.classList.toggle('ativo');
					}

					function cliqueForaModal(event) {
						if(event.target === this) {
							toggleModal(event);
						}    
					}

					botaoAbrir.addEventListener('click', toggleModal);
					botaoFechar.addEventListener('click', toggleModal);
					containerModal.addEventListener('click', cliqueForaModal);
				}
			}
			, alterar_pass = function(){
				$scope.passalt = false;
				$scope.dataLoading = true;
				var user = {
						world_id	: $scope.world.id,
						nickname	: $scope.nickname,
						pass		: $scope.pass,
						newpass		: $scope.newpass
				}
				AuthenticationService.alterar_pass(user, function(response) {
					if(response.success) {
						AuthenticationService.clearCredentials();
						AuthenticationService.login(user, function(response) {
							if(response.success) {
								AuthenticationService.setCredentials(user);
								$rootScope.$broadcast(eventTypeProvider.UPDATE_WORLD); //GeralController init()
								$location.path('./');
							} else {
								SendMsg(response.message);
							}
							$scope.dataLoading = false;
							if(!$scope.$$phase) {
								$scope.$apply();
							};
						});
					} else {
						SendMsg(response.message);
						$scope.dataLoading = false;
					}
					if(!$scope.$$phase) {
						$scope.$apply();
					};

				});
			}
			, register = function register() {
				$scope.dataLoading = true;

				$scope.user.world_id		= $scope.world.id,
				$scope.user.tribe_id		= $scope.tribe.id,
				$scope.user.nickname		= $scope.character.name,
				$scope.user.character_id	= $scope.character.id

				UserService.create($scope.user, function(data){
					if (data.registred) {
						SendMsg("Registrado com sucesso");
						$location.path('./login');
					} else {
						if (data.exist) {
							SendMsg("Usuário já registrado");
							$scope.dataLoading = false;
						} else {
							SendMsg("Erro ao registrar");
							$scope.dataLoading = false;
						}
					}
					if(!$scope.$$phase) {
						$scope.$apply();
					};
				})
			}
			, init = function(){
				initTabNav()
				initModal()
				SocketService.emit(routeProvider.SEARCH_WORLDS, {}, function(msg){
					if (msg.type == routeProvider.SEARCH_WORLDS.type){
						$scope.worlds = msg.data.worlds;
						$scope.world = $scope.worlds[Object.keys($scope.worlds)[0]];
						if(!$scope.$$phase) {
							$scope.$apply();
						};
					}
				});
			};
			
			$scope.$watch("world", function() {
				if(!$scope.world) return;
				conf.WORLD = $scope.world;
				SocketService.emit(routeProvider.SEARCH_TRIBES_FOR_WORLD, {"world_id":$scope.world.id}, function(msg){
					if (msg.type == routeProvider.SEARCH_TRIBES_FOR_WORLD.type){
						$scope.tribes = msg.data.tribes;
						if(!$scope.$$phase) {
							$scope.$apply();
						};
					}
				});
			}, true)

			$scope.$watch("tribe", function() {
				if(!$scope.tribe) return;
				conf.TRIBE = $scope.tribe;
				if ($scope.tribe) {
					SocketService.emit(routeProvider.SEARCH_CHARACTERS, {"tribe_id":$scope.tribe.id, "world_id":$scope.world.id}, function(msg){
						var lista = [];
						var characters = [];
						Object.keys(angular.copy(msg.data.characters)).forEach(function(key){lista.push(msg.data.characters[key].name)});
						lista.sort();
						lista.forEach(function(key){characters.push(msg.data.characters.find(f => f.name == key))})
						$scope.characters = characters || [];
						if(!$scope.$$phase) {
							$scope.$apply();
						};
					});
				}
			}, true)

			$scope.login 			= login;
			$scope.alterar_pass 	= alterar_pass;
			$scope.alert 			= undefined;
			$scope.dataLoading 		= false;

			init();

		}]);
});