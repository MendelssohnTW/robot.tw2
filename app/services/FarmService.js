define("robotTW2/services/FarmService", [
	"robotTW2",
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
	"conf/reportTypes",
	], function(
			robotTW2,
			time,
			conf,
			conf_conf,
			math,
			calculateTravelTime,
			data_villages,
			data_log,
			data_farm,
			villages_town,
			grid_town,
			REPORT_TYPE_CONF
	){
	return (function FarmService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			armyService,
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
		, countCicle = 0
		, commands_for_presets = {}
		, completion_loaded = !1
		, listener_report
		, get_dist = function get_dist(villageId, journey_time, units) {
			var village = modelDataService.getSelectedCharacter().getVillage(villageId)
			, units = units
			, army = {
				'officers'	: {},
				"units"		: units
			}
			, travelTime = calculateTravelTime(army, village, "attack", {
				'barbarian'		: true
			})

			return Math.trunc((journey_time / 1000 / travelTime)) || 0;
		}
		, get_time = function get_time(villageId, distance, units) {
			var village = modelDataService.getSelectedCharacter().getVillage(villageId)
			, units = units
			, army = {
				'officers'	: {},
				"units"		: units
			}
			, travelTime = calculateTravelTime(army, village, "attack", {
				'barbarian'		: true
			})

			return armyService.getTravelTimeForDistance(army, travelTime, distance, "attack") * 1000 * 2
		}
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
		, loadMap = function (x, y, dist) {
			var old_coordX = x - dist
			, old_coordY = y - dist
			, ciclosX = 0
			, ciclosY = 0
			, coordX = Math.trunc(old_coordX / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN
			, coordY = Math.trunc(old_coordY / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN
			, t_cicloX = ((Math.round((x + dist) / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN) - coordX) / conf.MAP_CHUNCK_LEN || 1
			, t_cicloY = ((Math.round((y + dist) / conf.MAP_CHUNCK_LEN) * conf.MAP_CHUNCK_LEN) - coordY) / conf.MAP_CHUNCK_LEN || 1
			, grid = setupGrid(t_cicloX, t_cicloY)

			for (var i = 0; i < t_cicloX; i++) {
				for (var j = 0; j < t_cicloY; j++) {
					grid[i][j] = {"x": coordX + (conf.MAP_CHUNCK_LEN * i), "y": coordY + (conf.MAP_CHUNCK_LEN * j), "dist": conf.MAP_CHUNCK_LEN, "dist": conf.MAP_CHUNCK_LEN};
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
			, dist = get_dist(village_id, cmd_preset.max_journey_time, cmd_preset.preset_units)
			, load_map = loadMap(x, y, dist)
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
						dist		: grid[tx][ty].dist,
						village_id	: village_id,
						villages	: []
					});
				}
			};

			listaGrid.sort(function (a, b) {

				let aa = Math.abs(Math.sqrt(Math.pow((a.x + (a.dist / 2)) - x, 2) + (Math.pow((a.y + (a.dist / 2)) - y, 2) * 0.75)))
				let bb = Math.abs(Math.sqrt(Math.pow((b.x + (b.dist / 2)) - x, 2) + (Math.pow((b.y + (b.dist / 2)) - y, 2) * 0.75)))
				if(aa < bb){
					return -1
				}
				if(aa > bb){
					return 1
				}
				return 0
			});

			return {listaGrid: listaGrid};
		}
		, units_has_unit_search = function (unit_search, units) {
			return Object.keys(units).some(unit => unit == unit_search && units[unit].available != undefined && units[unit].available >= 2)
		}
		, units_analyze = function (preset_units, aldeia_units, opt) {
			var f = Object.keys(preset_units).map(function(unit_preset){
				if(preset_units[unit_preset] >= 2 && !data_farm.troops_not.some(elem => elem == unit_preset)) {
					if (units_has_unit_search(unit_preset, aldeia_units) && aldeia_units[unit_preset].available >= preset_units[unit_preset]) {
						return [{[unit_preset] : preset_units[unit_preset]}, Math.trunc(aldeia_units[unit_preset].available / preset_units[unit_preset])]
					}
				}
			}).filter(f=>f!=undefined).sort(function(a,b){return a[1] - b[1]}).shift()

			return f && opt ? !0 : f;
		}
		, units_subtract = function (preset_units, aldeia_units) {
			var f = Object.keys(preset_units).map(function(unit_preset){
				if(preset_units[unit_preset] > 0 && !(data_farm.troops_not.some(elem => elem == unit_preset)) && units_has_unit_search(unit_preset, aldeia_units)) {
					aldeia_units[unit_preset].available = aldeia_units[unit_preset].available - preset_units[unit_preset];
					if(aldeia_units[unit_preset].available >= preset_units[unit_preset]){
						return {[unit_preset] : preset_units[unit_preset]}, aldeia_units[unit_preset].available
					}
				}
			}).filter(f=>f!=undefined)
			return [f.length, aldeia_units] 
		}
		, check_commands = function(cmd, village_id, preset_id, cicle){
			let lt = true;
			let sum = 0;
			if(Object.values(countCommands[cicle][village_id]).length)
				sum = Object.values(countCommands[cicle][village_id]).map(function(elem){return elem}).reduce(function(a, b) {
					return a.concat(b);
				}).length;
			if((cmd.data.direction=="forward") && sum && sum < data_villages.villages[village_id].presets[preset_id].max_commands_farm){
				lt = Object.keys(countCommands[cicle][village_id]).map(function(pst){
					return !countCommands[cicle][village_id][pst].some(f=>f==cmd.targetVillageId)
				}).every(f=>f==true)
			} else {
				lt = true;
			}
			return lt
		}
		, check_commands_for_bb = function(bb, cicle){
			let lt = false;
			if(Object.keys(countCommands[cicle]).length)
				lt = Object.keys(countCommands[cicle]).map(function(elem){
					return Object.keys(countCommands[cicle][elem]).map(function(el){
						return countCommands[cicle][elem][el].some(f=>f==bb)
					}).every(f=>f==false)
				}).every(f=>f==true);
			return lt
		}
		, sendCmd = function (cmd_preset, lt_bb, cicle, callback) {
			var result_units = []
			, village_id = cmd_preset.village_id
			, preset_id = cmd_preset.preset_id
			, village = modelDataService.getSelectedCharacter().getVillage(village_id)
			, aldeia_units = angular.copy(village.unitInfo.units)
			, preset_units = cmd_preset.preset_units
			, aldeia_commands = village.getCommandListModel().data
			, t_obj = units_analyze(preset_units, aldeia_units);


			if(!countCommands[cicle]) {countCommands[cicle] = {}}
			if(!countCommands[cicle][village_id]) {countCommands[cicle][village_id] = {}}
			if(!countCommands[cicle][village_id]["village"]) {countCommands[cicle][village_id]["village"] = []}
			if(!countCommands[cicle][village_id][preset_id]) {countCommands[cicle][village_id][preset_id] = []}

			aldeia_commands.forEach(function (cmd) {
				if(check_commands(cmd, village_id, preset_id, cicle)){
					if(!countCommands[cicle][village_id]["village"].find(f=>f==cmd.targetVillageId)){
						countCommands[cicle][village_id]["village"].push(cmd.targetVillageId);
					}
				}
			})

			let max_cmds = Math.max.apply(null, Object.keys(data_villages.villages[village_id].presets).map(function(elem){
				return data_villages.villages[village_id].presets[elem].max_commands_farm
			})) || 0;

			let sum = Object.values(countCommands[cicle][village_id]).map(function(elem){return elem}).reduce(function(a, b) {
				return a.concat(b);
			}).length

			var aldeia_commands_lenght = sum;

			if(!t_obj || aldeia_commands_lenght >= max_cmds){
				callback(false);
				return !1;
			}

			var cmd_rest_preset = max_cmds - aldeia_commands_lenght
			, cmd_rest = data_villages.villages[village_id].presets[preset_id].max_commands_farm - aldeia_commands_lenght
			, cmd_ind = Math.min(cmd_rest, t_obj[1], cmd_rest_preset)
			, r = undefined
			, promise_send = undefined
			, promise_send_queue = []
			, count_command_sent = 0;

			lt_bb = Object.keys(lt_bb).map(function (barbara) {
				if (check_commands_for_bb(barbara, cicle)) {
					return lt_bb[barbara]
				}
			}).filter(f=>f!=undefined)

			lt_bb = lt_bb.splice(0, cmd_ind)

			if(!lt_bb.length){
				callback(true);
				return !0;
			}

			lt_bb.forEach(function (barbara) {
				var g = undefined
				, f = function(bb){
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
								countCommands[cicle][village_id][preset_id].push(bb);
								result_units = units_subtract(preset_units, aldeia_units)
								aldeia_units = result_units[1];
								var permit_send = result_units[0];

								//text_preset
								let text = $filter("i18n")("text_preset", $rootScope.loc.ale, "farm") +	": " + params.army_preset_id
								$filter("i18n")("text_origin", $rootScope.loc.ale, "farm") + ": " + params.start_village + 
								$filter("i18n")("text_target", $rootScope.loc.ale, "farm") + ": " + params.target_village
								data_log.farm.push({"text":text, "date": (new Date(time.convertedTime())).toString()})
								data_log.set()
								socketService.emit(providers.routeProvider.SEND_PRESET, params);
								count_command_sent++;
								resolve_send(permit_send)
							}, Math.round((data_farm.time_delay_farm / 2) + (data_farm.time_delay_farm * Math.random())))
						})
						.then(function(permited){
							$timeout.cancel(r);
							r = undefined;
							$timeout.cancel(g);
							g = undefined;
							promise_send = undefined;
							if(promise_send_queue.length && permited && count_command_sent <= cmd_ind){
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

			var existQuadrant = false;
			if(data_villages.villages[village_id].presets[preset_id].quadrants){
				existQuadrant = data_villages.villages[village_id].presets[preset_id].quadrants.includes(quadrant);
			} else {
				existQuadrant = [1, 2, 3, 4].includes(quadrant);
			}
			if(existQuadrant) {
				return true
			} else {
				return false
			}
		}
		, loadVillages = function(cmd_preset, listaGrid, cicle){
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
									sendCmd(c_preset, lst_bb, cicle, function (permited) {
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
			var get_act_time = function (village_id, bb) {
				var village = modelDataService.getVillage(village_id);
				let dt =  math.actualDistance(village.getPosition(), {
					'x'			: bb.x,
					'y'			: bb.y
				})

				return get_time(village_id, dt, cmd_preset.preset_units)
			}

			return new Promise(function(resolve_grid){
				var send_socket = undefined;
				t = $timeout(function(){
					send_socket = undefined;
					resolve_grid();
				}, conf_conf.LOADING_TIMEOUT);

				function send_for_socket(reg, t, resolve_grid, cmd_preset){
					send_socket = socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:(reg.x), y:(reg.y), width: reg.dist, height: reg.dist}, function (data) {
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

							listaVil = listaVil.filter(f => get_act_time(reg.village_id, f) > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_journey_time)
							listaVil = listaVil.filter(f => get_act_time(reg.village_id, f) < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_journey_time)
							listaVil = listaVil.filter(f => f.points > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_points_farm)
							listaVil = listaVil.filter(f => f.points < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_points_farm)
							listaVil = listaVil.filter(f => !data_farm.list_exceptions.find(g => g == f.id))

							listaVil.sort(function (a, b) {
								return get_act_time(reg.village_id, a) - get_act_time(reg.village_id, b)
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
					, x2 = reg.x + reg.dist
					, y1 = reg.y
					, y2 = reg.y + reg.dist
					, listaVil = []

					for (x = x1; x < x2; x++) {
						for (y = y1; y < y2; y++) {
							if(villages_town[x][y].id != null){
								listaVil.push(villages_town[x][y])
							}
						}
					}

					listaVil = listaVil.filter(f => get_act_time(reg.village_id, f) > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_journey_time)
					listaVil = listaVil.filter(f => get_act_time(reg.village_id, f) < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_journey_time)
					listaVil = listaVil.filter(f => f.points > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_points_farm)
					listaVil = listaVil.filter(f => f.points < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_points_farm)
					listaVil = listaVil.filter(f => !data_farm.list_exceptions.find(g => g == f.id))

					listaVil.sort(function (a, b) {
						return get_act_time(reg.village_id, a) - get_act_time(reg.village_id, b)
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
		, execute_presets = function(commands_for_presets, cicle){
			return new Promise(function(resol){
				if(!isRunning || !commands_for_presets.length){
					resol()
					return;
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
								} else {
									loadVillages(cmd_preset, listaGrid, cicle).then(resolve_presets);
								}
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
		, execute_cicle = function(tempo, cicle){
			return new Promise(function(resol){
				angular.extend(data_villages, data_villages.get());
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})

				var g = $timeout(function(){
					clear_partial()
					commands_for_presets[cicle] = []
					let villages = modelDataService.getSelectedCharacter().getVillageList();

					villages.forEach(function(village){
						var village_id = village.data.villageId
						, presets
						, aldeia_units;

						if(!village_id || !isRunning || !data_villages.villages[village_id] || !data_villages.villages[village_id].farm_activate) {
							resol();
							return;
						} else {
							presets = data_villages.villages[village_id].presets
							aldeia_units = angular.copy(village.unitInfo.units)
						}

						var presets_order = Object.keys(presets).map(function(preset){
							return Object.keys(presets[preset].units).map(function(key){
								return modelDataService.getGameData().data.units.map(function(obj, index, array){
									return presets[preset].units[key] > 0 && key == obj.name ? [obj.speed, presets[preset]] : undefined			
								}).filter(f=>f!=undefined)
							}).filter(f=>f.length>0)[0][0]
						}).sort(function(a,b){return a[0]-b[0]}).map(function(obj){return obj[1]})

						presets_order.forEach(function(preset){
							if(units_analyze(preset.units, aldeia_units, true)) {
								var comando = {
										village_id				: village_id,
										preset_id				: preset.id,
										preset_units			: preset.units,
										x						: village.data.x,
										y						: village.data.y,
										max_journey_time		: preset.max_journey_time,
										min_journey_time		: preset.min_journey_time

								};
								if (!commands_for_presets[cicle].find(f => f === comando)) {
									commands_for_presets[cicle].push(comando);
								}
							}
						})
					})

					execute_presets(commands_for_presets[cicle], cicle).then(resol)
					if(g.$$state && g.$$state.status == 0)
						$timeout.cancel(g),	g = undefined;
				}, tempo)
			})
		}
		, analyze_report = function analyze_report(event, data){
			if(data.type == "attack" && data.read == 0 && (data.result === REPORT_TYPE_CONF.RESULT_TYPES.CASUALTIES || data.result === REPORT_TYPE_CONF.RESULT_TYPES.DEFEAT)){
				data_farm.list_exceptions.push(data.target_village_id)
				data_farm.set();
			}
		}
		, start = function () {

			if(isRunning) {return}
			clear()

			function execute_init(opt){
				isRunning = !0
				var init_first = true;
				var f = function(){
					if(!isRunning) {return}
					this.opt = opt;
					countCicle++
					if((time.convertedTime() + data_farm.farm_time < data_farm.farm_time_stop) || this.opt){
						let tempo = Math.round((data_farm.farm_time / 2) + (data_farm.farm_time * Math.random()))
						!data_farm.complete ? data_farm.complete = 0 : null;
						data_farm.complete = time.convertedTime() + tempo
						data_farm.set()
						$timeout(f, tempo)
						let gt = tempo
						if(init_first)
							gt = 0;
						execute_cicle(gt, countCicle).then(function(){
							init_first = false;
							let cCicle = countCicle;
							data_log.farm.push({"text":$filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
							data_log.set()
							clear_partial(cCicle)
						})
					} else {
						clear_partial(countCicle)
						data_log.farm.push({"text":$filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
						data_log.set()
					}
				}
				f()
			}

			ready(function () {
				if(!completion_loaded){
					completion_loaded = !0;
					loadScript("/controllers/FarmCompletionController.js", true);
				}
				listener_report = $rootScope.$on(providers.eventTypeProvider.REPORT_NEW, analyze_report)

				data_log.farm = [];
				data_villages.getAssignedPresets();

				if(!data_farm.infinite && data_farm.farm_time != 0){
					if ((data_farm.farm_time_stop - time.convertedTime()) - data_farm.farm_time > 0) {
						var tempo_delay = data_farm.farm_time_start - time.convertedTime();
						if(tempo_delay < 0) {
							tempo_delay = 0
						} else {
							$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("wait_init", $rootScope.loc.ale, "farm")})
							data_log.farm.push({"text":$filter("i18n")("wait_init", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
							data_log.set()
						};
						data_farm.complete = time.convertedTime() + tempo_delay
						data_farm.set()
						!interval_init ? interval_init = $timeout(function () {
							data_log.farm.push({"text":$filter("i18n")("init_cicles", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
							$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("farm_init", $rootScope.loc.ale, "farm")})
							execute_init()
						}, tempo_delay): null;
						return;
					} else {
						isRunning = !1;
						$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: $filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm")})
						data_log.farm.push({"text":$filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm"), "date": (new Date(time.convertedTime())).toString()})
						data_log.set()
						return;
					}
				} else {
					data_farm.infinite = true;
					data_farm.set();
					execute_init(true)
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
			villages_town.renew();
			grid_town.renew();
			countCommands = {}
			countCicle = 0;
		}
		, clear_partial = function(cicle){
			delete countCommands[cicle]
			delete commands_for_presets[cicle]
		}
		, stop = function () {
			if(completion_loaded){
				completion_loaded = !1;
				robotTW2.removeScript("/controllers/FarmCompletionController.js");
			}

			typeof(listener_report) == "function" ? listener_report(): null;
			listener_report = undefined

			clear();
			isRunning = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})
		}

		return	{
			init			: init,
			start			: start,
			stop 			: stop,
			isRunning		: function () {
				return isRunning
			},
			isPaused		: function () {
				return isPaused
			},
			isInitialized	: function () {
				return isInitialized
			},
			version			: conf.VERSION.FARM,
			name			: "farm"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.armyService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.requestFn,
			robotTW2.loadScript,
			robotTW2.ready
	)
})