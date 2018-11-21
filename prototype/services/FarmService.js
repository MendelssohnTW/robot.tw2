define("robotTW2/services/FarmService", [
	"robotTW2",
	"helper/time",
	"robotTW2/conf",
	], function(
			robotTW2,
			helper,
			conf
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
		, timeoutCommandFarm = {}
//		, listener_change = undefined
		, listener_resume = undefined
		, countCommands = {}
		, commands_for_send = []
		, req = 0
		, rdy = 0
		, s = {}
		, promise = undefined
		, promise_grid = undefined
		, farm_queue = []
		, grid_queue = []
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
			, lista_atualizada = []
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
//				var m = Math.trunc(($rootScope.data_farm.presets[preset_id].max_journey_time / 60 / 1000 / list_select.pop()[1]) * (bonus / 100) * 0.75);
				var m = Math.trunc(($rootScope.data_villages.villages[village_id].presets[preset_id].max_journey_time / 60 / 1000 / list_select.pop()[1]) * (bonus / 100) * 0.75);
				var n = $rootScope.data_villages.villages[village_id].presets[preset_id].max_journey_distance;
				return Math.min.apply(null, [m, n])
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
			for (unit_preset in preset_units) {
				if (preset_units.hasOwnProperty(unit_preset)) {
					if(preset_units[unit_preset] > 0) {
						if(unit_preset != "snob") {
							if (verif_units(unit_preset, aldeia_units)) {
								if(aldeia_units[unit_preset].available >= preset_units[unit_preset]){
									return {[unit_preset] : preset_units[unit_preset]}
								} else {
									return false
								}
							}
						} else {
							return false
						}
					}
				}
			}
			return false
		}
		, sendCmd = function (cmd_preset, lt_bb, callback) {
			var village_id = cmd_preset.village_id
			, preset_id = cmd_preset.preset_id
			, village = modelDataService.getSelectedCharacter().getVillage(village_id)
			, aldeia_units = angular.copy(village.unitInfo.units)
			, preset_units = cmd_preset.preset_units
			, aldeia_commands_lenght = countCommands[village_id].length
			, t_obj = units_analyze(preset_units, aldeia_units);
			lt_bb.splice($rootScope.data_villages.villages[village_id].presets[preset_id].max_commands_farm - aldeia_commands_lenght);
			if(t_obj){
				var t_slice = Math.trunc(aldeia_units[Object.keys(t_obj)[0]].available / Object.values(t_obj)[0]);
				lt_bb.splice(t_slice);
			}
			countCommands[village_id] = countCommands[village_id].concat(lt_bb)
			var g = 0;
			lt_bb.forEach(function (barbara) {
				g++;
				timeoutCommandFarm[g] = function(){
					return $timeout(function () {
						var params =  {
								start_village: village_id,
								target_village: barbara,
								army_preset_id: preset_id,
								type: "attack"
						}
						requestFn.trigger("Farm/sendCmd")
						socketService.emit(providers.routeProvider.SEND_PRESET, params);

					}, ($rootScope.data_farm.time_delay_farm + (Math.random() * $rootScope.data_farm.time_delay_farm / 2)) * params.seq);
				}
			});

			callback();
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
			if(x2 > x1 && y2 < y1) {
				quadrant = 2
			} else if (x2 > x1 && y2 > y1) {
				quadrant = 3
			} else if (x2 < x1 && y2 < y1) {
				quadrant = 1
			} else if (x2 < x1 && y2 > y1) {
				quadrant = 4
			}

			if (y1 % 2) //se y é impar
				x1 += .5;
			if (y2 % 2)
				x2 += .5;
			var dy = y1 - y2
			, dx = x1 - x2
			, distancia = Math.abs(Math.sqrt(Math.pow(dx,2) + (Math.pow(dy,2) * 0.75)));

			var isBarbara = vill.affiliation == "barbarian";
			var existBarbara = !Object.values(countCommands).map(function (key) {return key.find(f => f == vill.id)}).filter(f => f != undefined).length > 0;
			var existLista = !lt_b.find(f => f == vill.id);
			var existException = !$rootScope.data_farm.list_exceptions.find(f => f == vill.id);
			var rangePoints = (vill.points >= $rootScope.data_villages.villages[village_id].presets[preset_id].min_points_farm && vill.points <= $rootScope.data_villages.villages[village_id].presets[preset_id].max_points_farm);
			var rangeDist = distancia >= $rootScope.data_villages.villages[village_id].presets[preset_id].min_journey_distance && distancia <= $rootScope.data_villages.villages[village_id].presets[preset_id].max_journey_distance
			var existQuadrant = false;
			if($rootScope.data_villages.villages[village_id].presets[preset_id].quadrants){
				existQuadrant = $rootScope.data_villages.villages[village_id].presets[preset_id].quadrants.includes(quadrant);
			} else {
				existQuadrant = [1, 2, 3, 4].includes(quadrant);
			}
			if(existException && rangePoints && rangeDist && existLista && existBarbara && existQuadrant && isBarbara) {
				return true
			} else {
				return false
			}
		}
		, loadVillages = function(cmd_preset, listaGrid, res, rej){
			listaGrid.forEach(function(reg){
				if(promise_grid){
					grid_queue.push(reg, cmd_preset)
				} else {
					if(grid_queue.length){
						grid_queue.push(reg);
						var t = grid_queue.shift();
						reg = t[0];
						cmd_preset = t[1];
						exec_promise_grid(reg, cmd_preset, res, rej)
					} else {
						exec_promise_grid(reg, cmd_preset, res, rej)
					}
				}
			})

		}
		, exec_promise_grid = function(reg, cmd_preset, res, rej){
			promise_grid = new Promise(function(resolve, reject){
				socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:(reg.x), y:(reg.y), width: reg.dist, height: reg.dist}, function (data) {
					var lt_barbaras = []
					if (data != undefined && data.villages != undefined && data.villages.length > 0) {
						var i = Math.round(Math.random() * 10);
						var listaVil = angular.copy(data.villages);
						var x2 = cmd_preset.x;
						var y2 = cmd_preset.y;

						listaVil = listaVil.filter(f=>Math.abs(Math.sqrt(Math.pow(f.x - x2,2) + (Math.pow(f.y - y2,2) * 0.75))) > $rootScope.data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_journey_distance)
						listaVil.sort(function (a, b) {
							Math.abs(Math.sqrt(Math.pow(b.x - x2,2) + (Math.pow(b.y - y2,2) * 0.75))) - Math.abs(Math.sqrt(Math.pow(a.x - x2,2) + (Math.pow(a.y - y2,2) * 0.75)))
						});

						for (j = 0; j < listaVil.length; j++) {
							if (check_village(listaVil[j], cmd_preset, lt_barbaras)) {
								lt_barbaras.push(listaVil[j].id);
							}
						}
						if (lt_barbaras.length > 0) {
							resolve(lt_barbaras)
						} else {
							reject();
						}
					} else {
						reject();
					}

				});
			})
			.then(function(lst_bb){
				sendCmd(cmd_preset, lst_bb, function () {
					promise_grid = undefined
					if(grid_queue.length){
						var t = grid_queue.shift();
						reg = t[0];
						cmd_preset = t[1];
						exec_promise_grid(reg, cmd_preset, res, rej)
					} else {
						res()
					}
				});
			}, function(){
				rej()
			})
		}
		, exec_promise = function(cmd_preset){
			promise = new Promise(function(res, rej){
				var listaGrid = exec(cmd_preset)
				if(!listaGrid.length){return}
				loadVillages(cmd_preset, listaGrid, res, rej);
			})
			.then(function(data){
				promise = undefined
				if(farm_queue.length){
					cmd_preset = farm_queue.shift();
					exec_promise(cmd_preset)
				}
			}, function(){
				if(farm_queue.length){
					cmd_preset = farm_queue.shift();
					exec_promise(cmd_preset)
				}

			})
		}
		, execute_commands = function(commands_for_presets){
			if(!isRunning || !commands_for_presets.length){return}
			commands_for_presets.forEach(function(cmd_preset){
				if(promise){
					farm_queue.push(cmd_preset)
				} else {
					if(farm_queue.length){
						farm_queue.push(cmd_preset);
						cmd_preset = farm_queue.shift();
						exec_promise(cmd_preset)
					} else {
						exec_promise(cmd_preset)
					}
				}
			})
		}
		, execute_preset = function(tempo){
			return $timeout(
					function(){
						var commands_for_presets = []
						var villages = modelDataService.getSelectedCharacter().getVillageList();
						villages.forEach(function(village){
							var village_id = village.data.villageId
							, presets = $rootScope.data_villages.villages[village_id].presets
							, aldeia_units = angular.copy(village.unitInfo.units)
							, village_bonus = rallyPointSpeedBonusVsBarbarians[village.getBuildingData() ? village.getBuildingData().getDataForBuilding("rally_point").level :  1] * 100
							, aldeia_commands = village.getCommandListModel().data

							if(!Object.keys(presets).length) {
								return	
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
						execute_commands(commands_for_presets)
					}, tempo)
		}
		, start = function () {
			if(isRunning) {return}
			stop()
			ready(function () {
				requestFn.trigger("Farm/run");
				loadScript("/controllers/FarmCompletionController.js");
				isRunning = !0
//				listener_change = $rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})

//				var villages = modelDataService.getSelectedCharacter().getVillages()
//				for (v in villages) {
//				$rootScope.data_farm.getVillageActivate(v) && typeof($rootScope.data_farm.getVillageActivate(v)) != "boolean" ? $rootScope.data_farm.setVillageActivate(v, true) : null;
//				}

//				var getAssignedPresets = function(vid){
//				var presetsByVillage = robotTW2.services.modelDataService.getPresetList().presetsByVillage;
//				return presetsByVillage[vid] ? Object.keys(presetsByVillage[vid]) : [];
//				}

//				Object.keys($rootScope.data_villages.villages).map(function(a){
//				$rootScope.data_villages.villages[a].assigned_presets = getAssignedPresets(a);
//				})

				$rootScope.data_villages.getAssignedPresets();

				if (($rootScope.data_farm.farm_time_stop - helper.gameTime()) - $rootScope.data_farm.farm_time > 0) {
					var tempo_delay = $rootScope.data_farm.farm_time_start - helper.gameTime();
					tempo_delay < 0 ? tempo_delay = 0 : tempo_delay;
					interval_init = $timeout(function () {
						$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("wait_init", $rootScope.loc.ale, "farm")})
						var qtd_ciclo = Math.trunc(($rootScope.data_farm.farm_time_stop - $rootScope.data_farm.farm_time_start) / $rootScope.data_farm.farm_time);
						if (qtd_ciclo > 0 && !isNaN(parseInt(qtd_ciclo))) {
							for (i = 0; i < qtd_ciclo; i++) {
								var t = $rootScope.data_farm.farm_time * i;
								var tempo = Math.round(t + ((t / 2) * Math.random()));
								timeoutIdFarm[i] = execute_preset(tempo)
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
		, init = function () {
			isInitialized = !0
			start();
		}
		, stop = function () {
			Object.keys(timeoutIdFarm).map(function (key) {
				$timeout.cancel(timeoutIdFarm[key]);
			});

			Object.keys(timeoutCommandFarm).map(function (key) {
				$timeout.cancel(timeoutCommandFarm[key]);
			});

			robotTW2.removeScript("/controllers/FarmCompletionController.js");

//			typeof(listener_change) == "function" ? listener_change(): null;
//			listener_change = undefined;
//			$rootScope.data_farm.clearBB();

			commands_for_send = []
			timeoutIdFarm = {}
			timeoutCommandFarm = {}
			listener_resume = undefined
			countCommands = {}
			commands_for_send = []
			req = 0
			rdy = 0
			s = {}

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
		, updatePst = function($event, data, a, b){
			console.log($event)
			console.log(data)
			console.log(a)
			console.log(b)
		}

		$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_DELETED, updatePst)
		$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_ASSIGNED, updatePst)
		$rootScope.$on(providers.eventTypeProvider.ARMY_PRESET_SAVED, updatePst)

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
			version			: "1.0.0",
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