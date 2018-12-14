define("robotTW2/farm/command_queue", function(){
	var w = {}
	return w.preset_queue = []
	, w.farm_queue = []
	, w.grid_queue = []
	,w
})
define("robotTW2/services/FarmService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/time",
	"robotTW2/conf",
	"conf/conf",
	"robotTW2/farm/command_queue"
	], function(
			robotTW2,
			version,
			convertedTime,
			conf,
			conf_conf,
			command_queue
	){
	return (function FarmService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			$filter,
			requestFn,
			loadScript,
			ready
	) {

		var isInitialized = !1
		, isRunning = !1
		, isPaused = !1
		, interval_init = null
		, timeoutIdFarm = {}
//		, listener_change = undefined
		, listener_resume = undefined
		, countCommands = {}
		, commands_for_send = []
		, t_slice = {}
		, cicle = 0
		, req = 0
		, rdy = 0
		, s = {}
		, g = 0
		, promise = undefined
		, promise_grid = undefined
		, promise_farm = undefined
		, send_queue = []
		, completion_loaded = !1
		, rallyPointSpeedBonusVsBarbarians = modelDataService.getWorldConfig().getRallyPointSpeedBonusVsBarbarians()
		, setupGrid = function (len) {
			var i, t = 0,
			arr;

			for (i = 0, arr = []; i < len; i++) {
				arr[i] = null;
			}
			return arr.concat().map(function (elem) {
				return arr.concat();
			});
		}
		, loadMap = function (x, y, dist) {
			var coordX = x - dist;
			var coordY = y - dist;
			var ciclos = 0;

			Math.trunc(dist / conf.MAP_CHUNCK_LEN) / (dist / conf.MAP_CHUNCK_LEN) < 1 ? ciclos = Math.trunc(dist / conf.MAP_CHUNCK_LEN) + 1 : ciclos = Math.trunc(dist / conf.MAP_CHUNCK_LEN);

			var t_ciclo = 0;
			if (ciclos % 2 < 1) {
				t_ciclo = ciclos + 1;
			} else {
				t_ciclo = ciclos;
			}

			var map_chunk_size = Math.round(dist * 2 / t_ciclo);

			var grid = setupGrid(t_ciclo);
			for (var i = 0; i < t_ciclo; i++) {
				for (var j = 0; j < t_ciclo; j++) {
					grid[i][j] = {"x":coordX + (map_chunk_size * i), "y":coordY + (map_chunk_size * j), "dist": map_chunk_size};
					grid[i][j].villages = [];
				};
			};
			return {
				grid: grid
			};
		}
		, exec = function (cmd_preset) {
			var x = cmd_preset.x
			, y = cmd_preset.y
			, preset_id = cmd_preset.preset_id
			, village_id = cmd_preset.village_id

			var grid = loadMap(x, y, $rootScope.data_villages.villages[village_id].presets[preset_id].max_journey_distance).grid;
			var listaGrid = [];
			var l = Object.keys(grid).length;
			for(tx = 0; tx < l; tx++) {
				for(ty = 0; ty < l; ty++) {
					listaGrid.push({
						x			: grid[tx][ty].x,
						y			: grid[tx][ty].y,
						dist		: grid[tx][ty].dist
					});
				}
			};

			listaGrid.sort(function (a, b) {
				if (Math.abs(a.x - x) != Math.abs(b.x - x)) {
					if (Math.abs(a.x - x) > Math.abs(b.x - x)) {
						return 1;
					};
					if (Math.abs(a.x - x) < Math.abs(b.x - x)) {
						return -1;
					};
				} else if(Math.abs(a.y - y) != Math.abs(b.y - y)) {
					if (Math.abs(a.y - y) > Math.abs(b.y - y)) {
						return 1;
					};
					if (Math.abs(a.y - y) < Math.abs(b.y - y)) {
						return -1;
					};
				} else {
					return 0;	
				}

			});
			return  listaGrid;
		}
		, get_dist = function (village_id, preset_id, bonus, units) {
			function return_min(tempo) {
				if (tempo != undefined) {
					var ar_tempo = tempo.split(":");
					var hr = parseInt(ar_tempo[0]) || 0;
					var min = parseInt(ar_tempo[1]) || 0;
					var seg = parseInt(ar_tempo[2]) || 0;
					return (hr * 60 + min +  seg / 60);
				} else {
					return 0;
				}
			}
			var list_select = []
			, timetable = modelDataService.getGameData().data.units.map(function (obj) {
				return [obj.name, obj.speed]
			})
			for (un in units) {
				if (units.hasOwnProperty(un)) {
					if(units[un] > 0) {
						for(ch in timetable) {
							if (timetable.hasOwnProperty(ch)) {
								if (timetable[ch][0] == un) {
									list_select.push(timetable[ch]);
								}
							}
						}
					}
				}
			}
			if (list_select.length > 0) {
				list_select.sort(function (a, b) {return a[1] - b[1]});
				return Math.trunc(((($rootScope.data_villages.villages[village_id].presets[preset_id].max_journey_time / 60 / 1000 / list_select.pop()[1]) * (bonus / 100) * 0.75)) / 2);
			} 
			return 0;
		}
		, verif_units = function (obj_search, lista) {
			for(obj in lista) {
				if (lista.hasOwnProperty(obj)) {
					if (obj_search == obj) {
						return lista[obj].available != undefined && lista[obj].available > 0 ?  true : false;
					}
				}
			}
			return false;
		}
		, units_analyze = function (preset_units, aldeia_units) {
			var f = []
			for (unit_preset in preset_units) {
				if (preset_units.hasOwnProperty(unit_preset)) {
					if(preset_units[unit_preset] > 0) {
						if($rootScope.data_farm.troops_not.some(elem => elem == unit_preset)) {
							return !1;
						} else {
							if (verif_units(unit_preset, aldeia_units)) {
								if(aldeia_units[unit_preset].available >= preset_units[unit_preset]){
									f.push([{[unit_preset] : preset_units[unit_preset]}, aldeia_units[unit_preset].available])
								}
							}

						}
					}
				}
			}
			if(f.length){
				f.sort(function(a,b){return a[1] - b[1]})
				return f.shift()[0]
			} else {
				return !1;
			}
		}
		, units_subtract = function (preset_units, aldeia_units) {
			var f = []
			for (unit_preset in preset_units) {
				if (preset_units.hasOwnProperty(unit_preset)) {
					if(preset_units[unit_preset] > 0) {
						if(!($rootScope.data_farm.troops_not.some(elem => elem == unit_preset)) && verif_units(unit_preset, aldeia_units)) {
							aldeia_units[unit_preset].available = aldeia_units[unit_preset].available - preset_units[unit_preset];
							if(aldeia_units[unit_preset].available >= preset_units[unit_preset]){
								f.push([{[unit_preset] : preset_units[unit_preset]}, aldeia_units[unit_preset].available])
							}
						}
					}
				}
			}
			if(f.length)
				return [!0, aldeia_units];
			return [!1, aldeia_units];
		}
		, sendCmd = function (cmd_preset, lt_bb, callback) {
			var promise_send = undefined
			, result_units = []
			, permit_send = true
			, village_id = cmd_preset.village_id
			, preset_id = cmd_preset.preset_id
			, village = modelDataService.getSelectedCharacter().getVillage(village_id)
			, aldeia_units = angular.copy(village.unitInfo.units)
			, preset_units = cmd_preset.preset_units
			, aldeia_commands_lenght = countCommands[village_id].length
			, t_obj = units_analyze(preset_units, aldeia_units);
//			console.log("sendCmd " + village.data.name + " preset " + preset_id);
			lt_bb.splice($rootScope.data_villages.villages[village_id].presets[preset_id].max_commands_farm - aldeia_commands_lenght);
			if(lt_bb.length != 0){
				if(t_slice[village_id] == undefined){
					t_slice[village_id] = {};
				}
				if(t_obj){
					if(t_slice[village_id][preset_id] == undefined){
						t_slice[village_id] = {[preset_id] : Math.trunc(aldeia_units[Object.keys(t_obj)[0]].available / Object.values(t_obj)[0])}
					}
					if(t_slice[village_id][preset_id] > 0){
						var d = $rootScope.data_villages.villages[village_id].presets[preset_id].max_commands_farm - aldeia_commands_lenght;
						var s = Math.min(d, t_slice[village_id][preset_id])
						if(s > 0){
							var m = Math.min(lt_bb.length, s)
							angular.merge(t_slice[village_id], {[preset_id]: t_slice[village_id][preset_id] - m})
							lt_bb.splice(m);
						} else {
							t_slice[village_id] = {[preset_id] : 0}
						}
					} else {
						lt_bb.splice(0);
					}
				} else {
//					console.log("lt_bb lenght " + lt_bb.length);
//					console.log("no t_obj - no units village");
					callback(false);
					return !1;
				}
			} else {
				t_slice[village_id] = {[preset_id] : 0}
			}
//			countCommands[village_id] = countCommands[village_id].concat(lt_bb)
//			console.log("count command village" + village.data.name + " id " + village_id + " length " + lt_bb.length)

//			console.log("countCommands village - length " + countCommands[village_id].length);

			if(lt_bb.length == 0 || countCommands[village_id].length >= $rootScope.data_villages.villages[village_id].presets[preset_id].max_commands_farm){
//				console.log("no villages bb or commands limit");
				callback(true);
				return !1;
			}
			
//			console.log("lt_bb lenght " + lt_bb.length);

			lt_bb.forEach(function (barbara) {
				var f = function(barbara){
					if(!promise_send){
						promise_send = new Promise(function(resolve){
							if(permit_send){
								$timeout(function () {
									var params =  {
											start_village: village_id,
											target_village: barbara,
											army_preset_id: preset_id,
											type: "attack"
									}
									requestFn.trigger("Farm/sendCmd")
//									console.log(params)
//									console.log("count command " + g + h++)
									result_units = units_subtract(preset_units, aldeia_units)
									aldeia_units = result_units[1];
									permit_send = result_units[0];
									countCommands[village_id].push(village_id);
//									console.log("countCommands length " + countCommands[village_id].length)
//									console.log("enviando " + barbara + " para village " + village.data.name);
									socketService.emit(providers.routeProvider.SEND_PRESET, params);
									console.log(params);
									resolve()
								}, Math.round(($rootScope.data_farm.time_delay_farm / 2) + ($rootScope.data_farm.time_delay_farm * Math.random())))
							} else {
								resolve();
							}
						})
						.then(function(){
							promise_send = undefined;
							if(send_queue.length && permit_send){
								barbara = send_queue.shift()
//								console.log("new barbara - lenght " + send_queue.length);
								f(barbara)
							} else {
//								console.log("clear send_queue - lenght " + send_queue.length);
								send_queue = [];
								callback(true);
								return !0
							}
						})
					} else {
//						console.log("send_queue push bb.id " + barbara + " para village " + village.data.name);
						send_queue.push(barbara)
					}
				}
				f(barbara)
			});
			
		}
		, check_village = function (vill, cmd_preset, lt_b) {
			var village_id = cmd_preset.village_id
			, preset_id = cmd_preset.preset_id
			, village = modelDataService.getVillage(village_id) 
			, x1 = vill.x
			, y1 = vill.y 
			, x2 = village.data.x 
			, y2 = village.data.y

			var quadrant = 0;
			if(x1 < x2 && y1 < y2) {
				quadrant = 1
			} else if (x1 < x2 && y1 > y2) {
				quadrant = 4
			} else if (x1 > x2 && y1 < y2) {
				quadrant = 2
			} else if (x1 > x2 && y1 > y2) {
				quadrant = 3
			}

			if (y1 % 2) //se y é impar
				x1 += .5;
			if (y2 % 2)
				x2 += .5;
			var dy = y1 - y2
			, dx = x1 - x2
			, distancia = Math.abs(Math.sqrt(Math.pow(dx,2) + (Math.pow(dy,2) * 0.75)));

			var existBarbara = !Object.values(countCommands).map(function (key) {return key.find(f => f == vill.id)}).filter(f => f != undefined).length > 0;
			var existQuadrant = false;
			if($rootScope.data_villages.villages[village_id].presets[preset_id].quadrants){
				existQuadrant = $rootScope.data_villages.villages[village_id].presets[preset_id].quadrants.includes(quadrant);
			} else {
				existQuadrant = [1, 2, 3, 4].includes(quadrant);
			}
			if(existBarbara && existQuadrant) {
				return true
			} else {
				return false
			}
		}
		, loadVillages = function(cmd_preset, listaGrid, res){
//			console.log("loadVillages - listaGrid length "+ listaGrid.length)
			listaGrid.forEach(function(reg){
				if(promise_grid){
					command_queue.grid_queue.push([reg, cmd_preset, res])
				} else {
					exec_promise_grid(reg, cmd_preset, res)
				}
			})
		}
		, t = undefined
		, exec_promise_grid = function(reg, cmd_preset, res){
//			console.log("exec_promise_grid - reg "+ JSON.stringify(reg) + " cmd_preset " + cmd_preset.village_id + "/" + cmd_preset.preset_id)
			promise_grid = new Promise(function(resolve){
				t = $timeout(function(){
					resolve([]);
				}, conf_conf.LOADING_TIMEOUT);

				socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:(reg.x), y:(reg.y), width: reg.dist, height: reg.dist}, function (data) {
					$timeout.cancel(t);
					t = undefined;
					var lt_barbaras = []
					if (data != undefined && data.villages != undefined && data.villages.length > 0) {
						var listaVil = angular.copy(data.villages);
						var x2 = cmd_preset.x;
						var y2 = cmd_preset.y;

						listaVil = listaVil.filter(f=>f.affiliation == "barbarian")
						listaVil = listaVil.filter(f=>Math.abs(Math.sqrt(Math.pow(f.x - x2,2) + (Math.pow(f.y - y2,2) * 0.75))) > $rootScope.data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_journey_distance)
						listaVil = listaVil.filter(f=>Math.abs(Math.sqrt(Math.pow(f.x - x2,2) + (Math.pow(f.y - y2,2) * 0.75))) < $rootScope.data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_journey_distance)
						listaVil = listaVil.filter(f=>f.points > $rootScope.data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_points_farm)
						listaVil = listaVil.filter(f=>f.points < $rootScope.data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_points_farm)
						listaVil = listaVil.filter(f=>!lt_barbaras.find(g=>g==f.id))
						listaVil = listaVil.filter(f=>!$rootScope.data_farm.list_exceptions.find(g=>g==f.id))

						listaVil.sort(function (a, b) {
							Math.abs(Math.sqrt(Math.pow(b.x - x2,2) + (Math.pow(b.y - y2,2) * 0.75))) - Math.abs(Math.sqrt(Math.pow(a.x - x2,2) + (Math.pow(a.y - y2,2) * 0.75)))
						});

						for (j = 0; j < listaVil.length; j++) {
							if (check_village(listaVil[j], cmd_preset, lt_barbaras)) {
								lt_barbaras.push(listaVil[j].id);
							}
						}
					}
					resolve(lt_barbaras)
				});
			})
			.then(function(lst_bb){
				sendCmd(cmd_preset, lst_bb, function (cont) {
					promise_grid = undefined
					if(command_queue.grid_queue.length && cont){
						var t = command_queue.grid_queue.shift();
						reg = t[0];
						cmd_preset = t[1];
						res = t[2];
						exec_promise_grid(reg, cmd_preset, res)
					} else {
						res(cmd_preset.village_id)
					}
				});
			})
		}
		, exec_promise = function(commands_for_presets, resolve){
			if(!isRunning || !commands_for_presets.length){
//				console.log("no commands_for_presets - resolve exec_promise")
				resolve()
				return !1;
			}
			commands_for_presets.forEach(function(cmd_preset){
				var t = function(cmd_preset){
					if(!promise){
//						console.log("cmd_preset " + JSON.stringify(cmd_preset))
						promise = new Promise(function(res){
							var listaGrid = exec(cmd_preset)
							if(!listaGrid.length){return}
							loadVillages(cmd_preset, listaGrid, res);
						})
						.then(function(village_id){
//							console.log("preset finished para " + village_id);
							promise = undefined
							if(command_queue.farm_queue.length){
								cmd_preset = command_queue.farm_queue.shift();
								t(cmd_preset)
							} else {
//								console.log("resolve exec_promise")
								resolve()
							}
						})
					} else {
						command_queue.farm_queue.push(cmd_preset)
					}
				}
				t(cmd_preset)
			})
		}
		, clear = function(){
//			console.log("clear")
			countCommands = {}
			commands_for_send = []
			req = 0
			rdy = 0
			s = {}
			promise = undefined
			promise_grid = undefined
			promise_farm = undefined
			command_queue.farm_queue = []
			command_queue.grid_queue = []
			send_queue = []
			t_slice = {}
		}
		, execute_preset = function(tempo, resolve){
			return $timeout(
					function(){
						$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("farm_init", $rootScope.loc.ale, "farm")})
						clear()
						var commands_for_presets = []
						var villages = modelDataService.getSelectedCharacter().getVillageList();

						villages.forEach(function(village){
							var village_id = village.data.villageId
							, presets = $rootScope.data_villages.villages[village_id].presets
							, aldeia_units = angular.copy(village.unitInfo.units)
							, village_bonus = rallyPointSpeedBonusVsBarbarians[village.getBuildingData() ? village.getBuildingData().getDataForBuilding("rally_point").level :  1] * 100
							, aldeia_commands = village.getCommandListModel().data

							if(!presets || !aldeia_units) {
								return !0;
							}

							var presets_order = Object.keys(presets).map(function(preset){
								return Object.keys(presets[preset].units).map(function(key){
									return modelDataService.getGameData().data.units.map(function(obj, index, array){
										return presets[preset].units[key] > 0 && key == obj.name ? [obj.speed, presets[preset]] : undefined			
									}).filter(f=>f!=undefined)
								}).filter(f=>f.length>0)[0][0]
							}).sort(function(a,b){return a[0]-b[0]}).map(function(obj){return obj[1]})

							if(!countCommands[village_id]) {countCommands[village_id] = []}
							if(countCommands[village_id].length == 0 && aldeia_commands.length > 0) {
								aldeia_commands.forEach(function (aldeia) {
									countCommands[village_id].push(aldeia.targetVillageId);
								})
							}
							presets_order.forEach(function(preset){
								if(
										$rootScope.data_villages.villages[village_id].farm_activate
										&& units_analyze(preset.units, aldeia_units)
								) {
									var comando = {
											village_id				: village_id,
											bonus					: village_bonus,
											preset_id				: preset.id,
											preset_units			: preset.units,
											x						: village.data.x,
											y						: village.data.y,
											max_journey_distance	: get_dist(village_id, preset.id, village_bonus, preset.units)

									};
									if (!commands_for_presets.find(f => f === comando)) {
										commands_for_presets.push(comando);
									};
								};
							})
						})

						exec_promise(commands_for_presets, resolve)
					}, tempo)
		}
		, start = function () {
			if(isRunning) {return}
			clear()
			ready(function () {
				requestFn.trigger("Farm/run");

				isRunning = !0

				if(!completion_loaded){
					completion_loaded = !0;
					loadScript("/controllers/FarmCompletionController.js");
				}

				$rootScope.data_villages.getAssignedPresets();

				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})

				if (($rootScope.data_farm.farm_time_stop - convertedTime()) - $rootScope.data_farm.farm_time > 0) {
					var tempo_delay = $rootScope.data_farm.farm_time_start - convertedTime();
					if(tempo_delay < 0) {
						tempo_delay = 0
					} else {
						$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("wait_init", $rootScope.loc.ale, "farm")})
					};
					interval_init = $timeout(function () {
						command_queue.preset_queue = []
						var qtd_ciclo = Math.trunc(($rootScope.data_farm.farm_time_stop - $rootScope.data_farm.farm_time_start) / $rootScope.data_farm.farm_time);
						if (qtd_ciclo > 0 && !isNaN(parseInt(qtd_ciclo))) {
							for (i = 0; i < qtd_ciclo; i++) {
								var tempo = Math.round(($rootScope.data_farm.farm_time / 2) + ($rootScope.data_farm.farm_time * Math.random()));
								i == 0 ? tempo = 0: tempo;
								var f = function(tempo){
									if(!promise_farm){
//										console.log("promise_farm - ciclo time " + tempo)
										promise_farm = new Promise(function(resolve){
											execute_preset(tempo, resolve)
										})
										. then(function(){
//											console.log("execute_preset resolved")
											promise_farm = undefined;
											if(command_queue.preset_queue.length){
												tempo = command_queue.preset_queue.shift()
												f(tempo)
											}
										})
									} else {
										command_queue.preset_queue.push(tempo)
									}
								}
								f(i)
							}
						}

					}, tempo_delay);
					return;
				} else {
					isRunning = !1;
					$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: $filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm")})
					return;
				}
			}, ["all_villages_ready"])
		}
		, init = function (bool) {
			isInitialized = !0
			completion_loaded = !0
			loadScript("/controllers/FarmCompletionController.js");
			if(bool){return}
			start();
		}
		, clear = function(){
			Object.keys(timeoutIdFarm).map(function (key) {
				$timeout.cancel(timeoutIdFarm[key]);
			});
			interval_init = null
			timeoutIdFarm = {}
			listener_resume = undefined
			countCommands = {}
			commands_for_send = []
			req = 0
			rdy = 0
			s = {}
			promise = undefined
			promise_grid = undefined
			promise_farm = undefined
			command_queue.preset_queue = []
			command_queue.farm_queue = []
			command_queue.grid_queue = []
			send_queue = []
			t_slice = {}
		}
		, stop = function () {
			Object.keys(timeoutIdFarm).map(function (key) {
				$timeout.cancel(timeoutIdFarm[key]);
			});

			if(completion_loaded){
				completion_loaded = !1;
				robotTW2.removeScript("/controllers/FarmCompletionController.js");
			}

//			typeof(listener_change) == "function" ? listener_change(): null;
//			listener_change = undefined;
//			$rootScope.data_farm.clearBB();

			interval_init = null
			timeoutIdFarm = {}
			//		listener_change = undefined
			listener_resume = undefined
			countCommands = {}
			commands_for_send = []
			req = 0
			rdy = 0
			s = {}
			promise = undefined
			promise_grid = undefined
			promise_farm = undefined
			command_queue.preset_queue = []
			command_queue.farm_queue = []
			command_queue.grid_queue = []
			send_queue = []
			t_slice = {}
			isRunning = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})
		}
		, pause = function () {
			isPaused = !0
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})
		}
		, resume = function () {
			isPaused = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})
			$rootScope.$broadcast(providers.eventTypeProvider.RESUME_CHANGE_FARM, {name:"FARM"})
		}


		return	{
			init			: init,
			start			: start,
			stop 			: stop,
			pause 			: pause,
			resume 			: resume,
			isRunning		: function () {
				return isRunning
			},
			isPaused		: function () {
				return isPaused
			},
			isInitialized	: function () {
				return isInitialized
			},
			version			: version.farm,
			name			: "farm",
			analytics 		: function () {
				ga("create", "UA-115071391-2", "auto", "RobotTW2");
				ga('send', 'pageview');
				ga('RobotTW2.set', 'appName', 'RobotTW2');
				var player = modelDataService.getPlayer()
				, character = player.getSelectedCharacter()
				, e = [];
				e.push(character.getName()),
				e.push(character.getId()),
				e.push(character.getWorldId()),
				requestFn.bind("Farm/sendCmd", function () {
					ga("RobotTW2.send", "event", "commands", "farm_command", e.join("~"))
				})
				requestFn.bind("Farm/run", function () {
					ga("RobotTW2.send", "event", "run", "farm_run", e.join("~"))
				})
				requestFn.bind("Farm/cicle", function () {
					ga("RobotTW2.send", "event", "cicle", "farm_cicle", e.join("~"))
				})
			}
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.requestFn,
			robotTW2.loadScript,
			robotTW2.ready
	)
})
