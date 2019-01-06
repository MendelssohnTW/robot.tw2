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
		, tribes
		, tribe_permited
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
				search_tribes().then(function(tribes_permited){
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

							if(Object.keys(tribes_permited).find(f=>tribes_permited[f].tribe_id==tribe.tribe_id)){
								tribes.push(tribe)
								$rootScope.data_logs.data.push({"text":$filter("i18n")("title", $rootScope.loc.ale, "data") + " " + tribe.name + "-" + tribe.tag, "date": (new Date(time.convertedTime())).toString()})
							}

//							if(tribe.tribe_id == 51 || tribe.tribe_id == 102){
//							tribes.push(tribe)
//							$rootScope.data_logs.data.push({"text":$filter("i18n")("title", $rootScope.loc.ale, "data") + " " + tribe.name + "-" + tribe.tag, "date": (new Date(time.convertedTime())).toString()})
//							}
						})
						resolve(tribes)
					});
				})
			})
		}
		, process_members = function(data, resolveNextId){
			var members = data.members;
			members.forEach(function(member){
				function v(member){
					if(!rm){
						rm = new Promise(function(res){
							getProfile(member.id, function(data){
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
								console.log("Membros processados")
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
					this.tribes = tribes;

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
										console.log("Próxima tribo")
										nextId(gp_queue.shift())
									} else {
										console.log("Tribos processadas")
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
							'village_id'		: msgData.village_id,
							'num_reports'		: 0
						}, function(data){
							var vill
							mapData.getTownAtAsync(data.village_x, data.village_y, function(village) {
								vill = {
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
								sendVillage(vill).then(function(){}, function(){});
							});
						})
					}
				}

				$rootScope.data_data.last_update.logs = time.convertedTime();
			});
		}
		, getProfile = function (character_id, callbackgetProfile){
			socketService.emit(providers.routeProvider.CHAR_GET_PROFILE, {
				'character_id': character_id
			}, function(data){
				callbackgetProfile(data)
			});
		}

		, update_members = function(tribes){
			return new Promise(function(res){
				var prom = undefined
				, prom_queue = [];
				Object.keys(tribes).map(function(tribe_id){
					if(!isRunning){return}
					function n(tribe_id){
						if(!prom){
							prom = new Promise(function(resolve_prom){
								socketSend.emit(providers.routeProvider.SEARCH_CHARACTERS, {"tribe": tribes[tribe_id]}, function(msg){
									if (msg.type == providers.routeProvider.SEARCH_CHARACTERS.type){
										var characters = msg.data.members || [];
										var players = tribes[tribe_id].member_data ? tribes[tribe_id].member_data : undefined;
										analise_removed_players(characters, players).then(function(listaRemove){
											remove_players(listaRemove).then(function(){
												analise_villages_players(characters, players).then(function(removeVillage, addVillage){
													add_remove_villages(removeVillage, addVillage).then(function(){
														resolve_prom()
													}, function(msg){
														rejected(msg)
													})
												})
											}, function(msg){
												rejected(msg)
											})
										})
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
		, rejected = function(msg){
			console.log(msg.data + " - " + msg.type)
		}
		, add_remove_villages = function(list_removeVillage, list_addVillage){
			return new Promise(function(termina, reject){
				var re = undefined
				, re_queue = [];

				list_addVillage.forEach(function(player_id){
					function ne(player_id){
						if(!re){
							re = new Promise(function(res, rej){
								getProfile(player_id, function(player){
									var villages_game = player.villages
									, villages_player
									socketSend.emit(providers.routeProvider.SEARCH_VILLAGES_FOR_CHARACTER, {"character_id":player.id}, function(msg){
										if (msg.type == providers.routeProvider.SEARCH_VILLAGES_FOR_CHARACTER.type){
											if(msg.data.villages){
												villages_player = msg.data.villages;
												res(villages_game, villages_player)
											} else if(msg.data == "Timeout"){
												rej(msg)
											}
										}
									})
								})
							}).then(function(villages_game, villages_player){
								process_villages_player(villages_game, villages_player).then(function(){
									if(re_queue.length){
										ne(re_queue.shift())
									} else {
										termina()
									}
								})
							}, function(msg){
								reject(msg)
							})
						} else {
							re_queue.push(player_id)
						}
					}
					ne(player_id)
				})
			})
		}
		, remove_players =  function (listaRemove){
			return new Promise(function(res, rej){
				function nextRemove(){
					if (listaRemove.length > 0){
						var character = listaRemove.shift();
						socketSend.emit(providers.routeProvider.DELETE_CHARACTER, {"character_id": character.id}, function(msg){
							if (msg.type == providers.routeProvider.DELETE_CHARACTER.type){
								if(msg.data && msg.data == "Timeout"){
									rej(msg)
								} else {
									nextRemove();	
								}
							};
						});
					} else {
						res()
					}
				};
				nextRemove();
			})
		}
		, analise_removed_players = function (characters, players) {
			return new Promise(function(res){
				var listaRemove = [];
				players.forEach(e => {
					if(!characters.find(f => f.id == e.id)){
						listaRemove.push(e);
					}
				});
				res(listaRemove)
			})
		}
		, search_tribes = function(){
			return new Promise(function(resolve){
				socketSend.emit(providers.routeProvider.SEARCH_TRIBES_PERMITED, {}, function(msg){
					if (msg.type == providers.routeProvider.SEARCH_TRIBES_PERMITED.type){

						resolve(msg.data.tribes)
					}
				});
			})
		}
		, process_reservations = function(list_update_reservation){
			var ey = undefined
			, ey_queue = [];

			if(list_update_reservation.length){
				list_update_reservation.forEach(function(reserv){
					var eg = function(reservation){
						if(!ey){
							ey = new Promise(function(res, rej){
								socketSend.emit(providers.routeProvider.VERIFY_RESERVATION, {'verify_reservation': reserv}, function(data){
									if (msg.type == routeProvider.VERIFY_RESERVATION.type){

									}
								})
							}).then(function(){
								if(ey_queue.length){
									eg(ey_queue.shift())
								} else {
//									process_reservations(list_update_reservation)
								}
							}, function(){
//								return
							})
						} else {
							ey_queue.push(reservation)
						}
					}
					ey(reserv)
				})
			}
		}
		, process_villages_player = function(villages_game, villages_player){
			var listaRemove = []
			, listaAdd;

			villages_player.forEach(e => {
				if(!Object.keys(villages_game).find(f => f == e)){
					listaRemove.push(e);
				}
			});
			Object.keys(villages_game).forEach(e => {
				if(!villages_player.find(f => f == e)){
					listaAdd.push(e); 
				}
			});

			search_tribes().then(function(tribes_permited){
				this.tribes_permited = tribes_permited;

				var lista = listaRemove.concat(listaAdd)
				, list_update_reservation = []
				, et = undefined
				, et_queue = [];

				if(lista.length){
					lista.forEach(function(vill_id){
						var eg = function(village_id){
							if(!et){
								et = new Promise(function(res, rej){
									socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
										'my_village_id'		: modelDataService.getSelectedVillage().getId(),
										'village_id'		: village_id,
										'num_reports'		: 0
									}, function(data){
										var vill
										mapData.getTownAtAsync(data.village_x, data.village_y, function(village) {
											getTribe(village.character_id).then(function(tr){
												vill = {
														affiliation 		: village.affiliation,
														character_id		: village.character_id,
														character_name		: village.character_name,
														character_points	: village.character_points,
														name				: village.name,
														id					: village.id,
														points				: village_points,
														tribe_id			: tr.id,
														tribe_points		: tr.points,
														tribe_tag			: tr.tag
												}
												if(Object.keys(tribes_permited).find(f=>tribes_permited[f].tribe_id==tr.id)){
													list_update_reservation.push(village.id, tr.id, village.character_id)
												}
												upVillage(vill).then(function(){
													res()
												}, function(){
													rej()
												})
											})
										});
									})
								}).then(function(){
									if(et_queue.length){
										eg(et_queue.shift())
									} else {
										process_reservations(list_update_reservation)
									}
								}, function(){
									return
								})
							} else {
								et_queue.push(village_id)
							}
						}
						eg(vill_id)
					})
				}
			})
		}
		, getTribe = function(character_id){
			var tribe_id;
			var character;
			return new Promise(function(res, rej){
				socketSend.emit(routeProvider.SEARCH_CHARACTER, {"character_id": character_id}, function(msg){
					if (msg.type == routeProvider.SEARCH_CHARACTER.type){
						character = msg.data.member;
						tribe_id = character.tribe_id;
						var tribe = this.tribes.find(f => f.tribe_id == tribe_id);
						if(tribe)
							res({
								"id": tribe_id,
								"tag": tribe.tag, 
								"points": tribe.points
							});
						res({
							"id": 0,
							"tag": "", 
							"points": 0
						})
					}
				});
			})
		}
		, analise_villages_players = function (characters, players) {
			return new Promise(function(res){
				var removeVillage = [];
				var addVillage = [];
				characters.forEach(e => {
					var locate = players.find(f => f.id == e.id);
					if(locate && locate.num_villages > e.num_villages){ // perdeu aldeia
						removeVillage.push(locate.id);
					} else if(locate && locate.num_villages < e.num_villages){ //ganhou aldeia
						addVillage.push(locate.id);
					}
				});
				res(removeVillage, addVillage)
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
			console.log("Atualização iniciada")
			function exec(){
				update_tribes().then(function(tribes){
					console.log("Enviando as tribos e membros")
//					send_tribes(tribes).then(update_members(tribes).then(function(){
					update_members(tribes).then(function(){
						console.log("Tribos e membros enviados")
//						if($rootScope.data_data.last_update.villages + $rootScope.data_data.interval.villages < time.convertedTime() && $rootScope.data_data.auto_initialize){
//						upIntervalVillages()
//						} else if($rootScope.data_data.last_update.villages < time.convertedTime()){
//						upIntervalVillages()
//						}
					})
//					);
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
		, sendVillage = function (village){
			return new Promise(function(res, rej){
				if(!isRunning) return
				rt = $timeout(function(){
					$rootScope.data_logs.data.push({"text":$filter("i18n")("text_timeout", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": (new Date(time.convertedTime())).toString()})
					rej();
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
					res();
				});
			})
		}
		, upVillage = function(village){
			return new Promise(function(res, rej){
				if(!isRunning) return
				rt = $timeout(function(){
					$rootScope.data_logs.data.push({"text":$filter("i18n")("text_timeout", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": (new Date(time.convertedTime())).toString()})
					rej();
				}, conf_conf.LOADING_TIMEOUT);

				socketSend.emit(providers.routeProvider.UPT_VILLAGE, {"village":village}, function(msg){
					$timeout.cancel(rt);
					rt = undefined;
					if (msg.resp && msg.type == providers.routeProvider.UPT_VILLAGE.type){
						$rootScope.data_logs.data.push({"text":$filter("i18n")("text_completed", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": (new Date(time.convertedTime())).toString()})
					} else {
						$rootScope.data_logs.data.push({"text":$filter("i18n")("text_err", $rootScope.loc.ale, "data") + " " + village.x + "/" + village.y, "date": (new Date(time.convertedTime())).toString()})
					}
					res();
				});
			})
		}
		, loadVillagesWorld = function(listaGrid) {
			var t = undefined
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
							var villages = data.villages || []
							, promise_send = undefined
							, send_queue = []

							villages.forEach(function(village){
								function s(village){
									if(!promise_send){
										promise_send = new Promise(function(res, rej){
											sendVillage(village).then(function(){res()}, function(){rej()});
										})
										.then(function(){
											promise_send = undefined;
											if(send_queue.length){
												s(send_queue.shift())
											} else {
												callbackSocket();
											}
										}, function(){
											callbackSocket();
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
				}).then(function(){
					promise_grid = undefined
					if(grid_queue.length){
						var reg = grid_queue.shift();
						exec_promise_grid(reg)
					} else {
						$rootScope.data_logs.data.push({"text":$filter("i18n")("text_completed", $rootScope.loc.ale, "data"), "date": (new Date(time.convertedTime())).toString()})
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
