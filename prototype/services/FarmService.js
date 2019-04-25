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
	"struct/MapData",
	"helper/format"
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
			mapData,
			formatHelper
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
		, paused_promise = undefined
		, paused_queue = false
		, interval_init = null
		, interval_cicle = null
		, countCommands = {}
		, promise_send = {}
		, promise_send_queue = []
		, countCicle = 0
		, commands_for_presets = {}
		, completion_loaded = !1
		, listener_report
		, listener_pause
		, listener_resume
		, get_dist = function get_dist(villageId, journey_time, units) {
			var village = modelDataService.getSelectedCharacter().getVillage(villageId)
			, army = {
				'officers'	: {},
				"units"		: units
			}
			, travelTime = calculateTravelTime(army, village, "attack", {
				'barbarian'		: true
			})

			return Math.trunc((journey_time / 1000 / travelTime)) || 0;
		}
		, get_time = function get_time(villageId, bb, units) {
			var village = modelDataService.getVillage(villageId)
			, distance =  math.actualDistance(village.getPosition(), {
				'x'			: bb.x,
				'y'			: bb.y
			})
			, army = {
				'officers'	: {},
				"units"		: units
			}
			, travelTime = calculateTravelTime(army, village, "attack", {
				'barbarian'		: true
			})

			return armyService.getTravelTimeForDistance(army, travelTime, distance, "attack") * 1000
		}
		, units_has_exception = function (units) {
			return Object.keys(units).map(function(unit){
				return data_farm.troops_not.some(elem => elem == unit && units[elem] > 0)
			}).some(elem => elem == true)
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
//		, units_subtract = function (preset_units, aldeia_units) {
//		var f = Object.keys(preset_units).map(function(unit_preset){
//		if(preset_units[unit_preset] > 0 && !(data_farm.troops_not.some(elem => elem == unit_preset)) && units_has_unit_search(unit_preset, aldeia_units)) {
//		aldeia_units[unit_preset].available = aldeia_units[unit_preset].available - preset_units[unit_preset];
//		if(aldeia_units[unit_preset].available >= preset_units[unit_preset]){
//		return [{[unit_preset] : preset_units[unit_preset]}, aldeia_units[unit_preset].available]
//		}
//		}
//		}).filter(f=>f!=undefined)
//		return [f.length, aldeia_units] 
//		}
		, check_commands = function(cmd, village_id, preset_id, cicle){
			let lt = true
			if(cmd.data.type!="attack"){
				return false
			}

//			if(data_farm.cicle_distinct){
			lt =  Object.keys(countCommands[cicle]).map(function(village_id){
				return Object.keys(countCommands[cicle][village_id]).map(function(preset_id){
					return countCommands[cicle][village_id][preset_id].some(f=>f==cmd.targetVillageId)
				}).some(f=>f==true)
			}).some(f=>f==true)
//			} else {
//			lt = Object.keys(countCommands).map(function(cicle){
//			return  Object.keys(countCommands[cicle]).map(function(village_id){
//			return Object.keys(countCommands[cicle][village_id]).map(function(preset_id){
//			return countCommands[cicle][village_id][preset_id].some(f=>f==cmd.targetVillageId)
//			}).some(f=>f==true)
//			}).some(f=>f==true)
//			}).some(f=>f==true)
//			}

			return !lt
		}
		, check_commands_for_bb = function(bb, cicle){
			let lt = false;

//			if(data_farm.cicle_distinct){
			lt = Object.keys(countCommands[cicle]).map(function(village_id){
				return Object.keys(countCommands[cicle][village_id]).map(function(preset_id){
					return countCommands[cicle][village_id][preset_id].some(f=>f==bb)
				}).every(f=>f==false)
			}).every(f=>f==true)

//			} else {
//			lt = Object.keys(countCommands).map(function(cicle){
//			return Object.keys(countCommands[cicle]).map(function(village_id){
//			return Object.keys(countCommands[cicle][village_id]).map(function(preset_id){
//			return countCommands[cicle][village_id][preset_id].some(f=>f==bb)
//			}).every(f=>f==false)
//			}).every(f=>f==true)
//			}).every(f=>f==true)
//			}
			return lt
		}
		, sendCmd = function (cmd_preset, cicle_internal) {
			return new Promise(function(resv, rejc){
				var result_units = []
				, preset_id = cmd_preset.preset_id
				, village = modelDataService.getSelectedCharacter().getVillage(cmd_preset.village_id)
				, aldeia_units = angular.copy(village.unitInfo.units)
				, preset_units = cmd_preset.preset_units
				, aldeia_commands = village.getCommandListModel().getCommands()
				, t_obj = units_analyze(preset_units, aldeia_units)

				if(!countCommands[cicle_internal]) {countCommands[cicle_internal] = {}}
				if(!countCommands[cicle_internal][cmd_preset.village_id]) {countCommands[cicle_internal][cmd_preset.village_id] = {}}
				if(!countCommands[cicle_internal][cmd_preset.village_id]["village"]) {countCommands[cicle_internal][cmd_preset.village_id]["village"] = []}
				if(!countCommands[cicle_internal][cmd_preset.village_id][preset_id]) {countCommands[cicle_internal][cmd_preset.village_id][preset_id] = []}

				aldeia_commands.length ? aldeia_commands.forEach(function (cmd) {
					if(check_commands(cmd, cmd_preset.village_id, preset_id, cicle_internal)){
						countCommands[cicle_internal][cmd_preset.village_id]["village"].push(cmd.targetVillageId);
					}
				}) : aldeia_commands = [];

				let max_cmds = Math.max.apply(null, Object.keys(data_villages.villages[cmd_preset.village_id].presets).map(function(elem){
					return data_villages.villages[cmd_preset.village_id].presets[elem].max_commands_farm
				})) || 0;

				if(!t_obj || t_obj[1] == 0 || aldeia_commands.length >= max_cmds){
					resv();
					return !1;
				}

				var cmd_rest_preset = max_cmds - aldeia_commands.length
				, cmd_rest = data_villages.villages[cmd_preset.village_id].presets[preset_id].max_commands_farm - aldeia_commands.length
				, cmd_ind = Math.min(cmd_rest, t_obj[1], cmd_rest_preset)
				, r = undefined
				, villages = []
				, dist = get_dist(cmd_preset.village_id,cmd_preset.max_journey_time, cmd_preset.preset_units) / 2
				, data = mapData.loadTownData(Math.trunc(cmd_preset.x - (dist / 2)), Math.trunc(cmd_preset.y - (dist / 2)), Math.trunc(dist * 1.42), Math.trunc(dist * 1.42))
				, dt = data.map(function(elem){
					return elem.data
				}).filter(f=>f!=null)

				if(cmd_ind <= 0 || !countCommands[cicle_internal][cmd_preset.village_id] || !preset_id){
					resv();
					return;
				}

				dt.map(function(a){
					return Object.keys(a).map(function(x){
						return Object.keys(a[x]).map(function(y){
							return !villages.find(f => f.id == a[x][y].id) ? villages.push(a[x][y]) : undefined
						})
					})
				})

				villages = villages.filter(f => f.affiliation == "barbarian") //filtra as barbaras
				villages = villages.filter(f => !data_farm.list_exceptions.find(g => g == f.id)) // filtra as excessões

				villages = Object.keys(villages).map(function (barbara) { //verificar a presença da aldeia nos comandos existentes do ciclo
					if (check_commands_for_bb(villages[barbara], cicle_internal)) {
						return villages[barbara]
					}
				}).filter(f=>f!=undefined)

				let new_villages = []

				for (j = 0; j < villages.length; j++) { // filtra as aldeias por quadrantes
					if (check_village(villages[j], cmd_preset)) {
						new_villages.push(villages[j])
					}
				}

				villages = new_villages

				villages = villages.filter(f => get_time(cmd_preset.village_id, f, cmd_preset.preset_units) > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_journey_time / 2)
				villages = villages.filter(f => get_time(cmd_preset.village_id, f, cmd_preset.preset_units) < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_journey_time / 2)
				villages = villages.filter(f => f.points > data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_points_farm)
				villages = villages.filter(f => f.points < data_villages.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_points_farm)

				if(!data_farm.unit_direction){
					villages.sort(function (a, b) {
						return get_time(cmd_preset.village_id, a, cmd_preset.preset_units) - get_time(cmd_preset.village_id, b, cmd_preset.preset_units) //sorteia em ordem crescente conforme distância da origem
					});
				} else {
					villages.sort(function (a, b) {
						return get_time(cmd_preset.village_id, b, cmd_preset.preset_units) - get_time(cmd_preset.village_id, a, cmd_preset.preset_units) //sorteia em ordem crescente conforme distância da origem
					});
				}

				villages = villages.splice(0, cmd_ind) // separa somentes as aldeias possiveis de comandos

				if(!villages.length){
					resv();
					return !0;
				}

				villages.forEach(function (barbara) {
					var f = function(bb, cicle_internal, cmd_preset_internal){
						if(!promise_send[cicle_internal]){
							promise_send[cicle_internal] = new Promise(function(resolve_send, reject_send){
								$timeout(function () {

									function execute(){
										typeof(listener_resume) == "function" ? listener_resume(): null;
										listener_resume = undefined
										r = $timeout(function(){
											resolve_send()
										}, conf_conf.LOADING_TIMEOUT);
										if(!isRunning){
											reject_send()
											return
										}
										var params =  {
												start_village: cmd_preset_internal.village_id,
												target_village: bb.id,
												army_preset_id: cmd_preset_internal.preset_id,
												type: "attack"
										}

										data_log.farm.push(
												{
													"text": Object.keys(modelDataService.getPresetList().presets).map(function(elem){return modelDataService.getPresetList().presets[elem]}).find(f=>f.id==cmd_preset_internal.preset_id).name,
													"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
													"target": formatHelper.villageNameWithCoordinates(bb),
													"date": time.convertedTime()
												}
										)
										data_log.set()

										countCommands[cicle_internal][cmd_preset_internal.village_id][cmd_preset_internal.preset_id].push(bb);
										socketService.emit(providers.routeProvider.SEND_PRESET, params);
										resolve_send()

									}

									if(isPaused){
										typeof(listener_resume) == "function" ? listener_resume(): null;
										listener_resume = undefined
										listener_resume = $rootScope.$on(providers.eventTypeProvider.RESUME, function(){
											execute()
										})
									} else {
										execute()
									}

								}, Math.round((data_farm.time_delay_farm / 2) + (data_farm.time_delay_farm * Math.random())))
							})
							.then(function(){
								$timeout.cancel(r);
								r = undefined;
								promise_send[cicle_internal] = undefined;
								let tot = Object.keys(countCommands[cicle_internal][cmd_preset_internal.village_id]).reduce(function(a, b){
									return countCommands[cicle_internal][cmd_preset_internal.village_id][a] ? countCommands[cicle_internal][cmd_preset_internal.village_id][a].length : 0 + countCommands[cicle_internal][cmd_preset_internal.village_id][b] ? countCommands[cicle_internal][cmd_preset_internal.village_id][b].length : 0
								})
								, parc = countCommands[cicle_internal][cmd_preset_internal.village_id][cmd_preset_internal.preset_id].length
								if(promise_send_queue.length && parc <= cmd_rest && tot <= max_cmds){
									let reg = promise_send_queue.shift()
									f(reg[0], reg[1], reg[2])
								} else {
									$timeout(function () {
										resv();
									}, 3000)
								}
							}, function(){
								rejc();
							})
						} else {
							promise_send_queue.push([barbara, cicle_internal, cmd_preset_internal])
						}
					}
					f(barbara, cicle_internal, cmd_preset)
				});
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

			let quads = data_villages.getQuadrants(village_id, preset_id)
			if(quads){
				return quads.includes(quadrant);
			} else {
				return true
			}
		}

		, execute_presets = function(commands_for_presets, cicle){
			return new Promise(function(resol, rejec){
				var promise_preset = undefined
				, promise_preset_queue = [];

				commands_for_presets.forEach(function(cmd_preset){
					var t = function(cmd_preset){
						if(!promise_preset){
							promise_preset = new Promise(function(resolve_presets, reject_presets){
								sendCmd(cmd_preset, cicle).then(resolve_presets, reject_presets);
							})
							.then(function(c_preset){
								promise_preset = undefined
								if(promise_preset_queue.length){
									cmd_preset = promise_preset_queue.shift();
									t(cmd_preset)
								} else {
									data_log.farm.push(
											{
												"text": $filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"),
												"origin": null,
												"target": null,
												"date": time.convertedTime()
											}
									)
									data_log.set()
									resol()
								}
							}
							, function(){
								rejec()
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
		, checkGroup = function(village_id){
			let groups = modelDataService.getGroupList().getVillageGroups(village_id)
			return !!groups.find(f=>f.name=="no farm")
		}
		, execute_cicle = function(tempo, cicle){
			return new Promise(function(resol, rejec){
				angular.extend(data_villages, data_villages.get());
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})
				$timeout(function(){
					commands_for_presets[cicle] = []
					let villages = modelDataService.getSelectedCharacter().getVillageList();

					for(let i = 0; i < villages.length; i++){
						let village_id = villages[i].getId()
						, presets
						, aldeia_units
						, vill_attacked = modelDataService.getGroupList().getVillageGroups(village_id).some(f=>f.id==-5) && !data_farm.attacked

						if(!isRunning){
							break;
						}
						if(!village_id || !data_villages.villages[village_id] || !data_villages.villages[village_id].farm_activate || vill_attacked || checkGroup(village_id)) {
							continue
						} else {
							presets = data_villages.villages[village_id].presets
							aldeia_units = angular.copy(villages[i].getUnitInfo().getUnits())
						}

						let presets_order = []
						if(!data_farm.speed_direction){
							presets_order = Object.keys(presets).map(function(preset){
								return Object.keys(presets[preset].units).map(function(key){
									return modelDataService.getGameData().data.units.map(function(obj, index, array){
										return presets[preset].units[key] > 0 && key == obj.name ? [obj.speed, presets[preset]] : undefined			
									}).filter(f=>f!=undefined)
								}).filter(f=>f.length>0)[0][0]
							}).sort(function(a,b){return a[0]-b[0]}).map(function(obj){return obj[1]})
						} else {
							presets_order = Object.keys(presets).map(function(preset){
								return Object.keys(presets[preset].units).map(function(key){
									return modelDataService.getGameData().data.units.map(function(obj, index, array){
										return presets[preset].units[key] > 0 && key == obj.name ? [obj.speed, presets[preset]] : undefined			
									}).filter(f=>f!=undefined)
								}).filter(f=>f.length>0)[0][0]
							}).sort(function(a,b){return b[0]-a[0]}).map(function(obj){return obj[1]})
						}

						presets_order.forEach(function(preset){
							if(!units_has_exception(preset.units) && units_analyze(preset.units, aldeia_units, true)) {
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

					if(!isRunning || commands_for_presets[cicle].length){
						execute_presets(commands_for_presets[cicle], cicle).then(resol, rejec)
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
//			clear()

			function execute_init(opt){
				this.opt = opt;
				isRunning = !0
				var init_first = true;
				var f = function(){
					if(!isRunning) {return}
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
							data_log.farm.push(
									{
										"text": $filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"),
										"origin": null,
										"target": null,
										"date": time.convertedTime()
									}
							)
							data_log.set()
							clear_partial(countCicle)
						}
						, function(){
							data_log.farm.push(
									{
										"text": $filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"),
										"origin": null,
										"target": null,
										"date": time.convertedTime()
									}
							)
							clear_partial(countCicle)
						})
					} else {
						clear_partial(countCicle)
						data_log.farm.push(
								{
									"text": $filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm"),
									"origin": null,
									"target": null,
									"date": time.convertedTime()
								}
						)
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

				listener_pause = $rootScope.$on(providers.eventTypeProvider.PAUSE, setPaused)

				data_log.farm = [];
				data_villages.getAssignedPresets();

				if(!data_farm.infinite && data_farm.farm_time != 0){
					if ((data_farm.farm_time_stop - time.convertedTime()) - data_farm.farm_time > 0) {
						var tempo_delay = data_farm.farm_time_start - time.convertedTime();
						if(tempo_delay < 0) {
							tempo_delay = 0
						} else {
							$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("wait_init", $rootScope.loc.ale, "farm")})
							data_log.farm.push(
									{
										"text": $filter("i18n")("wait_init", $rootScope.loc.ale, "farm"),
										"origin": null,
										"target": null,
										"date": time.convertedTime()
									}
							)
							data_log.set()
						};
						data_farm.complete = time.convertedTime() + tempo_delay
						data_farm.set()
						!interval_init ? interval_init = $timeout(function () {
							data_log.farm.push(
									{
										"text": $filter("i18n")("init_cicles", $rootScope.loc.ale, "farm"),
										"origin": null,
										"target": null,
										"date": time.convertedTime()
									}
							)
							$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("farm_init", $rootScope.loc.ale, "farm")})
							execute_init()
						}, tempo_delay): null;
						return;
					} else {
						isRunning = !1;
						$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: $filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm")})
						data_log.farm.push(
								{
									"text": $filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm"),
									"origin": null,
									"target": null,
									"date": time.convertedTime()
								}
						)
						data_log.set()
						return;
					}
				} else {
					data_farm.infinite = true;
					data_farm.set();
					data_log.farm.push(
							{
								"text": $filter("i18n")("init_cicles", $rootScope.loc.ale, "farm"),
								"origin": null,
								"target": null,
								"date": time.convertedTime()
							}
					)
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
//			delete countCommands[cicle]
			delete commands_for_presets[cicle]
		}
		, is_Running	= function () {
			return isRunning
		}
		, is_Paused = function () {
			return isPaused
		}
		, setPaused = function (time_opt) {
			if(!paused_promise){
				paused_promise = new Promise(function(resolve, reject){
					if(!time_opt || time_opt < 30000) {
						time_opt = 65000;
					}
					isPaused = !0
					$timeout(function(){
						resolve()	
					}, time_opt)
				}). then(function(){
					data_log.farm.push(
							{
								"text": "Paused",
								"origin": null,
								"target": null,
								"date": time.convertedTime()
							}
					)
					data_log.set()
					paused_promise = undefined;
					if(paused_queue){
						paused_queue = false;
						setPaused()
					} else {
						setResumed()
					}
				}, function(){
					paused_promise = undefined;
					setResumed()
				})
			} else {
				paused_queue = true;
			}
		}
		, setResumed = function () {
			data_log.farm.push(
					{
						"text": "Resumed",
						"origin": null,
						"target": null,
						"date": time.convertedTime()
					}
			)
			data_log.set()
			isPaused = !1
			$rootScope.$broadcast(providers.eventTypeProvider.RESUME)
		}
		, is_Initialized	= function () {
			return isInitialized
		}
		, stop = function () {
			promise_send_queue = []
			data_farm.complete = 0
			data_farm.set()

			if(completion_loaded){
				completion_loaded = !1;
				robotTW2.removeScript("/controllers/FarmCompletionController.js");
			}

			if(promise_send){
				Object.keys(promise_send).map(function(cicle_p){
					if(promise_send[cicle_p]){
						promise_send[cicle_p] = undefined
					}
				})
			}

			typeof(listener_report) == "function" ? listener_report(): null;
			listener_report = undefined
			typeof(listener_pause) == "function" ? listener_pause(): null;
			listener_pause = undefined

			clear();
			isRunning = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"FARM"})
		}

		return	{
			init			: init,
			start			: start,
			stop 			: stop,
			isRunning		: is_Running,
			isPaused		: is_Paused,
			isInitialized	: is_Initialized,
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
