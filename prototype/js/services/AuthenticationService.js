define([
	"app.services"
	], function (
			services
	) {
	services.factory("AuthenticationService", [
		'Base64', 
		"$http", 
		"$cookies", 
		"$rootScope", 
		"$timeout", 
		"UserService", 
		"SocketService", 
		"routeProvider",
		"eventTypeProvider"
		, function (
				Base64, 
				$http, 
				$cookies, 
				$rootScope, 
				$timeout, 
				UserService, 
				SocketService, 
				routeProvider,
				eventTypeProvider
		){

			var service = {}
			,
			login = function (user, callback) {
				$timeout(function () {
					var response;
					UserService.getByUsername(user.nickname, function(located){
						if (located) {
							SocketService.emit(routeProvider.LOGIN, {"user":user, "world_id":conf.USER.world_id}, function(msg){
								if (msg.type == routeProvider.LOGIN.type){
									if(!msg.data){callback({ success: false, message: 'Erro ao logar' });}
									if (msg.data.loginResp.logged){
										user.approved 		= true;
										user.role		 	= msg.data.loginResp.role;
										user.id 			= msg.data.loginResp.id;
										user.character_id 	= msg.data.loginResp.character_id;
										user.tribe_id 		= msg.data.loginResp.tribe_id;
										user.world_id 		= msg.data.loginResp.world_id;
										response = { success: true };
									}
									else {
										if (!msg.data.loginResp.nickname){
											response = { success: false, message: 'Nickname incorreto' };
										} else {
											if (!msg.data.loginResp.pass){
												response = { success: false, message: 'Senha incorreta' };
											} else {
												if (!msg.data.loginResp.approved){
													response = { success: false, message: 'Usuário não autorizado' };
												} else {
													response = { success: false, message: 'Erro ao logar' };
													pass		: $scope.pass			}
											}
										}
									}
									callback(response);
								};
							});

						} else {
							response = { success: false, message: 'Nickname não registrado' };
							callback(response);
						}
					})
				}, 1000);

			}
			,
			alterar_pass = function(user, callback){
				var response;
				UserService.getByUsername(user.nickname, function(located){
					if (located) {
						SocketService.emit(routeProvider.UPDATE_LOGIN, {"user":user, "world_id":conf.USER.world_id}, function(msg){
							if (msg.type == routeProvider.UPDATE_LOGIN.type){
								if (msg.data.loginResp.updated){
									user.approved 		= true;
									user.role		 	= msg.data.loginResp.role;
									user.id 			= msg.data.loginResp.id;
									user.character_id 	= msg.data.loginResp.character_id;
									user.tribe_id 		= msg.data.loginResp.tribe_id;
									user.world_id 		= msg.data.loginResp.world_id;
									response = { success: true };
								}
								else {
									if (!msg.data.loginResp.nickname){
										response = { success: false, message: 'Nickname incorreto' };
									} else {
										if (!msg.data.loginResp.pass){
											response = { success: false, message: 'Senha incorreta' };
										} else {
											if (!msg.data.loginResp.approved){
												response = { success: false, message: 'Usuário não autorizado' };
											} else {
												response = { success: false, message: 'Erro ao logar' };
												pass		: $scope.pass			}
										}
									}
								}
								callback(response);
							};
						});

					} else {
						response = { success: false, message: 'Nickname não registrado' };
						callback(response);
					}
				})
			}
			,
			setCredentials = function (user) {
				user.authdata = Base64.encode(user.nickname + ':' + user.password);

				$rootScope.globals = {
						currentUser: {
							nickname		: user.nickname,
							world_id		: user.world_id,
							tribe_id		: user.tribe_id,
							role			: user.role,
							character_id	: user.character_id,
							tribe_id		: user.tribe_id,
							authdata		: user.authdata
						}
				};

				$rootScope.$broadcast(eventTypeProvider.UPDATE_USER);

				$http.defaults.headers.common['Authorization'] = 'Basic ' + user.authdata;

				//		store user details in globals cookie that keeps user logged in for 1 week (or until they logout)
				var cookieExp = new Date();
				cookieExp.setDate(cookieExp.getDate() + 7);
				$cookies.putObject('globals', $rootScope.globals, { expires: cookieExp });
			},
			clearCredentials = function () {
				$rootScope.globals = {};
				$cookies.remove('globals');
				$http.defaults.headers.common.Authorization = 'Basic';
			};

			service.login 				= login;
			service.setCredentials 		= setCredentials;
			service.clearCredentials	= clearCredentials;
			service.alterar_pass		= alterar_pass;

			return service;

		}])


});
