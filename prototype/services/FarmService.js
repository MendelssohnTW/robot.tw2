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
	"struct/MapData"
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
			REPORT_TYPE_CONF,
			mapData
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
		, interval_cicle = null
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
						return [{[unit_preset] : preset_units[unit_preset]}, aldeia_units[unit_preset].available]
					}
				}
			}).filter(f=>f!=undefined)
			return [f.length, aldeia_units] 
		}
		, check_commands = function(cmd, village_id, preset_id, cicle){
			let lt = true
			if(cmd.data.type!="attack"){
				return false
			}
			lt = Object.keys(countCommands).map(function(cicle){
				return Object.keys(countCommands[cicle]).map(function(village_id){
					return Object.keys(countCommands[cicle][village_id]).map(function(preset_id){
						return countCommands[cicle][village_id][preset_id].some(f=>f==cmd.targetVillageId)
					}).some(f=>f==true)
				}).some(f=>f==true)
			}).some(f=>f==true)
			return !lt
		}
		, check_commands_for_bb = function(bb, cicle){
			let lt = false;
			lt = Object.keys(countCommands).map(function(cicle){
				return Object.keys(countCommands[cicle]).map(function(village_id){
					return Object.keys(countCommands[cicle][village_id]).map(function(preset_id){
						return countCommands[cicle][village_id][preset_id].some(f=>f==bb)
					}).every(f=>f==false)
				}).every(f=>f==true)
			}).every(f=>f==true)
			return lt
		}
		, sendCmd = function (cmd_preset, villages, cicle, callback) {
			var result_units = []
			, village_id = cmd_preset.village_id
			, preset_id = cmd_preset.preset_id
			, village = modelDataService.getSelectedCharacter().getVillage(village_id)
			, aldeia_units = angular.copy(village.unitInfo.units)
			, preset_units = cmd_preset.preset_units
			, aldeia_commands = village.getCommandListModel().data
			, t_obj = units_analyze(preset_units, aldeia_units)
			, lt_bb = Object.values(villages).map(function(el){
				return el.id
			})

			if(!countCommands[cicle]) {countCommands[cicle] = {}}
			if(!countCommands[cicle][village_id]) {countCommands[cicle][village_id] = {}}
			if(!countCommands[cicle][village_id]["village"]) {countCommands[cicle][village_id]["village"] = []}
			if(!countCommands[cicle][village_id][preset_id]) {countCommands[cicle][village_id][preset_id] = []}

			Object.keys(aldeia_commands).map(function (cmd) {
				if(check_commands(aldeia_commands[cmd], village_id, preset_id, cicle)){
					countCommands[cicle][village_id]["village"].push(aldeia_commands[cmd].targetVillageId);
				}
			})

			let max_cmds = Math.max.apply(null, Object.keys(data_villages.villages[village_id].presets).map(function(elem){
				return data_villages.villages[village_id].presets[elem].max_commands_farm
			})) || 0;

			if(!t_obj || t_obj[1] == 0 || aldeia_commands.length >= max_cmds){
				callback(false);
				return !1;
			}

			var cmd_rest_preset = max_cmds - aldeia_commands.length
			, cmd_rest = data_villages.villages[village_id].presets[preset_id].max_commands_farm - aldeia_commands.length
			, cmd_ind = Math.min(cmd_rest, t_obj[1], cmd_rest_preset)
			, r = undefined
			, promise_send = undefined
			, promise_send_queue = []
			, count_command_sent = 0;

			lt_bb = Object.keys(lt_bb).map(function (barbara) {
				if (check_commands_for_bb(lt_bb[barbara], cicle)) {
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
								let text = $filter("i18n")("text_preset", $rootScope.loc.ale, "farm") +	": " + params.army_preset_id
								$filter("i18n")("text_origin", $rootScope.loc.ale, "farm") + ": " + params.start_village + 
								$filter("i18n")("text_target", $rootScope.loc.ale, "farm") + ": " + params.target_village
								data_log.farm.push({"text":text, "date": (new Date(time.convertedTime())).toString()})
								data_log.set()
								socketService.emit(providers.routeProvider.SEND_PRESET, params);
								count_command_sent++;

								result_units = units_subtract(preset_units, aldeia_units)
								aldeia_units = result_units[1];
								var permit_send = !!result_units[0];

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
		, get_act_time = function (village_id, bb, units) {
			var village = modelDataService.getVillage(village_id);
			let dt =  math.actualDistance(village.getPosition(), {
				'x'			: bb.x,
				'y'			: bb.y
			})
			return get_time(village_id, dt, units)
		}
		, loadVillages = function(cmd_preset, cicle){
			return new Promise(function(resol){
				var promise_grid = undefined
				, promise_grid_queue = []
				, villages = []
				, x = cmd_preset.x
				, y = cmd_preset.y
				, preset_id = cmd_preset.preset_id
				, units = cmd_preset.preset_units
				, village_id = cmd_preset.village_id
				, dist = get_dist(village_id, cmd_preset.max_journey_time, cmd_preset.preset_units)

				var data = mapData.loadTownData(x, y, dist, dist)
				, dt = data.map(function(elem){
					return elem.data
				}).filter(f=>f!=null)

				dt.map(function(a){
					return Object.keys(a).map(function(x){
						return Object.keys(a[x]).map(function(y){
							return villages.push(a[x][y])
						})
					})
				})

				villages = villages.filter(f => f.affiliation == "barbarian")
				villages = villages.filter(f => get_act_time(village_id, f, units) > data_villages.villages[village_id].presets[preset_id].min_journey_time)
				villages = villages.filter(f => get_act_time(village_id, f, units) < data_villages.villages[village_id].presets[preset_id].max_journey_time)
				villages = villages.filter(f => f.points > data_villages.villages[village_id].presets[preset_id].min_points_farm)
				villages = villages.filter(f => f.points < data_villages.villages[village_id].presets[preset_id].max_points_farm)
				villages = villages.filter(f => !data_farm.list_exceptions.find(g => g == f.id))

				villages.sort(function (a, b) {
					return get_act_time(village_id, a, units) - get_act_time(village_id, b, units)
				});

				for (j = 0; j < villages.length; j++) {
					if (!check_village(villages[j], cmd_preset)) {
						villages = villages.filter(f=> f.id != villages[j])
					}
				}

				if(villages.length){
					sendCmd(cmd_preset, villages, cicle, function (permited) {
						resol()
					});
				} else {
					console.log("no villages.length " + JSON.stringify(cmd_preset))
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
								loadVillages(cmd_preset, cicle).then(resolve_presets);
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

				$timeout(function(){
					clear_partial()
					commands_for_presets[cicle] = []
					let villages = modelDataService.getSelectedCharacter().getVillageList();

					for(let i = 0; i < villages.length; i++){
						let village_id = villages[i].getId()
						, presets
						, aldeia_units
						, vill_attacked = modelDataService.getGroupList().getVillageGroups(village_id).some(f=>f.id==-5) && data_farm.attacked

						if(!isRunning){
							break;
						}
						if(!village_id || !data_villages.villages[village_id] || !data_villages.villages[village_id].farm_activate || vill_attacked) {
							continue
						} else {
							presets = data_villages.villages[village_id].presets
							aldeia_units = angular.copy(villages[i].getUnitInfo().getUnits())
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
										x						: villages[i].data.x,
										y						: villages[i].data.y,
										max_journey_time		: preset.max_journey_time,
										min_journey_time		: preset.min_journey_time

								};
								if (!commands_for_presets[cicle].find(f => f === comando)) {
									commands_for_presets[cicle].push(comando);
								}
							}
						})
					}

					if(commands_for_presets[cicle].length){
						execute_presets(commands_for_presets[cicle], cicle).then(resol)
					} else {
						resol()
					}
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
						if(interval_cicle){
							clearTimeout(interval_cicle)
						}
						interval_cicle = setTimeout(f, tempo)
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
