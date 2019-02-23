function loadGrid(limit){
	var g = setupGrid(limit);
	for (x = 0; x < limit; x++) {
		for (y = 0; y < limit; y++) {
			g[x][y] = {"loaded": false}
		}	
	}
	return g
}

function setupGrid(limit){
	var i, t = 0,
	arr;

	for (i = 0, arr = []; i < limit; i++) {
		arr[i] = null;
	}
	return arr.concat().map(function (elem) {
		return arr.concat();
	});
}

define("robotTW2/services/grid_town", ["robotTW2/conf"], function(conf){
	var limit = 0;
	if(1000 % conf.MAP_CHUNCK_LEN > 0){
		limit = (Math.trunc(1000 / conf.MAP_CHUNCK_LEN) + 1)
	} else {
		limit = 1000 / conf.MAP_CHUNCK_LEN
	}
	var serv = {}
	, grad = loadGrid(limit);

	serv.renew = function(){
		grad = loadGrid(limit);
		return grad;
	}

	serv.loaded = function(i, j){
		grad[i][j].loaded = true;
	}

	serv.load = function(i, j){
		return grad[i][j].loaded;
	}

	Object.setPrototypeOf(grad, serv);

	return grad
})

define("robotTW2/services/villages_town", function(){
	var serv = {}
	, grid = loadGrid(1000);

	serv.renew = function(){
		grid = loadGrid(1000);
		return grid;
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
	"robotTW2/databases/data_log",
	"robotTW2/databases/data_farm",
	"robotTW2/services/villages_town",
	"robotTW2/services/grid_town",
	], function(
			robotTW2,
			version,
			time,
			conf,
			conf_conf,
			math,
			calculateTravelTime,
			data_villages,
			data_log,
			data_farm,
			villages_town,
			grid_town
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
		setupGrid = function (t_ciclo_x, t_ciclo_y) {
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
		, loadMap = function (x, y, distX, distY) {

			var old_coordX = x - distX;
			var old_coordY = y - distY;
			var ciclosX = 0;
			var ciclosY = 0;

			var coordX = Math.trunc(old_coordX / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN
			var coordY = Math.trunc(old_coordY / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN

			var t_cicloX = (Math.round((x + distX) / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN - Math.round((x - distX) / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN) / conf.MAP_CHUNCK_LEN
			var t_cicloY = (Math.round((y + distY) / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN - Math.round((y - distY) / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN) / conf.MAP_CHUNCK_LEN

			var grid = setupGrid(t_cicloX, t_cicloY)

			for (var i = 0; i < t_cicloX; i++) {
				for (var j = 0; j < t_cicloY; j++) {
					grid[i][j] = {"x": coordX + (conf.MAP_CHUNCK_LEN * i), "y": coordY + (conf.MAP_CHUNCK_LEN * j), "distX": conf.MAP_CHUNCK_LEN, "distY": conf.MAP_CHUNCK_LEN};
				};
			};

			for (var i = t_cicloX - 1; i >= 0; i--){
				for (var j = t_cicloY - 1; j >= 0 ; j--){
					if(grid[i][j] == null){
						grid[i].splice(0, 1)
						if(!grid[i].length){
							grid.splice(0, 1)
						}
					}
				};
			};

			return {grid: grid};
		}
		, exec = function (cmd_preset) {
			var x = cmd_preset.x
			, y = cmd_preset.y
			, preset_id = cmd_preset.preset_id
			, village_id = cmd_preset.village_id

			var load_map = loadMap(x, y, data_villages.villages[village_id].presets[preset_id].max_journey_distance, data_villages.villages[village_id].presets[preset_id].max_journey_distance)
			, grid = load_map.grid
			, listaGrid = []
			, lx = Object.keys(grid).length
			, ly = 0
			if(lx > 0) {
				ly = Object.keys(grid[0]).length
				if(ly <= 0) {
					return {listaGrid: listaGrid};
				}
			} else {
				return {listaGrid: listaGrid};
			}

			for(tx = 0; tx < lx; tx++) {
				for(ty = 0; ty < ly; ty++) {
					listaGrid.push({
						x			: grid[tx][ty].x,
						y			: grid[tx][ty].y,
						distX		: grid[tx][ty].distX,
						distY		: grid[tx][ty].distY,
						village_id	: village_id,
						villages	: []
					});
				}
			};

			listaGrid.sort(function (a, b) {
				
				var aa = Math.abs(Math.sqrt(Math.pow(a.x - x) + (Math.pow(a.y - y) * 0.75)))
				var bb = Math.abs(Math.sqrt(Math.pow(b.x - x) + (Math.pow(b.y - y) * 0.75)))
				return aa - bb;
//				if (a.x != b.x) {
//					if (a.x - x < b.x - x) {
//						return -1;
//					};
//					if (a.x - x > b.x - x) {
//						return 1;
//					};
//				} else if(a.y != b.y) {
//					if (a.y - y < b.y - y) {
//						return -1;
//					};
//					if (a.y - y > b.y - y) {
//						return 1;
//					};
//				} else {
//					return 0;	
//				}
			});

			return {listaGrid: listaGrid};
		}
		, units_has_unit_search = function (unit_search, units) {
			for(unit in units) {
				if (units.hasOwnProperty(unit)) {
					if (unit_search == unit) {
						if(units[unit].available != undefined && units[unit].available >= 5){
							return true;
						}
					}
				}
			}
			return false;
		}
		, units_analyze = function (preset_units, aldeia_units, opt) {
			var f = []
			for (unit_preset in preset_units) {
				if (preset_units.hasOwnProperty(unit_preset)) {
					if(preset_units[unit_preset] >= 5) {
						if(data_farm.troops_not.some(elem => elem == unit_preset)) {
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
				if(opt){
					return !0;
				} else {
					f.sort(function(a,b){return a[1] - b[1]})
					return f.shift()[0]
				}
			} else {
				return !1;
			}
		}
		, units_subtract = function (preset_units, aldeia_units) {
			var f = []
			for (unit_preset in preset_units) {
				if (preset_units.hasOwnProperty(unit_preset)) {
					if(preset_units[unit_preset] > 0) {
						if(!(data_farm.troops_not.some(elem => elem == unit_preset)) && units_has_unit_search(unit_preset, aldeia_units)) {
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
							g = $timeout(function () {
								r = $timeout(function(){
									resolve_send(true)
								}, conf_conf.LOADING_TIMEOUT);
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
									socketService.emit(providers.routeProvider.SEND_PRESET, params);
									resolve_send(permit_send)
//									});
								} else {
									resolve_send(true)
								}
							}, Math.round((data_farm.time_delay_farm / 2) + (data_farm.time_delay_farm * Math.random())))
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
								promise_grid = undefined
								if(!lst_bb || !lst_bb.length){
									if(promise_grid_queue.length){
										var j = promise_grid_queue.shift();
										r = j[0];
										c_preset = j[1];
										t(c_preset, r)
									} else {
										resol()
									}
								} else {
									sendCmd(c_preset, lst_bb, function (permited) {
										if(promise_grid_queue.length && permited){
											var j = promise_grid_queue.shift();
											r = j[0];
											c_preset = j[1];
											t(c_preset, r)
										} else {
											resol()
										}
									});
								}
							})
						}
					}
					t(cmd_preset, reg)
				})

				listaGrid = null;
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
				}, conf_conf.LOADING_TIMEOUT + 20000);

				function send_for_socket(reg, t, resolve_grid, cmd_preset){
					socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:(reg.x), y:(reg.y), width: reg.distX, height: reg.distY}, function (data) {
						$timeout.cancel(t);
						t = undefined;
						if (data != undefined && data.villages != undefined && data.villages.length > 0) {
							if(!grid_town.load(reg.x / conf.MAP_CHUNCK_LEN, reg.y / conf.MAP_CHUNCK_LEN)){
								grid_town.loaded(reg.x / conf.MAP_CHUNCK_LEN, reg.y / conf.MAP_CHUNCK_LEN);
							}
							reg.loaded = true;
							var listaVil = angular.copy(data.villages)
							, x2 = cmd_preset.x
							, y2 = cmd_preset.y

							listaVil = listaVil.filter(f => f.affiliation == "barbarian")

							for (j = 0; j < listaVil.length; j++) {
								angular.extend(villages_town[listaVil[j].x][listaVil[j].y], listaVil[j])
							}

							listaVil = listaVil.filter(f => get_dist(reg.village_id, f) > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_journey_distance)
							listaVil = listaVil.filter(f => get_dist(reg.village_id, f) < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_journey_distance)
							listaVil = listaVil.filter(f => f.points > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_points_farm)
							listaVil = listaVil.filter(f => f.points < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_points_farm)
							listaVil = listaVil.filter(f => !data_farm.list_exceptions.find(g => g == f.id))

							listaVil.sort(function (a, b) {
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

				function search_for_town(reg, resolve_grid, cmd_preset){
					var x1 = reg.x
					, x2 = reg.x + reg.distX
					, y1 = reg.y
					, y2 = reg.y + reg.distY
					, listaVil = []

					for (x = x1; x < x2; x++) {
						for (y = y1; y < y2; y++) {
							if(villages_town[x][y].id != null){
								listaVil.push(villages_town[x][y])
							}
						}
					}

					listaVil = listaVil.filter(f => get_dist(reg.village_id, f) > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_journey_distance)
					listaVil = listaVil.filter(f => get_dist(reg.village_id, f) < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_journey_distance)
					listaVil = listaVil.filter(f => f.points > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_points_farm)
					listaVil = listaVil.filter(f => f.points < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_points_farm)
					listaVil = listaVil.filter(f => !data_farm.list_exceptions.find(g => g == f.id))

					listaVil.sort(function (a, b) {
						return get_dist(reg.village_id, a) - get_dist(reg.village_id, b)
					});

					for (j = 0; j < listaVil.length; j++) {
						if (check_village(listaVil[j], cmd_preset)) {
							reg.villages.push(listaVil[j].id);
						}
					}
					resolve_grid(reg.villages)
				}

				if(grid_town.load(reg.x / conf.MAP_CHUNCK_LEN, reg.y / conf.MAP_CHUNCK_LEN)){
					$timeout.cancel(t);
					t = undefined;
					search_for_town(reg, resolve_grid, cmd_preset);
				} else {
					send_for_socket(reg, t, resolve_grid, cmd_preset)
				}
			})
		}
		, execute_presets = function(commands_for_presets){
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
								if(!listaGrid.length){
									if(promise_preset_queue.length){
										cmd_preset = promise_preset_queue.shift();
										t(cmd_preset)
									} else {
										data_log.farm.push({"text":$filter("i18n")("terminate_cicle", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
										data_log.set()
										resol()
									}
								}
								loadVillages(cmd_preset, listaGrid).then(resolve_presets);
							})
							.then(function(c_preset){
								promise_preset = undefined
								if(promise_preset_queue.length){
									cmd_preset = promise_preset_queue.shift();
									t(cmd_preset)
								} else {
									data_log.farm.push({"text":$filter("i18n")("terminate_cicle", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
									data_log.set()
									resol()
								}
							})
						} else {
							promise_preset_queue.push(cmd_preset)
						}
					}
					t(cmd_preset)
				})
				commands_for_presets = null;
			})
		}
		, clear = function(){
			countCommands = {}
		}
		, execute_cicle = function(tempo){
			return new Promise(function(resol){
				var g = $timeout(function(){
					data_log.farm.push({"text":$filter("i18n")("init_cicles", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
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
									&& units_analyze(preset.units, aldeia_units, true)
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
					villages = null;
					execute_presets(commands_for_presets).then(resol)
					$timeout.cancel(g);
					g = undefined;
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

				data_log.farm = [];
				data_villages.getAssignedPresets();

				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})

				if ((data_farm.farm_time_stop - time.convertedTime()) - data_farm.farm_time > 0) {
					var tempo_delay = data_farm.farm_time_start - time.convertedTime();
					if(tempo_delay < 0) {
						tempo_delay = 0
					} else {
						$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("wait_init", $rootScope.loc.ale, "farm")})
						data_log.farm.push({"text":$filter("i18n")("wait_init", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
						data_log.set()
					};
					interval_init = $timeout(function () {
						var init_first = true;
						var f = function(){
							if(time.convertedTime() + data_farm.farm_time < data_farm.farm_time_stop){
								var tempo = 0;
								if(!init_first){
									tempo = Math.round((data_farm.farm_time / 2) + (data_farm.farm_time * Math.random()));
								}
								init_first = false;
								execute_cicle(tempo).then(function(){
									data_log.farm.push({"text":$filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
									data_log.set()
									f()
								})
							} else {
								clear()
								data_log.farm.push({"text":$filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
								data_log.set()
							}
						}
						f()

					}, tempo_delay);
					return;
				} else {
					isRunning = !1;
					$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: $filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm")})
					data_log.farm.push({"text":$filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
					data_log.set()
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