define([
	"app.controllers"
	], 
	function (
			controllers
	) {
	"use strict";
	controllers.controller("ReservationController", [
		"$rootScope", 
		"$scope",
		"SocketService",
		"ReservationService",
		"routeProvider",
		"map",
		"conf",
		"$filter",
		"SendMsg",
		function (
				$rootScope, 
				$scope,
				SocketService,
				ReservationService,
				routeProvider,
				map,
				conf,
				$filter,
				SendMsg
		) {
			$scope.alterando = undefined;
			$scope.alert1 = false;
			$scope.alert2 = false;
			$scope.tradtable = [
				["aliado", "own"],
				["inimigo" , "enemy"],
				["neutro" , "other"],
				["bárbara", "barbarian"],
				["aliado", "ally"],
				["membro", "tribe"]
				];
			$scope.formato_datetime = conf.FORMAT_DATETIME;
			$scope.formato_date = conf.FORMAT_DATE;

			var	search_reservations_for_character = function(){
				SocketService.emit(routeProvider.SEARCH_RESERVATIONS_FOR_CHARACTER, {}, function(msg){
					if (msg.type == routeProvider.SEARCH_RESERVATIONS_FOR_CHARACTER.type){
						var reservs = msg.data.reservations;
						var f = 0;
						var len = reservs.length;
						if(len > 0){
							Object.keys(reservs).forEach(function(reserv){
								++f;
								verificar_exclude(reservs[reserv].village_id, function(permited){

									if(permited){
										$scope.reservations.push(reservs[reserv]);
									};
									if (f >= len){
										f = 0;
										ReservationService.reservations = $scope.reservations;
										if(!$scope.$$phase) {
											$scope.$apply();
										}
									}
								});
							});
						}
					}
				});
			}
			,
			search_all_reservations = function(callback){

				SocketService.emit(routeProvider.SEARCH_TRIBES_FOR_WORLD, {}, function(msg){
					if (msg.type == routeProvider.SEARCH_TRIBES_FOR_WORLD.type){
						var tribes = msg.data.tribes;
						$scope.reservations_tribe = [];
						$scope.reservations = [];
						var r = 0;
						tribes.forEach(function(tribe){
							SocketService.emit(routeProvider.SEARCH_RESERVATIONS, {}, function(msg){
								if (msg.type == routeProvider.SEARCH_RESERVATIONS.type){
									++r;
									$scope.reservations_tribe = $scope.reservations_tribe.concat(msg.data.reservations);
									ReservationService.reservations_tribe = $scope.reservations_tribe; 
									if (r >= tribes.length){
										r = 0;
										if(!$scope.$$phase) {
											$scope.$apply();
										}
										search_reservations_for_character();
										if (typeof callback === "function" ){
											callback();
										} else {
											return;
										}
									}
								}
							})
						})
					}
				});
			}
			,
			search_all_villages = function(){
				var listCoords = map.setScreen();

				var bar = $('.status')[0];
				var count = 0;

				var request = 0, response = 0;
				var villages = [];
				var list_villages = [];

				function nextBlock(){
					if (listCoords.length > 0){
						var block = listCoords.shift();
						++request;
						++count;
						$scope.progress = 1;
						bar.style.width = count + "%";
						if(!$scope.$$phase) {
							$scope.$apply();
						}
						SocketService.emit(routeProvider.SEARCH_ALL_VILLAGES_FOR_BLOCK, {"coord":block, "world_id":conf.WORLD.id}, function(msg){
							if (msg.type == routeProvider.SEARCH_ALL_VILLAGES_FOR_BLOCK.type){
								function nextVillage(){villages
									if (msg.data.villages.length > 0){
										var village = msg.data.villages.shift(); 
										list_villages.push(village);
										nextVillage();
									} else {
										if (request == ++response){
											nextBlock();
										};
									};
								};
								nextVillage();
							}
						});

					} else if (list_villages.length > 0){

						list_villages.sort(function(a,b){
							if ((a.x - b.x) < 0){
								return -1;
							} else if ((a.x - b.x) > 0) {
								return 1;
							} else if((a.x - b.x) == 0) {
								return (a.y - b.y)
							}
						})

						request = 0;
						response = 0;
						count = 0;

						var l = list_villages.length;

						var statusBar = function(){
							count++;
							var p = count * 100 / l;
							bar.style.width = p + "%";
							if(p >= 100){
								$scope.progress = undefined;
								bar.style.width = 0 + "%";
								ReservationService.villages = list_villages;
								$scope.villages = list_villages;
								$scope.vills = list_villages;

								if(!$scope.$$phase) {
									$scope.$apply();
								}
							}
						}

						list_villages.forEach(function(village){
							var reserv = $scope.reservations_tribe.find(f => f.village_id == village.id);
							if(reserv){ //Está reservada

								var dataDue = (formatDate(reserv.due_date)).getTime();
								var data_atual = (new Date()).getTime();
								if(dataDue <= data_atual){ //Expirou
									excluir(reserv);
								} else { //Ainda não expirou
									if(reserv.character_id == conf.USER.character_id){ //Pertence ao jogador
										if(reserv.character_id == village.character_id){ //Verifica se foi noblada
											excluir(reserv, function(deleted){
												deleted ? excluir_excluido(reserv): null;	
											});
											village.status = "proibida";
										} else {
											village.status = "reservada";		
										}
									} else { //Não pertence ao jogador
										village.status = "reservada";
									}
								}
								statusBar();
							} else { //Não está reservada
								if(village.character_id == conf.USER.character_id){ //Pertence ao jogador
									village.status = "proibida";
									statusBar();
								} else { //Não pertence ao jogador
									verificar_exclude(village.id, function(permited){ //Verifica se já foi excluída
										statusBar();
										if (permited){
											village.status = "disponível";
										} else {
											village.status = "bloqueada";
										}
									});
								}
							}
						})
					};
				};
				nextBlock();
			}
			,
			excluir = function (reservation, callback) {
				$scope.alterando = undefined;
				SocketService.emit(routeProvider.DELETE_RESERVATION, {"reservation_id":reservation.id}, function(msg){
					if (msg.type == routeProvider.DELETE_RESERVATION.type){
						if (typeof callback === "function" ){
							callback(msg.data.deleted);
						} else {
							return msg.data.deleted;
						}					
					}
				});
			}
			,
			excluir_reserv = function (reservation) { //botão excluir
				$scope.alterando = undefined;
				SocketService.emit(routeProvider.DELETE_RESERVATION, {"reservation_id":reservation.id}, function(msg){
					if (msg.type == routeProvider.DELETE_RESERVATION.type){
						if (msg.data.deleted){
							var v = $scope.villages.find(f => f.id == reservation.village_id);
							v && msg.data.deleted ? v.status = "bloqueada": null;
							SendMsg("Reserva excluída!");
							search_all_reservations();

						}
						return msg.data.deleted;
					}
				});
			}
			,
			excluir_excluido = function (reservation) {
				$scope.alterando = undefined;
				SocketService.emit(routeProvider.DELETE_RESERVATION_EXCLUDED, {"reservation_id":reservation.id}, function(msg){
					if (msg.type == routeProvider.DELETE_RESERVATION_EXCLUDED.type){
						if (msg.data.deleted && $scope.villages){
							var v = $scope.villages.find(f => f.id == reservations[reservation].village_id);
							v && deleted ? v.status = "disponível": null;
						}
						return msg.data.deleted;							
					}
				});
			}
			,
			clearReservation = function clearReservation(reservation){
				$scope.alterando = "alterando";
				if (reservation){
					$scope.reservation = {};
				}
//				search_all_villages(function(villages){
//				$scope.villages = villages;
//				if(!$scope.$$phase) {
//				$scope.$apply();
//				}
//				});
			}
			,
			formatDate = function (string) {
				var partes_string = string.split(" ");
				var partes_hora = partes_string[1].split(".");
				var hora = partes_hora[0];
				var data = partes_string[0];
				var partes_data = data.split("-");
				var ano = partes_data[0];
				var mes = partes_data[1] - 1;
				var dia = partes_data[2];

				var partes_hora = hora.split(":");
				var hora = partes_hora[0];
				var min = partes_hora[1];
				var seg = partes_hora[2];

				var d = new Date(ano, mes, dia, hora, min, seg);
				return d;
			}
			,
			verificar_exclude = function(village_id, callback){
				var b = false;
				SocketService.emit(routeProvider.SEARCH_RESERVATION_EXCLUDE, {"village_id":village_id}, function(msg){
					if (msg.type == routeProvider.SEARCH_RESERVATION_EXCLUDE.type){
						var reserv = msg.data.reservation;
						if (reserv && reserv.id != 0) {

							var data_exclude = (formatDate(reserv.stampexclude)).getTime();
							var dataDue_exclude = (formatDate(reserv.due_date)).getTime();
							var data_t = Math.min(data_exclude, dataDue_exclude)

							var data_limite = new Date(data_t + conf.LIMITE_DATA_EXCLUDE);
							$scope.data_limite = data_limite;
							var data_atual = new Date();
							if((data_limite <= data_atual && reserv.character_id == $rootScope.globals.currentUser.character_id)){
								b = true;
								/*
								 * Deleta reserva da tabela de reservas excluídas, pois já venceu o prazo limite
								 */
								excluir_excluido(reserv);
							}

							if($scope.villages && $scope.villages.length > 0){
								var vill = $scope.villages.find(f => f.id == reserv.village_id);
								if (vill && vill.character_id == reserv.character_id){
									excluir_excluido(reserv);
								}
							}

						} else {
							b = true;
						}
						if (typeof callback === "function" ){
							callback(b);
						} else {
							return b;
						}
					}
				});
			}
			,
			salvar = function salvar (){

				$scope.alterando = undefined;

				verificar_exclude($scope.village.id, function(permited){
					if(permited){
						if($scope.reservations.length >= conf.LIMIT_RESERVAS){
							SendMsg("Você não pode ter mais de duas reservas!");
						} else {
							var reservation = {
									village_name		: $scope.village.name,
									village_id			: $scope.village.id,
									village_x			: $scope.village.x,
									village_y			: $scope.village.y,
									affiliation 		: $scope.village.affiliation,
									character_id		: $rootScope.globals.currentUser.character_id,
									character_tribe_id	: $rootScope.globals.currentUser.tribe_id,
									character_name		: $rootScope.globals.currentUser.nickname
							}

							SocketService.emit(routeProvider.UPDATE_RESERVATION, {"reservation":reservation}, function(msg){
								if (msg.type == routeProvider.UPDATE_RESERVATION.type){
									if (msg.data.reservationResp.inserted){
										var v = $scope.villages.find(f => f.id == $scope.village.id);
										v ? v.status = "reservada": null;
										SendMsg("Reserva realizada com sucesso!");
										$scope.reservations = [];
										$scope.reservations_tribe = [];
										search_all_reservations();
									} else if(!msg.data.reservationResp.inserted && msg.data.reservationResp.exist){
										SendMsg("Aldeia já está reservada!");
									}
									if(!$scope.$$phase) {
										$scope.$apply();
									}
								}
							});
						}					
					} else {
						SendMsg("Renovação de reserva somente após corridos 2 dias do cancelamento da reserva! " + $scope.data_limite.toString());
					}
				});
			}
			,
			init = function (){
				if(ReservationService.reservations_tribe == undefined){
					search_all_reservations(function(){
						search_all_villages(function(villages){
							$scope.villages = villages;
							$scope.vills = villages;
							if(!$scope.$$phase) {
								$scope.$apply();
							}
						});
					});
				} else {
					$scope.reservations_tribe = ReservationService.reservations_tribe;
					if(ReservationService.reservations == undefined){
						search_reservations_for_character();
					} else {
						$scope.reservations = ReservationService.reservations;
						if(ReservationService.villages == undefined){
							search_all_villages();
						} else {
							$scope.villages = ReservationService.villages;
							$scope.vills = ReservationService.villages;
						}
					}
				}
			};

			$scope.$watchCollection("village_search", function(){
				if ($scope.village_search && $scope.villages){
					$scope.vills = [];
					var myregexp = new RegExp($scope.village_search);
					$scope.villages.forEach(function(vill){
						var x = vill.x.toString(); 
						var y = vill.y.toString();
						var xy = x + "/" + y;
						if (
								x.match(myregexp) || 
								y.match(myregexp) || 
								xy.match(myregexp) ||
								vill.name.match(myregexp)){
							$scope.vills.push(vill);
						}
					})
					if(!$scope.$$phase) {
						$scope.$apply();
					}
				}
			}, true);

			$scope.$on("$destroy", function() {
				$rootScope.homehide	= false;
			});

			$scope.clearReservation 		= clearReservation;
			$scope.salvar 					= salvar;
			$scope.excluir_reserv 			= excluir_reserv;
			$scope.villages			 		= [];
			$scope.reservations			 	= [];
			$scope.reservations_tribe	 	= [];
			$scope.village_search			= "";
			$scope.progress 				= undefined;
			$rootScope.homehide				= true;

			init();



		}]);
});