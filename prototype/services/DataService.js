define("robotTW2/services/DataService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/conf",
	"conf/conf",
	"robotTW2/socketSend",
	"robotTW2/time",
	'helper/bbcode',
	'helper/time',
	'struct/MapData'
	], function(
			robotTW2,
			version,
			conf,
			conf_conf,
			socketSend,
			time,
			bbcode,
			helper,
			mapData
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
		, isRunningLog = !1
		, interval_data_villages = null
		, interval_data_tribe = null
		, interval_data_logs = null
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
		, send_server = function(tribe){
			return new Promise(function(res){
				$rootScope.data_logs.data.push({"text":$filter("i18n")("text_completed", $rootScope.loc.ale, "data") + " " + tribe.name + "-" + tribe.tag, "date": (new Date(time.convertedTime())).toString()})
				socketSend.emit(providers.routeProvider.UPDATE_TRIBE, {"tribe": tribe}, function(msg){
					res()
				})
			})
		}
		, rt = undefined
		, rm = undefined
		, rt_queue = []
		, rm_queue = []
		, send_tribes = function(tribes){
			return new Promise(function(res){
				if(!isRunning){
					res();
					return
				}
				var world = {
						"world_id" 	: modelDataService.getPlayer().data.selectedCharacter.data.world_id,
						"name" 		: modelDataService.getPlayer().data.selectedCharacter.data.world_name
				}
				socketSend.emit(providers.routeProvider.UPDATE_WORLD, {"world" : world}, function(msg){
					console.log("world updated")
				})

				function s(tribe){
					if(!rt){
						rt = send_server(tribe).then(function(){
							rt = undefined;
							if(rt_queue.length){
								s(rt_queue.shift())
							} else {
								$rootScope.data_data.last_update.tribes = time.convertedTime();
								res()
							}
						})
					} else {
						rt_queue.push(tribe)
					}
				}

				var list_tribes = Object.keys(tribes).map(function(tribe_id){return tribes[tribe_id]})
				if(!list_tribes || !list_tribes.length){
					res()
					return
				}
				s(list_tribes.shift())

			})
		}
		, loadTribeProfile = function (tribe, resolve) {
			return new Promise(function(res){
				socketService.emit(providers.routeProvider.TRIBE_GET_PROFILE, {
					'tribe_id': tribe.tribe_id
				}, res);
			})
		}
		, loadTribeMembers = function (tribe) {
			return new Promise(function(res){
				$rootScope.data_logs.data.push({"text":$filter("i18n")("text_search", $rootScope.loc.ale, "data") + " " + tribe.name + "-" + tribe.tag, "date": (new Date(time.convertedTime())).toString()})
				socketService.emit(providers.routeProvider.TRIBE_GET_MEMBERLIST, {
					'tribe': tribe.tribe_id
				}, res);
			})
		}
		, get_tribes = function(){
			return new Promise(function(resolve){
				var tribes = [];
				socketService.emit(providers.routeProvider.RANKING_TRIBE, {
					'area_id'	: null,
					'area_type'	: 'world',
					'offset'	: null,
					'count'		: $rootScope.data_data.count,
					'order_by'	: "rank",
					'order_dir'	: 0,
					'query'		: ''
				}, function(data) {
					data.ranking.map(function(tribe){
//						if(tribe.tribe_id == 51){
							tribes.push(tribe)
							$rootScope.data_logs.data.push({"text":$filter("i18n")("title", $rootScope.loc.ale, "data") + " " + tribe.name + "-" + tribe.tag, "date": (new Date(time.convertedTime())).toString()})
//						}
					})
					resolve(tribes)
				});
			})
		}
		, process_members = function(data, resolveNextId){
			var members = data.members;
			members.forEach(function(member){
				function v(member){
					if(!rm){
						rm = new Promise(function(res){
							getProfile(member, function(data){
								angular.extend(member, data)
								delete member.achievement_average;
								delete member.achievement_count;
								delete member.achievement_points;
								delete member.points_per_villages;
								delete member.profile_achievements;
								delete member.profile_text;
								delete member.profile_title;
								delete member.profile_title_id;
								delete member.rank_old;
								delete member.tribe_name;
								delete member.tribe_points;
								delete member.tribe_tag;
								delete member.rank_old;
								delete member.character_name;
								delete member.character_id;
								delete member.rank;
								delete member.villages;
								delete member.rights;
								!member.under_attack ? member.under_attack = 0 : member.under_attack; 
								!member.trusted ? member.trusted = 0 : member.trusted;
								!member.loyalty ? member.loyalty = 0 : member.loyalty;
								!member.last_login ? member.last_login = 0 : member.last_login;
								!member.banned ? member.banned = 0 : member.banned;
								!member.ban_expires ? member.ban_expires = 0 : member.ban_expires;
								res(member)
							})
						}).then(function(member){
							if(!isRunning){
								resolveNextId();
								return
							}
							rm = undefined
							if(rm_queue.length){
								v(rm_queue.shift())
							} else {
								resolveNextId(members)
							}
						})
					} else {
						rm_queue.push(member)
					}
				}
				v(member)
			})
		}
		, process_tribe = function(data_tribe, resolveNextId){
			loadTribeMembers(data_tribe).then(function(data){process_members(data, resolveNextId)})
		}
		, update_tribes = function(){
			return new Promise(function(resolveTribes){
				get_tribes().then(function(tribes){
					if(!tribes.length || !isRunning){return}
					var tribes_load = {}
					, gp = undefined
					, gp_queue = []

					tribes.forEach(function(tribe){
						var tr = angular.copy(tribe)
						function nextId(tribe){
							if (!gp){
								gp = new Promise(function(resGP){
									if(!isRunning){
										resGP();
										return
									}
									loadTribeProfile(tribe).then(function(data_tribe){
										angular.extend(tr, data_tribe)
										process_tribe(data_tribe, resGP)
									})
								}).then(function(members){
									angular.merge(tr, {"member_data" : members})
									tribes_load[tr.tribe_id] = tr;
									gp = undefined
									if(!isRunning){
										gp_queue = []
										return
									}
									if(gp_queue.length){
										nextId(gp_queue.shift())
									} else {
										resolveTribes(tribes_load)
									}
								})
							} else {
								gp_queue.push(tribe)
							}
						}
						nextId(tribe)
					})
				})
			})
		}
		, update_logs = function(){
			var offset	= 0;
			var limit	= 100;
			var message = {}
			var param1, param2, param3;
			var logTextObject = 'tribe_event_types';

			socketService.emit(providers.routeProvider.TRIBE_GET_LOG, {
				'start'	: offset,
				'count'	: limit
			}, function(data) {

				var last_logs = $rootScope.data_data.last_update.logs;
				var last_villages = $rootScope.data_data.last_update.villages;
				var last = Math.max(last_logs, last_villages);

				var entries = Object.keys(data.entries).map(function(entrie){
					if(entrie.eventTime > last) {
						return data.entries[entrie]
					} else {
						return undefined
					};
				}).filter(f=>f!=undefined)

				i = entries.length;
				while (i--) {
					message = entries[i];
					msgData = message.data;

					if(message.type == "village_conquered" || message.type == "village_lost"){
						var conquered = false;
						if(message.type == "village_conquered"){
							conquered = true;
						}

						socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
							'my_village_id'		: modelDataService.getSelectedVillage().getId(),
							'village_id'		: msgData.character_id,
							'num_reports'		: 0
						}, function(data){
							mapData.getTownAtAsync(data.village_x, data.village_y, function(village) {
								var vill = {
										x					: village.x,
										y					: village.y,
										affiliation 		: village.affiliation,
										attack_protection	: village.attack_protection,
										character_id		: village.character_id,
										character_name		: village.character_name,
										character_points	: village.character_points,
										id					: village.id,
										name				: village.name,
										province_name		: village.province_name,
										points				: village_points,
										tribe_id			: 0,
										tribe_points		: data.tribe.points,
										tribe_tag			: data.tribe.tag,
										conquered			: true
								}
							});

							sendVillage(vill)	

						})
					}
				}

				$rootScope.data_data.last_update.logs = time.convertedTime();
			});
		}
		, getProfile = function (character, callbackgetProfile){
			var character_id = character.id;
			socketService.emit(providers.routeProvider.CHAR_GET_PROFILE, {
				'character_id': character_id
			}, function(data){
				callbackgetProfile(data)
			});
		}
		, prom = undefined
		, prom_queue = []
		, update_members = function(tribes){
			return new Promise(function(res){
				Object.keys(tribes).map(function(tribe_id){
					if(!isRunning){return}
					function n(tribe_id){
						if(!prom){
							prom = new Promise(function(resolve_prom){
								socketSend.emit(providers.routeProvider.SEARCH_CHARACTERS, {"tribe": tribes[tribe_id]}, function(msg){
									if (msg.type == providers.routeProvider.SEARCH_CHARACTERS.type){
										var characters = msg.data.members || [];
										var players = tribes[tribe_id].member_data ? tribes[tribe_id].member_data : undefined;

										function nAdd(character, callbackAdd){
											$rootScope.data_logs.data.push({"text":$filter("i18n")("text_completed", $rootScope.loc.ale, "data") + " " + character.name + "-" + character.tribe_name, "date": (new Date(time.convertedTime())).toString()})

											delete character.achievement_average;
											delete character.achievement_count;
											delete character.achievement_points;
											delete character.points_per_villages;
											delete character.profile_achievements;
											delete character.profile_text;
											delete character.profile_title;
											delete character.profile_title_id;
											delete character.rank_old;
											delete character.tribe_name;
											delete character.tribe_points;
											delete character.tribe_tag;
											delete character.rank_old;
											delete character.character_name;
											delete character.character_id;
											delete character.rank;
											!character.under_attack ? character.under_attack = false : character.under_attack; 
											!character.trusted ? character.trusted = false : character.trusted;
											!character.loyalty ? character.loyalty = 0 : character.loyalty;
											!character.last_login ? character.last_login = 0 : character.last_login;
											!character.banned ? character.banned = false : character.banned;
											!character.ban_expires ? character.ban_expires = 0 : character.ban_expires;

											socketSend.emit(providers.routeProvider.UPDATE_CHARACTER, {"member": character}, function(msg){
												if (msg.type == providers.routeProvider.UPDATE_CHARACTER.type){
													callbackAdd();
												};
											});
										};

										function addPlayers(characters, players) {
											function nextPlayer (){
												if (players.length > 0) {
													var player = players.shift();
													getProfile(player, function(data){
														function repasse(player, callbackRepasse){
															player.villages ? delete player.villages : null;
//															var listVillages = data.villages || [];
//															listVillages.forEach(function(village){
//															player.villages.push({
//															"village_id": village.village_id, 
//															"character_id": player.id
//															});
//															});

															callbackRepasse(player);

//															socketSend.emit(providers.routeProvider.SEARCH_VILLAGES_FOR_CHARACTER, {"character_id":player.id}, function(msg){
//															if (msg.type == providers.routeProvider.SEARCH_VILLAGES_FOR_CHARACTER.type){
//															var villages_character = msg.data.villages;
//															var count = 0;
//															var l = villages_character.length;
//															if(l == 0){
//															callbackRepasse();
//															} else {
//															for (village in villages_character) {
//															if( villages_character.hasOwnProperty( village ) ) {
//															var located = player.villages.find(f => f.village_id == villages_character[village].id);
//															if (!located){
//															socketSend.emit(providers.routeProvider.UPDATE_VILLAGE_LOST_CHARACTER, {"village_id":villages_character[village].id}, function(msg){
//															count++;
//															if (msg.data.updated && msg.type == providers.routeProvider.UPDATE_VILLAGE_LOST_CHARACTER.type){
//															if(count >= l){
//															count = 0;
//															callbackRepasse();
//															}
//															};
//															});
//															} else {
//															count++;
//															if(count >= l){
//															count = 0;
//															callbackRepasse();
//															}
//															}
//															} 
//															}
//															}

//															player.villages.forEach(function(village_character){
//															socketSend.emit(providers.routeProvider.UPDATE_VILLAGE_CHARACTER, {"village":village_character}, function(msg){
//															if (msg.data.updated && msg.type == providers.routeProvider.UPDATE_VILLAGE_CHARACTER.type){
//															return;
//															};
//															});
//															});
//															};
//															});

														};

														angular.extend(player, data)

														if(!characters.find(f => f.id == player.id) 
																|| characters.find(f => f.id == player.id 
																		&& (f.under_attack != player.under_attack
																				|| f.bash_points_total != data.bash_points_total
																				|| f.points != data.points
																				|| f.global_rank != data.rank
																				|| f.num_villages != data.num_villages
																		))
														){
															repasse(player, function(p){
																nAdd(p, function(){
																	nextPlayer();
																});
															});
														} else {
															$rootScope.data_logs.data.push({"text":$filter("i18n")("text_completed", $rootScope.loc.ale, "data") + " " + player.name + "-" + player.tribe_name, "date": (new Date(time.convertedTime())).toString()})
															nextPlayer();
														}
													});
												} else {
													resolve_prom();
												}
											};
											nextPlayer();
										};

										function nRemove(characters, players, listaRemove){
											function nextRemove(){
												if (listaRemove.length > 0){
													var character = listaRemove.shift();
													character.tribe_id = tribe_id;
													socketSend.emit(providers.routeProvider.DELETE_CHARACTER, {"character_id": character.id}, function(msg){
														if (msg.type == providers.routeProvider.DELETE_CHARACTER.type){
															nextRemove();
															return;
														};
													});
//													} else {
//													addPlayers(characters, players)
//													return;
												}
											};
											nextRemove();
										};

										function removePlayers (characters, players) {
											var listaRemove = [];
											characters.forEach(e => {
												if(!players.find(f => f.id == e.id)){
													listaRemove.push(e);
												}
											});
											nRemove(characters, players, listaRemove);
										};

										removePlayers(characters, players);
									}
								})
							}).then(function(){
								prom = undefined
								if(prom_queue.length){
									n(prom_queue.shift())
								} else {
									res()
								}
							})
						} else {
							prom_queue.push(tribe_id);
						}
					}
					n(tribe_id)
				})
			})
		}
		, upIntervalVillages = function(){
			isRunning = !0;
			update_villages();
			interval_data_villages = setInterval(function(){
				update_villages();
				return;
			}, $rootScope.data_data.interval.villages)
		}
		, upIntervalTribes = function(){
			isRunning = !0;
			function exec(){
				update_tribes().then(function(tribes){
					send_tribes(tribes).then(update_members(tribes).then(function(){
						if($rootScope.data_data.last_update.villages + $rootScope.data_data.interval.villages < time.convertedTime() && $rootScope.data_data.auto_initialize){
							upIntervalVillages()
						} else if($rootScope.data_data.last_update.villages < time.convertedTime()){
							upIntervalVillages()
						}
					})
					);
				});
			}
			interval_data_tribe = setInterval(function(){
				exec()
				return;
			}, $rootScope.data_data.interval.tribes)
			exec();
		}
		, upIntervalLogs = function(){
			isRunningLog = !0;
			update_logs();
			interval_data_logs = setInterval(function(){
				update_logs();
				return;
			}, $rootScope.data_data.interval.logs)
		}
		, villagesCheckTimer = (function (){
			var interval,
			w = {};
			return w.init = function() {
				$rootScope.data_data.complete_villages = time.convertedTime() + $rootScope.data_data.interval.villages ;
				$rootScope.data_data.complete_tribes = time.convertedTime() + $rootScope.data_data.interval.tribes ;
				$rootScope.data_logs.data = [];

				if($rootScope.data_data.last_update.tribes + $rootScope.data_data.interval.tribes < time.convertedTime() && $rootScope.data_data.auto_initialize){
					upIntervalTribes()
				} else if($rootScope.data_data.last_update.tribes < time.convertedTime()){
					upIntervalTribes()
				}
			}
			,
			w.stop = function() {
				rm = undefined
				rm_queue = []
				rt = undefined
				rt_queue = []
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
		, logsCheckTimer = (function (){
			var interval,
			w = {};
			return w.init = function() {
				upIntervalLogs()
			}
			,
			w.stop = function() {
				isRunningLog = !1;
				clearInterval(interval_data_logs);
				interval_data_logs = undefined;
			}
			,
			w.isInitialized = function() {
				return isRunningLog
			}
			,
			w
		})()
		, sendVillage = function (village, callback){
			if(!isRunning) return
			rt = $timeout(function(){
				$rootScope.data_logs.data.push({"text":$filter("i18n")("text_timeout", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": (new Date(time.convertedTime())).toString()})
				callback();
			}, conf_conf.LOADING_TIMEOUT);

			socketSend.emit(providers.routeProvider.UPDATE_VILLAGE, {"village":village}, function(msg){
				$timeout.cancel(rt);
				rt = undefined;
				if (msg.resp && msg.type == providers.routeProvider.UPDATE_VILLAGE.type){
					$rootScope.data_logs.data.push({"text":countVillages + "-" + $filter("i18n")("text_completed", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": (new Date(time.convertedTime())).toString()})
					console.log("aldeia " + countVillages + " enviada");
				} else {
					console.log("aldeia " + countVillages + " enviada com erro");
					$rootScope.data_logs.data.push({"text":countVillages + "-" + $filter("i18n")("text_err", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": (new Date(time.convertedTime())).toString()})
				}
				countVillages++;
				if(typeof(callback) == "function"){
					callback();
				}
			});
		}
		, loadVillagesWorld = function(listaGrid) {
			var t = undefined
			, promise_send = undefined
			, send_queue = []
			, socketGetVillages = function (reg, callbackSocket){
				if(!isRunning) return
				console.log("Buscando " + reg.x + "/" + reg.y);
				$rootScope.data_logs.data.push({"text":$filter("i18n")("text_search", $rootScope.loc.ale, "data") + " " + reg.x + "/" + reg.y, "date": (new Date(time.convertedTime())).toString()})
				t = $timeout(function(){
					$rootScope.data_logs.data.push({"text":$filter("i18n")("text_timeout", $rootScope.loc.ale, "data") + " " + reg.x + "/" + reg.y, "date": (new Date(time.convertedTime())).toString()})
					callbackSocket();
				}, conf_conf.LOADING_TIMEOUT);

				socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:reg.x, y:reg.y, width: reg.dist_x, height: reg.dist_y}, function(data){
					var lista_barbaras = [];
					$timeout.cancel(t);
					t = undefined;

					if (data.error_code == "INTERNAL_ERROR"){
						console.log("Error internal");
						$rootScope.data_logs.data.push({"text":$filter("i18n")("text_err", $rootScope.loc.ale, "data"), "date": (new Date(time.convertedTime())).toString()})
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
						$rootScope.data_logs.data.push({"text":$filter("i18n")("text_completed", $rootScope.loc.ale, "data"), "date": (new Date(time.convertedTime())).toString()})
						$rootScope.data_data.last_update.tribes = time.convertedTime();
						if (!villagesCheckTimer.isInitialized() && isRunning) {
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
		, update_villages = function(){

			var grid = loadMap($rootScope.data_data.xmin, $rootScope.data_data.xmax, $rootScope.data_data.ymin, $rootScope.data_data.ymax).grid;
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
				if (!logsCheckTimer.isInitialized()){
					logsCheckTimer.init();
				};
			}, ["all_villages_ready"])
		}
		, stop = function (){
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DATA"})
			villagesCheckTimer.stop()
			logsCheckTimer.stop()
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
