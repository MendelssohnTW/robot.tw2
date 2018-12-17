define("robotTW2/services/DataService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/conf",
	"conf/conf",
	"robotTW2/socketSend",
	"robotTW2/time"
	], function(
			robotTW2,
			version,
			conf,
			conf_conf,
			socketSend,
			convertedTime
	){
	return (function DataService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			$filter,
			ready
	) {
		var isInitialized = !1
		, isRunning = !1
		, interval_data_villages = null
		, interval_data_tribe = null
		, grid_queue = []
		, countVillages = 0
		, promise_grid = undefined
		, setupGrid = function (t_ciclo_x, t_ciclo_y) {
			var i
			, t = 0
			, arr_x = []
			, arr_y = [];

			for (i = 0; i < t_ciclo_x; i++) {
				arr_x[i] = null
			}

			for (i = 0; i < t_ciclo_y; i++) {
				arr_y[i] = null
			}

			return arr_x.concat().map(function (elem) {
				return arr_y.concat()
			});
		}
		, loadMap = function (x_min, x_max, y_min, y_max) {
			countVillages = 0;
			var dist_x = Math.abs(x_max - x_min);
			var dist_y = Math.abs(y_max - y_min);
			var ciclos_x = 0;
			var ciclos_y = 0;

			Math.trunc(dist_x / conf.MAP_CHUNCK_LEN) / (dist_x / conf.MAP_CHUNCK_LEN) < 1 ? ciclos_x = Math.trunc(dist_x / conf.MAP_CHUNCK_LEN) + 1 : ciclos_x = Math.trunc(dist_x / conf.MAP_CHUNCK_LEN);
			Math.trunc(dist_y / conf.MAP_CHUNCK_LEN) / (dist_y / conf.MAP_CHUNCK_LEN) < 1 ? ciclos_y = Math.trunc(dist_y / conf.MAP_CHUNCK_LEN) + 1 : ciclos_y = Math.trunc(dist_y / conf.MAP_CHUNCK_LEN);

			var t_ciclo_x = 0;
			if (ciclos_x % 2 < 1) {
				t_ciclo_x = ciclos_x + 1;
			} else {
				t_ciclo_x = ciclos_x;
			}
			var t_ciclo_y = 0;
			if (ciclos_y % 2 < 1) {
				t_ciclo_y = ciclos_y + 1;
			} else {
				t_ciclo_y = ciclos_y;
			}

			var map_chunk_size_x = Math.round(dist_x / t_ciclo_x);
			var map_chunk_size_y = Math.round(dist_y / t_ciclo_y);

			var grid = setupGrid(t_ciclo_x, t_ciclo_y);
			for (var i = 0; i < t_ciclo_x; i++) {
				for (var j = 0; j < t_ciclo_y; j++) {
					grid[i][j] = {"x":x_min + map_chunk_size_x * i, "y":y_min + map_chunk_size_y * j, "dist_x": map_chunk_size_x, "dist_y": map_chunk_size_y};
					grid[i][j].villages = [];
				};
			};
			return {
				grid: grid
			};
		}
		, 	loadTribeMembers = function (id, callback) {
			socketSend.emit(providers.routeProvider.SEARCH_CHARACTERS, {"tribe_id": id}, function(resp){
				if (resp.type == routes.SEARCH_CHARACTERS.type){
					var characters = resp.data.characters || []; 
					try {
						socketService.emit(providers.routeProvider.TRIBE_GET_MEMBERLIST, {'tribe': id}, function (o) {
							//$timeout(function(){
							if (o.members != undefined){
								var players = o ? o.members : undefined;

								var nAdd = function (character, callbackAdd){
									character.tribe_id = id;
									delete character.villages;
									socketSend.emit(providers.routeProvider.UPDATE_CHARACTER, {"character": character}, function(resp){
										if (resp.data.updated && resp.type == routes.UPDATE_CHARACTER.type){
											callbackAdd();
										};
									});
								};

								var getProfile = function (character, callbackgetProfile){
									var character_id = character.id;
									socketService.emit(providers.routeProvider.CHAR_GET_PROFILE, {
										'character_id': character_id
									}, function(data){
										callbackgetProfile(data)
									});
								};

								var addPlayers = function (characters, players, callbacknAdd) {

									function nextPlayer (){
										if (players.length > 0) {
											var player = players.shift();
											getProfile(player, function(data){
												function repasse(player, data, callbackRepasse){
													player.bash_points_total = data.bash_points_total;
													player.bash_points_def = data.bash_points_def;
													player.bash_points_off = data.bash_points_off;
													player.num_villages = player.villages;
													player.villages = [];
													var listVillages = data.villages || [];
													delete player.victory_points;
													delete player.loyalty;
													delete player.rights;
													delete player.profile_icon;
													listVillages.forEach(function(village){
														player.villages.push({
															"village_id": village.village_id, 
															"character_id": player.id
														});
													});

													socketSend.emit(providers.routeProvider.SEARCH_VILLAGES_FOR_CHARACTER, {"character_id":player.id}, function(resp){
														if (resp.type == routes.SEARCH_VILLAGES_FOR_CHARACTER.type){
															var villages_character = resp.data.villages;
															var count = 0;
															var l = villages_character.length;
															if(l == 0){
																callbackRepasse();
															} else {
																for (village in villages_character) {
																	if( villages_character.hasOwnProperty( village ) ) {
																		var located = player.villages.find(f => f.village_id == villages_character[village].id);
																		if (!located){
																			socketSend.emit(routes.UPDATE_VILLAGE_LOST_CHARACTER, {"village_id":villages_character[village].id}, function(resp){
																				count++;
																				if (resp.data.updated && resp.type == routes.UPDATE_VILLAGE_LOST_CHARACTER.type){
																					if(count >= l){
																						count = 0;
																						callbackRepasse();
																					}
																				};
																			});
																		} else {
																			count++;
																			if(count >= l){
																				count = 0;
																				callbackRepasse();
																			}
																		}
																	} 
																}
															}

//															player.villages.forEach(function(village_character){
//															socketSend.emit(routes.UPDATE_VILLAGE_CHARACTER, {"village":village_character}, function(resp){
//															if (resp.data.updated && resp.type == routes.UPDATE_VILLAGE_CHARACTER.type){
//															return;
//															};
//															});
//															});
														};
													});

												};

												if(
														!characters.find(f => f.id == player.id) || 
														characters.find(f => f.id == player.id && f.under_attack != player.under_attack) ||
														characters.find(f => f.id == player.id && f.bash_points_total != data.bash_points_total) ||
														characters.find(f => f.id == player.id && f.points != data.points) ||
														characters.find(f => f.id == player.id && f.global_rank != data.rank) ||
														characters.find(f => f.id == player.id && f.num_villages != data.num_villages)
												)
												{
													console.log("player " + player.name);
													repasse(player, data, function(){
														callbacknAdd(player, function(){
															nextPlayer();
														});
													});
												} else {
													console.log("Dados de membro não enviado " + player.name);
													nextPlayer();
												}
											});
										} else {
											callback();
										}
									};
									nextPlayer();
								};

								var nRemove = function (characters, players, listaRemove){
									function nextRemove(){
										if (listaRemove.length > 0){
											var character = listaRemove.shift();
											character.tribe_id = myObj.tribe.id;
											socketSend.emit(routes.DELETE_CHARACTER, {"character_id": character.id}, function(resp){
												//if (resp.data.deleted && resp.type == routes.DELETE_CHARACTER.type){
												if (resp.type == routes.DELETE_CHARACTER.type){
													nextRemove();
													return;
												};
											});
										} else {
											addPlayers(characters, players, nAdd)
											return;
										}
									};
									nextRemove();
								};

								function removePlayers (characters, players, callbacknRemove) {
									var listaRemove = [];
									characters.forEach(e => {
										if(!players.find(f => f.id == e.id)){
											listaRemove.push(e);
										}
									});
									callbacknRemove(characters, players, listaRemove);
								};

								removePlayers(characters, players, nRemove);
							}
							//}, 250);
						});
					} catch (Error){
						sendMessage("Erro ao carregar dados dos membros da tribo ")
					}
				};

			});
		}
		, loadTribeProfile = function (id, callback) {
			socketService.emit(providers.routeProvider.TRIBE_GET_PROFILE, {
				'tribe_id': id //myObj.tribe.id
			}, function(tribe) {
//				myObj.tribe = angular.copy(tribe);
//				myObj.tribe.id = tribe.tribe_id;
//				delete myObj.tribe.tribe_id;
//
//				myObj.world_tribe = {
//						world	: myObj.world,
//						tribe	: myObj.tribe
//				};
				callback();
			}
			);
		}
		, updateTribe = function(){
			socketSend.emit(providers.routeProvider.SEARCH_TRIBES_PERMITED, {}, function(resp){
				tribes = resp.data.tribes;
				if(!tribes.length){return}
				function nextId(it){
					loadTribeProfile(it, function(){
						socketSend.emit(providers.routeProvider.UPDATE_WORLD, {"world_tribe": myObj.world_tribe}, function(resp){
							if (resp.data.updated && resp.type == routes.UPDATE_WORLD.type){
								loadTribeMembers(it, function(members){
									//console.log("Membros enviados");
									if(tribes.length > 0){
										nextId(tribes.shift());
									} else {
										//$($("#twInject-leftbar .btn-border.button.btn-red .label")[1]).removeClass("btn-red").addClass("btn-green");
										if (!worldCheckTimer().isInitialized()){
											worldCheckTimer().init();
										};
									}
									return;
								});
								return;
							}
						});
					});
				};

				nextId(tribes.shift());
			})
		}
		, upInterval = function(){
			isRunning = !0;
			updateVillages();
			updateTribe();
			interval_data_villages = setInterval(function(){
				updateVillages();
				return;
			}, $rootScope.data_data.interval.world)
			interval_data_tribe = setInterval(function(){
				updateTribe();
				return;
			}, $rootScope.data_data.interval.tribe)
		}
		, villagesCheckTimer = (function (){
			var interval,
			w = {};
			return w.init = function() {
				$rootScope.data_data.complete = convertedTime() + $rootScope.data_data.interval ;
				$rootScope.data_logs.data = [];
				if($rootScope.data_data.last_update + $rootScope.data_data.interval < convertedTime() && $rootScope.data_data.auto_initialize){
					upInterval()
				} else if($rootScope.data_data.last_update < convertedTime()){
					upInterval()
				}
			}
			,
			w.stop = function() {
				isRunning = !1;
				clearInterval(interval_data_villages);
				interval_data_villages = undefined;
				clearInterval(interval_data_tribe);
				interval_data_tribe = undefined;
				grid_queue = [];
				countVillages = 0;
				promise_grid = undefined;
			}
			,
			w.isInitialized = function() {
				return isRunning
			}
			,
			w
		})()
		, loadVillagesWorld = function(listaGrid) {
			var t = undefined
			, rt = undefined
			, promise_send = undefined
			, send_queue = []
			, sendVillage = function (village, callback){
				if(!isRunning) return
				rt = $timeout(function(){
					$rootScope.data_logs.data.push({"text":$filter("i18n")("text_timeout", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": convertedTime()})
					callback();
				}, conf_conf.LOADING_TIMEOUT);
				
				socketSend.emit(providers.routeProvider.UPDATE_VILLAGE, {village:village}, function(resp){
					$timeout.cancel(rt);
					rt = undefined;
					if (resp.data.updated && resp.type == providers.routeProvider.UPDATE_VILLAGE.type){
						$rootScope.data_logs.data.push({"text":countVillages + "-" + $filter("i18n")("text_completed", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": (new Date(convertedTime())).toString()})
						console.log("aldeia " + countVillages + " enviada");
					} else {
						console.log("aldeia " + countVillages + " enviada com erro");
						$rootScope.data_logs.data.push({"text":countVillages + "-" + $filter("i18n")("text_err", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": (new Date(convertedTime())).toString()})
					}
					countVillages++;
					callback();
				});
			}
			, socketGetVillages = function (reg, callbackSocket){
				if(!isRunning) return
				console.log("Buscando " + reg.x + "/" + reg.y);
				$rootScope.data_logs.data.push({"text":$filter("i18n")("text_search", $rootScope.loc.ale, "data") + " " + reg.x + "/" + reg.y, "date": (new Date(convertedTime())).toString()})
				t = $timeout(function(){
					$rootScope.data_logs.data.push({"text":$filter("i18n")("text_timeout", $rootScope.loc.ale, "data") + " " + reg.x + "/" + reg.y, "date": (new Date(convertedTime())).toString()})
					callbackSocket();
				}, conf_conf.LOADING_TIMEOUT);

				socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:reg.x, y:reg.y, width: reg.dist_x, height: reg.dist_y}, function(data){
					var lista_barbaras = [];
					$timeout.cancel(t);
					t = undefined;

					if (data.error_code == "INTERNAL_ERROR"){
						console.log("Error internal");
						$rootScope.data_logs.data.push({"text":$filter("i18n")("text_err", $rootScope.loc.ale, "data"), "date": (new Date(convertedTime())).toString()})
						callbackSocket();
					} else {
						if (data != undefined && data.villages != undefined && data.villages.length > 0){
							var villages = data.villages || [];
							villages.forEach(function(village){
								function s(village){
									if(!promise_send){
										promise_send = new Promise(function(res){
											sendVillage(village, res);
										})
										.then(function(){
											promise_send = undefined;
											if(send_queue.length){
												s(send_queue.shift())
											} else {
												callbackSocket();
											}
										})
									} else {
										send_queue.push(village)
									}
								}
								s(village)
							})
						} else {
							callbackSocket();
						}
					}
				});
			};

			var exec_promise_grid = function (reg){
				promise_grid = new Promise(function(resolve){
					socketGetVillages(reg, resolve);
				})
				.then(function(){
					
					promise_grid = undefined
					if(grid_queue.length){
						var reg = grid_queue.shift();
						exec_promise_grid(reg)
					} else {
						$rootScope.data_logs.data.push({"text":$filter("i18n")("text_completed", $rootScope.loc.ale, "data"), "date": (new Date(convertedTime())).toString()})
						$rootScope.data_data.last_update = new date().getTime();
						if (!villagesCheckTimer.isInitialized()) {
							villagesCheckTimer.init();
						}
						return;
//						res()
					}
				})

			}

			listaGrid.forEach(function(reg){
				if(promise_grid){
					grid_queue.push(reg)
				} else {
					exec_promise_grid(reg)
				}
			})

		}
		, updateVillages = function(){
			var grid = loadMap(400, 500, 400 ,500).grid;
			var listaGrid = [];
			var l = Object.keys(grid).length;
			for(tx = 0; tx < l; tx++) {
				for(ty = 0; ty < l; ty++) {
					listaGrid.push({
						x			: grid[tx][ty].x,
						y			: grid[tx][ty].y,
						dist_x		: grid[tx][ty].dist_x,
						dist_y		: grid[tx][ty].dist_y
					});
				}
			};

			loadVillagesWorld(listaGrid)
		}
		, init = function (bool) {
			isInitialized = !0
			if(bool){return}
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				if (!villagesCheckTimer.isInitialized()){
					villagesCheckTimer.init();
				};
			}, ["all_villages_ready"])
		}
		, stop = function (){
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DATA"})
			villagesCheckTimer.stop()
		}
		return	{
			init			: init,
			start 			: start,
			stop 			: stop,
			isRunning		: function() {
				return isRunning
			},
			isInitialized	: function(){
				return isInitialized
			},
			version			: version.data,
			name			: "data"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.ready
	)
})
