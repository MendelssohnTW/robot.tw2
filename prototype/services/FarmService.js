define("robotTW2/services/villages_town", function(){
	var loadGrid = function(){
		var g = setupGrid();
		for (x = 0; x < 1000; x++) {
			for (y = 0; y < 1000; y++) {
				g[x][y] = {"id": null, "load":false}
			}	
		}
		return g
	}
	setupGrid = function () {
		var i, t = 0,
		arr;

		for (i = 0, arr = []; i < 1000; i++) {
			arr[i] = null;
		}
		return arr.concat().map(function (elem) {
			return arr.concat();
		});
	}
	, serv = {}
	, grid = loadGrid();

	serv.renew = function(){
		grid = loadGrid();
		return grid;
	}

	serv.loaded = function(x1, x2, y1, y2){
		for (i = x1; i <= x2; i++){
			for (j = y1; j <= y2; j++){
				grid[i][j]["load"] = true;
			}	
		}
	}

	serv.load = function(x1, x2, y1, y2){
		var list = []
		for (i = x1; i <= x2; i++){
			for (j = y1; j <= y2; j++){
				if(!grid[i][j]["load"]){
					return false
				}
			}
		}
		return true
	}

	Object.setPrototypeOf(grid, serv);

	return grid
})
define("robotTW2/services/FarmService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/time",
	"robotTW2/conf",
	"conf/conf",
	"helper/math",
	"robotTW2/calculateTravelTime",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_logs",
	"robotTW2/services/villages_town",
	], function(
			robotTW2,
			version,
			time,
			conf,
			conf_conf,
			math,
			calculateTravelTime,
			data_villages,
			data_logs,
			villages_town
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
		, countCommands = {}
		, completion_loaded = !1
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

			coordX = Math.trunc(coordX / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN
			coordY = Math.trunc(coordY / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN

			Math.trunc(dist / conf.MAP_CHUNCK_LEN) / (dist / conf.MAP_CHUNCK_LEN) < 1 ? ciclos = Math.trunc(dist / conf.MAP_CHUNCK_LEN) + 1 : ciclos = Math.trunc(dist / conf.MAP_CHUNCK_LEN);

			var t_ciclo = 0;

			if (ciclos % 2 < 1) {
				t_ciclo = ciclos + 1;
			} else {
				t_ciclo = ciclos;
			}

			var map_chunk_size = Math.round((dist * 2 + (x - dist - coordX)) / t_ciclo);

			var grid = setupGrid(t_ciclo)
			, list_excet = [];

			for (var i = 0; i < t_ciclo; i++) {
				for (var j = 0; j < t_ciclo; j++) {
					if(!villages_town.load(coordX + (map_chunk_size * i), coordX + (map_chunk_size * (i + 1)), coordY + (map_chunk_size * j), coordY + (map_chunk_size * (j + 1)))){
						grid[i][j] = {"x": coordX + (map_chunk_size * i), "y": coordY + (map_chunk_size * j), "dist": map_chunk_size, "loaded": false};	
					} else {
						grid[i][j] = {"x": coordX + (map_chunk_size * i), "y": coordY + (map_chunk_size * j), "dist": map_chunk_size, "loaded": true};
					}
				};
			};

			for (var i = t_ciclo - 1; i >= 0; i--){
				for (var j = t_ciclo - 1; j >= 0 ; j--){
					if(grid[i][j] == null){
						grid[i].splice(0, 1)
						if(!grid[i].length){
							grid.splice(0, 1)
						}
					}
				};
			};

			villages_town.loaded(coordX, (coordX + (t_ciclo * map_chunk_size)), coordY, (coordY + (t_ciclo * map_chunk_size)))

			return {grid: grid};
		}
		, exec = function (cmd_preset) {
			var x = cmd_preset.x
			, y = cmd_preset.y
			, preset_id = cmd_preset.preset_id
			, village_id = cmd_preset.village_id

			var load_map = loadMap(x, y, data_villages.villages[village_id].presets[preset_id].max_journey_distance)
			, grid = load_map.grid
			, listaGrid = []
			, l = Object.keys(grid).length

			for(tx = 0; tx < l; tx++) {
				for(ty = 0; ty < l; ty++) {
					listaGrid.push({
						x			: grid[tx][ty].x,
						y			: grid[tx][ty].y,
						dist		: grid[tx][ty].dist,
						village_id	: village_id,
						villages	: [],
						loaded		: grid[tx][ty].loaded
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

			return {listaGrid: listaGrid};
		}
		, units_has_unit_search = function (unit_search, units) {
			for(unit in units) {
				if (units.hasOwnProperty(unit)) {
					if (unit_search == unit) {
						return units[unit].available != undefined && units[unit].available > 0 ?  true : false;
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
							if (units_has_unit_search(unit_preset, aldeia_units)) {
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
						if(!($rootScope.data_farm.troops_not.some(elem => elem == unit_preset)) && units_has_unit_search(unit_preset, aldeia_units)) {
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
			var result_units = []
			, village_id = cmd_preset.village_id
			, preset_id = cmd_preset.preset_id
			, village = modelDataService.getSelectedCharacter().getVillage(village_id)
			, aldeia_units = angular.copy(village.unitInfo.units)
			, preset_units = cmd_preset.preset_units
			, aldeia_commands = village.getCommandListModel().data
			, t_obj = units_analyze(preset_units, aldeia_units);

			if(!countCommands[village_id]) {countCommands[village_id] = []}
			aldeia_commands.forEach(function (aldeia) {
				if(!countCommands[village_id].find(f=>f==aldeia.targetVillageId)){
					countCommands[village_id].push(aldeia.targetVillageId);
				}
			})

			var aldeia_commands_lenght = countCommands[village_id].length

			if(!t_obj){
				callback(false);
				return !1;
			}

			if(!lt_bb.length || aldeia_commands_lenght >= data_villages.villages[village_id].presets[preset_id].max_commands_farm){
				callback(true);
				return !0;
			}

			var cmd_rest = data_villages.villages[village_id].presets[preset_id].max_commands_farm - aldeia_commands_lenght;
			var cmd_possible = Math.trunc(aldeia_units[Object.keys(t_obj)[0]].available / Object.values(t_obj)[0]);
			var cmd_ind = Math.min(cmd_rest, cmd_possible)
			if(cmd_ind > 0){
				lt_bb.splice(data_villages.villages[village_id].presets[preset_id].max_commands_farm - aldeia_commands_lenght);
			} else {
				lt_bb.splice(0);
			}
			var r = undefined
			, promise_send = undefined
			, promise_send_queue= [];

			lt_bb.forEach(function (barbara) {
				var g = undefined;
				var f = function(bb){
					if(!promise_send){
						promise_send = new Promise(function(resolve_send){
							r = $timeout(function(){
								resolve_send(true)
							}, conf_conf.LOADING_TIMEOUT);
							g = $timeout(function () {
								if(!isRunning){return}
								var params =  {
										start_village: village_id,
										target_village: bb,
										army_preset_id: preset_id,
										type: "attack"
								}
								if (check_village(bb, cmd_preset) && countCommands[village_id] && !countCommands[village_id].some(f=>f==bb)) {
									countCommands[village_id].push(bb);
									requestFn.trigger("Farm/sendCmd")
									result_units = units_subtract(preset_units, aldeia_units)
									aldeia_units = result_units[1];
									var permit_send = result_units[0];
									var village_own = modelDataService.getSelectedCharacter().getVillage(village_id)
									var selectedVillage = modelDataService.getSelectedVillage();
									socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
										'my_village_id'		: selectedVillage.getId(),					
										'village_id'		: bb,
										'num_reports'		: 0
									}, function (village) {
//										data_logs.farm.push({"text":village_own.data.name + " " + $filter("i18n")("text_target", $rootScope.loc.ale, "farm") + " " + village.village_name + " " + village.village_x + "/" + village.village_y, "date": (new Date(time.convertedTime())).toString()})
										socketService.emit(providers.routeProvider.SEND_PRESET, params);
										resolve_send(permit_send)
									});
								} else {
									resolve_send(true)
								}
							}, Math.round(($rootScope.data_farm.time_delay_farm / 2) + ($rootScope.data_farm.time_delay_farm * Math.random())))
						})
						.then(function(permited){
							$timeout.cancel(r);
							r = undefined;
							$timeout.cancel(g);
							g = undefined;
							promise_send = undefined;
							if(promise_send_queue.length && permited){
								barbara = promise_send_queue.shift()
								f(barbara)
							} else {
								promise_send_queue = [];
								callback(true);
								return !0
							}
						})
					} else {
						promise_send_queue.push(barbara)
					}
				}
				f(barbara)
			});
		}
		, check_village = function (vill, cmd_preset) {
			if(typeof(vill) == "number"){
				return !Object.values(countCommands).map(function (key) {return key.find(f => f == vill)}).filter(f => f != undefined).length > 0 ? true : false
			} else {
				if(!vill) 
					return false;
				var village_id = cmd_preset.village_id
				, preset_id = cmd_preset.preset_id
				, village = modelDataService.getVillage(village_id) 
				, x1 = vill.x
				, y1 = vill.y 
				, x2 = village.data.x 
				, y2 = village.data.y

				var quadrant = 0;
				if(x1 <= x2 && y1 <= y2) {
					quadrant = 1
				} else if (x1 <= x2 && y1 > y2) {
					quadrant = 4
				} else if (x1 > x2 && y1 <= y2) {
					quadrant = 2
				} else if (x1 > x2 && y1 > y2) {
					quadrant = 3
				}

				var existBarbara = !Object.values(countCommands).map(function (key) {return key.find(f => f == vill.id)}).filter(f => f != undefined).length > 0;
				var existQuadrant = false;
				if(data_villages.villages[village_id].presets[preset_id].quadrants){
					existQuadrant = data_villages.villages[village_id].presets[preset_id].quadrants.includes(quadrant);
				} else {
					existQuadrant = [1, 2, 3, 4].includes(quadrant);
				}
				if(existBarbara && existQuadrant) {
					return true
				} else {
					return false
				}
			}
		}
		, loadVillages = function(cmd_preset, listaGrid){
			return new Promise(function(resol){
				var promise_grid = undefined
				, promise_grid_queue = [];

				listaGrid.forEach(function(reg){
					function t (c_preset, r){
						if(promise_grid){
							promise_grid_queue.push([r, c_preset])
						} else {
							promise_grid = exec_promise_grid(r, c_preset).then(function(lst_bb){
								if(!lst_bb || !lst_bb.length){
									promise_grid = undefined
									resol();
									return
								}
								sendCmd(c_preset, lst_bb, function (permited) {
									promise_grid = undefined	
									if(promise_grid_queue.length && permited){
										var j = promise_grid_queue.shift();
										r = j[0];
										c_preset = j[1];
//										res = t[2];
										t(c_preset, r)
									} else {
										resol()
									}
								});
							})
						}
					}
					t(cmd_preset, reg)
				})
			})
		}
		, t = undefined
		, exec_promise_grid = function(reg, cmd_preset){
			var get_dist = function (village_id, bb) {
				var village = modelDataService.getVillage(village_id);
				return math.actualDistance(village.getPosition(), {
					'x'			: bb.x,
					'y'			: bb.y
				})
			}

			return new Promise(function(resolve_grid){
				t = $timeout(function(){
					resolve_grid();
				}, conf_conf.LOADING_TIMEOUT);


				if(reg.loaded){
//					Buscar no town
				} else {
					socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:(reg.x), y:(reg.y), width: reg.dist, height: reg.dist}, function (data) {
						$timeout.cancel(t);
						t = undefined;
						if (data != undefined && data.villages != undefined && data.villages.length > 0) {
							var listaVil = angular.copy(data.villages)
							, x2 = cmd_preset.x
							, y2 = cmd_preset.y

							listaVil = listaVil.filter(f => f.affiliation == "barbarian")

							for (j = 0; j < listaVil.length; j++) {
								villages_town[listaVil[j].x][listaVil[j].y] = listaVil[j].id 
							}

							listaVil = listaVil.filter(f => get_dist(reg.village_id, f) > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_journey_distance)
							listaVil = listaVil.filter(f => get_dist(reg.village_id, f) < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_journey_distance)
							listaVil = listaVil.filter(f => f.points > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_points_farm)
							listaVil = listaVil.filter(f => f.points < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_points_farm)
//							listaVil = listaVil.filter(f => !lt_barbaras.find(g => g == f.id))
							listaVil = listaVil.filter(f => !$rootScope.data_farm.list_exceptions.find(g => g == f.id))

							listaVil.sort(function (a, b) {
//								Math.abs(Math.sqrt(Math.pow(b.x - x2,2) + (Math.pow(b.y - y2,2) * 0.75))) - Math.abs(Math.sqrt(Math.pow(a.x - x2,2) + (Math.pow(a.y - y2,2) * 0.75)))
								return get_dist(reg.village_id, a) - get_dist(reg.village_id, b)
							});

							for (j = 0; j < listaVil.length; j++) {
								if (check_village(listaVil[j], cmd_preset)) {
									reg.villages.push(listaVil[j].id);
								}
							}
						}
						resolve_grid(reg.villages)
					});
				}
			})
		}
		, execute_presets = function(commands_for_presets, resolve_cicle){
			return new Promise(function(resol){
				if(!isRunning || !commands_for_presets.length){
					resol()
					return !1;
				}

				var promise_preset = undefined
				, promise_preset_queue = [];

				commands_for_presets.forEach(function(cmd_preset){
					var t = function(cmd_preset){
						if(!promise_preset){
							promise_preset = new Promise(function(resolve_presets){
								var load_exec = exec(cmd_preset)
								, listaGrid = load_exec.listaGrid

								if(!listaGrid.length){return}
								loadVillages(cmd_preset, listaGrid).then(resolve_presets);
							})
							.then(function(c_preset){
								promise_preset = undefined
								if(promise_preset_queue.length){
									cmd_preset = promise_preset_queue.shift();
									t(cmd_preset)
								} else {
									data_logs.farm.push({"text":$filter("i18n")("terminate_cicle", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
									data_logs.set()
									resol()
								}
							})
						} else {
							promise_preset_queue.push(cmd_preset)
						}
					}
					t(cmd_preset)
				})
			})
		}
		, clear = function(){
			countCommands = {}
		}
		, execute_cicle = function(tempo){
			return new Promise(function(resol){
				var g = $timeout(function(){
					console.log("New cicle farm " + new Date(time.convertedTime()).toString())
					$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("farm_init", $rootScope.loc.ale, "farm")})
					clear()
					var commands_for_presets = []
					var villages = modelDataService.getSelectedCharacter().getVillageList();

					villages.forEach(function(village){
						var village_id = village.data.villageId
						, presets = data_villages.villages[village_id].presets
						, aldeia_units = angular.copy(village.unitInfo.units)

						if(!isRunning){
							resol();
							return !1;
						}
						if(!presets || !aldeia_units || !village_id) {
							resol();
							return !0;
						}

						var presets_order = Object.keys(presets).map(function(preset){
							return Object.keys(presets[preset].units).map(function(key){
								return modelDataService.getGameData().data.units.map(function(obj, index, array){
									return presets[preset].units[key] > 0 && key == obj.name ? [obj.speed, presets[preset]] : undefined			
								}).filter(f=>f!=undefined)
							}).filter(f=>f.length>0)[0][0]
						}).sort(function(a,b){return a[0]-b[0]}).map(function(obj){return obj[1]})

						presets_order.forEach(function(preset){
							if(
									data_villages.villages[village_id].farm_activate
									&& units_analyze(preset.units, aldeia_units)
							) {
								var comando = {
										village_id				: village_id,
										preset_id				: preset.id,
										preset_units			: preset.units,
										x						: village.data.x,
										y						: village.data.y

								};
								if (!commands_for_presets.find(f => f === comando)) {
									commands_for_presets.push(comando);
								};
							};
						})
					})

					execute_presets(commands_for_presets).then(resol)
					$timeout.cancel(g);
					g= undefined;

				}, tempo)
			})
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

				data_logs.farm = [];
				data_villages.getAssignedPresets();

				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})

				if (($rootScope.data_farm.farm_time_stop - time.convertedTime()) - $rootScope.data_farm.farm_time > 0) {
					var tempo_delay = $rootScope.data_farm.farm_time_start - time.convertedTime();
					if(tempo_delay < 0) {
						tempo_delay = 0
					} else {
						$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("wait_init", $rootScope.loc.ale, "farm")})
						data_logs.farm.push({"text":$filter("i18n")("wait_init", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
						data_logs.set()
					};
					interval_init = $timeout(function () {
						var init_first = true;
						var f = function(){
							if(time.convertedTime() + $rootScope.data_farm.farm_time < $rootScope.data_farm.farm_time_stop){
								var tempo = 0;
								if(!init_first){
									tempo = Math.round(($rootScope.data_farm.farm_time / 2) + ($rootScope.data_farm.farm_time * Math.random()));
								}
								init_first = false;
								execute_cicle(tempo).then(function(){
									console.log("Terminate cicle process " + new Date(time.convertedTime()).toString())
									data_logs.farm.push({"text":$filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
									data_logs.set()
									f()
								})
							} else {
								clear()
								data_logs.farm.push({"text":$filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
								data_logs.set()
							}
						}
						f()

					}, tempo_delay);
					return;
				} else {
					isRunning = !1;
					$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: $filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm")})
					data_logs.farm.push({"text":$filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
					data_logs.set()
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
			interval_init = null
			countCommands = {}
		}
		, stop = function () {
			villages_town.renew();
			if(completion_loaded){
				completion_loaded = !1;
				robotTW2.removeScript("/controllers/FarmCompletionController.js");
			}

			interval_init = null
			countCommands = {}
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