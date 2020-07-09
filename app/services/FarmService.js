define("robotTW2/services/FarmService", [
	"robotTW2",
	"robotTW2/time",
	"robotTW2/conf",
	"conf/conf",
	"helper/math",
	"robotTW2/calculateTravelTime",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_presets",
	"robotTW2/databases/data_log_farm",
	"robotTW2/databases/data_farm",
	"robotTW2/services/villages_town",
	"robotTW2/services/grid_town",
	"conf/reportTypes",
	"struct/MapData",
	"helper/format"
], function (
	robotTW2,
	time,
	conf,
	conf_conf,
	math,
	calculateTravelTime,
	data_villages,
	data_presets,
	data_log_farm,
	data_farm,
	villages_town,
	grid_town,
	REPORT_TYPE_CONF,
	mapData,
	formatHelper
) {
		return (function FarmService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			presetListService,
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
				, listener_report = undefined
				, listener_pause = undefined
				, listener_resume = undefined
				, listener_layout = undefined
				, get_dist = function get_dist(villageId, journey_time, units) {
					var village = modelDataService.getSelectedCharacter().getVillage(villageId)
						, army = {
							'officers': {},
							"units": units
						}
						, travelTime = calculateTravelTime(army, village, "attack", {
							'barbarian': true
						})

					return Math.trunc((journey_time / 1000 / travelTime)) || 0;
				}
				, get_time = function get_time(villageId, bb, units) {
					var village = modelDataService.getVillage(villageId)
						, distance = math.actualDistance(village.getPosition(), {
							'x': bb.x,
							'y': bb.y
						})
						, army = {
							'officers': {},
							"units": units
						}
						, travelTime = calculateTravelTime(army, village, "attack", {
							'barbarian': true
						})

					return armyService.getTravelTimeForDistance(army, travelTime, distance, "attack") * 1000
				}
				, units_has_exception = function (units) {
					return Object.keys(units).map(function (unit) {
						return conf.TROOPS_NOT.FARM.some(elem => elem == unit && units[elem] > 0)
					}).some(elem => elem == true)
				}
				, units_has_unit_search = function (unit_search, units) {
					return Object.keys(units).some(unit => unit == unit_search && units[unit].available != undefined && units[unit].available >= 2)
				}
				, units_analyze = function (preset_units, aldeia_units, opt) {

					if (units_has_exception(preset_units)) {
						return !1;
					} else {
						var f = Object.keys(preset_units).map(function (unit_preset) {
							if (preset_units[unit_preset] >= 2 && units_has_unit_search(unit_preset, aldeia_units) && aldeia_units[unit_preset].available >= preset_units[unit_preset]) {
								return [{ [unit_preset]: preset_units[unit_preset] }, Math.trunc(aldeia_units[unit_preset].available / preset_units[unit_preset])]
							}
						}).filter(f => f != undefined).sort(function (a, b) { return a[1] - b[1] }).shift()
						return f && opt ? !0 : f;
					}
				}
				, check_commands = function (cmd) {
					let lt = true
					var id;
					if (cmd.data) {
						if (cmd.data.type != "attack" && cmd.data.direction != "forward") { //filtra os comandos diferentes de ataques e comandos retornand
							return false
						}
						id = cmd.targetVillageId
					} else {
						id = cmd
					}
					lt = Object.keys(countCommands).map(function (cicle) {
						return Object.keys(countCommands[cicle]).map(function (village_id) {
							return Object.keys(countCommands[cicle][village_id]).map(function (preset_id) {
								return countCommands[cicle][village_id][preset_id].some(f => f == id)
							}).some(f => f == true)
						}).some(f => f == true)
					}).some(f => f == true)

					return !lt
				}
				, sendCmd = function (cmd_preset, cicle_internal) {
					return new Promise(function (resv, rejc) {
						var result_units = []
							, preset_id = cmd_preset.preset_id
							, village = modelDataService.getSelectedCharacter().getVillage(cmd_preset.village_id)
							, aldeia_units = angular.copy(village.unitInfo.units)
							, preset_units = cmd_preset.preset_units
							, aldeia_commands = village.getCommandListModel().getCommands()
							, t_obj = units_analyze(preset_units, aldeia_units)
							, max_cmds = data_presets.villages[cmd_preset.village_id].presets[preset_id].max_commands_farm
							, cmd_rest = max_cmds - aldeia_commands.length
							, cmd_ind = Math.min(cmd_rest, t_obj[1])
							, r = undefined
							, villages = []
							, dist = get_dist(cmd_preset.village_id, cmd_preset.max_journey_time, preset_units) / 2
						var data;
						try {
							data = mapData.loadTownData(Math.trunc(cmd_preset.x - (dist / 2)), Math.trunc(cmd_preset.y - (dist / 2)), Math.trunc(dist * 1.42), Math.trunc(dist * 1.42))
								, dt = data.map(function (elem) {
									return elem.data
								}).filter(f => f != null)
						} catch (err) {
							data_log_farm.logs.push(
								{
									"text": "Error load data mapData - " + Object.keys(modelDataService.getPresetList().presets).map(function (elem) { return modelDataService.getPresetList().presets[elem] }).find(f => f.id == preset_id).name,
									"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(village).data),
									"origin_id": cmd_preset.village_id,
									"target": null,
									"target_id": null,
									"date": time.convertedTime()
								}
							)
							resv()
						}

						if (!countCommands[cicle_internal][cmd_preset.village_id][preset_id]) { countCommands[cicle_internal][cmd_preset.village_id][preset_id] = [] }

						//				aldeia_commands.length ? aldeia_commands.forEach(function (cmd) {
						//				if(check_commands(cmd)){
						//				countCommands[cicle_internal][cmd_preset.village_id]["village"].push(cmd.targetVillageId)
						//				}
						//				}) : aldeia_commands = [];

						if (cmd_ind <= 0) {
							resv();
						}

						dt.map(function (a) {
							return Object.keys(a).map(function (x) {
								return Object.keys(a[x]).map(function (y) {
									return !villages.find(f => f.id == a[x][y].id) ? villages.push(a[x][y]) : undefined
								})
							})
						})

						villages = villages.filter(f => !data_farm.list_exceptions.find(g => g == f.id)) // filtra as excessões
						villages = villages.filter(f => f.affiliation == "barbarian") //filtra as barbaras

						villages = Object.keys(villages).map(function (barbara) { //verifica a presença da aldeia nos comandos existentes do ciclo
							if (check_commands(villages[barbara].id)) {
								return villages[barbara]
							}
						}).filter(f => f != undefined)

						villages = Object.keys(villages).map(function (barbara) { //verifica a presença da aldeia nos comandos existentes do ciclo
							if (check_village(villages[barbara], cmd_preset)) {
								return villages[barbara]
							}
						}).filter(f => f != undefined)

						villages = villages.filter(f => get_time(cmd_preset.village_id, f, preset_units) > data_presets.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_journey_time / 2)
						villages = villages.filter(f => get_time(cmd_preset.village_id, f, preset_units) < data_presets.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_journey_time / 2)
						villages = villages.filter(f => f.points > data_presets.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].min_points_farm)
						villages = villages.filter(f => f.points < data_presets.villages[cmd_preset.village_id].presets[cmd_preset.preset_id].max_points_farm)

						if (!data_farm.unit_direction) {
							villages.sort(function (a, b) {
								return get_time(cmd_preset.village_id, a, preset_units) - get_time(cmd_preset.village_id, b, preset_units) //sorteia em ordem crescente conforme distância da origem
							});
						} else {
							villages.sort(function (a, b) {
								return get_time(cmd_preset.village_id, b, preset_units) - get_time(cmd_preset.village_id, a, preset_units) //sorteia em ordem crescente conforme distância da origem
							});
						}

						villages = villages.splice(0, cmd_ind) // separa somentes as aldeias possiveis de comandos

						if (!villages.length) {
							resv();
						}

						villages.forEach(function (barbara) {
							if (check_commands(barbara.id)) {
								countCommands[cicle_internal][cmd_preset.village_id][cmd_preset.preset_id].push(barbara.id)
							}
						})
						villages.forEach(function (barbara) {
							var f = function (bb, cic, cmd_preset_internal) {
								if (!promise_send[cic] && !isPaused) {
									typeof (listener_resume) == "function" ? listener_resume() : null;
									listener_resume = undefined
									promise_send[cic] = new Promise(function (resolve_send, reject_send) {
										$timeout(function execute() {
											typeof (listener_resume) == "function" ? listener_resume() : null;
											listener_resume = undefined
											r = $timeout(function () {
												resolve_send()
											}, conf_conf.LOADING_TIMEOUT);
											if (!isRunning) {
												reject_send()
												return
											}
											var params = {
												start_village: cmd_preset_internal.village_id,
												target_village: bb.id,
												army_preset_id: cmd_preset_internal.preset_id,
												type: "attack"
											}

											data_log_farm.logs.push(
												{
													"text": Object.keys(modelDataService.getPresetList().presets).map(function (elem) { return modelDataService.getPresetList().presets[elem] }).find(f => f.id == cmd_preset_internal.preset_id).name,
													"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
													"origin_id": params.start_village,
													"target": formatHelper.villageNameWithCoordinates(bb),
													"target_id": bb,
													"date": time.convertedTime()
												}
											)
											socketService.emit(providers.routeProvider.SEND_PRESET, params);
											resolve_send()
										}, Math.round((conf.TIME_DELAY_FARM / 2) + (conf.TIME_DELAY_FARM * Math.random())))
									})
										.then(function executed_okay() {
											$timeout.cancel(r);
											r = undefined;
											promise_send[cic] = undefined;
											delete promise_send[cic];
											if (!countCommands[cic]) {
												function nt() {
													if (promise_send_queue.length) {
														let reg = promise_send_queue.shift()
														if (!countCommands[reg[1]]) {
															nt()
														} else {
															f(reg[0], reg[1], reg[2])
														}

													} else {
														resv();
													}
													return
												}
												nt()
											} else {
												let tot = Object.keys(countCommands[cic][cmd_preset_internal.village_id]).reduce(function (a, b) {
													return countCommands[cic][cmd_preset_internal.village_id][a] ? countCommands[cic][cmd_preset_internal.village_id][a].length : 0 + countCommands[cic][cmd_preset_internal.village_id][b] ? countCommands[cic][cmd_preset_internal.village_id][b].length : 0
												})
													, parc = countCommands[cic][cmd_preset_internal.village_id][cmd_preset_internal.preset_id].length
												if (promise_send_queue.length && parc <= cmd_rest && tot <= max_cmds) {
													let reg = promise_send_queue.shift()
													f(reg[0], reg[1], reg[2])
												} else {
													resv();
												}
											}
										}, function executed_error() {
											data_log_farm.set()
											rejc();
										})
								} else if (isPaused) {
									!listener_resume ? listener_resume = $rootScope.$on(providers.eventTypeProvider.RESUME, function () {
										f(bb, cic, cmd_preset_internal)
									}) : listener_resume;
									if (!promise_send_queue.find(f => f[0] == barbara.id)) {
										promise_send_queue.push([barbara, cic, cmd_preset_internal])
									}
								} else {
									if (!promise_send_queue.find(f => f[0] == barbara.id)) {
										promise_send_queue.push([barbara, cic, cmd_preset_internal])
									}
								}
							}
							f(barbara, cicle_internal, cmd_preset)
						});
					});
				}
				, check_village = function (vill, cmd_preset) {
					if (!vill)
						return false;
					var village_id = cmd_preset.village_id
						, preset_id = cmd_preset.preset_id
						, village = modelDataService.getVillage(village_id)
						, x1 = vill.x
						, y1 = vill.y
						, x2 = village.data.x
						, y2 = village.data.y

					var quadrant = 0;
					if (x1 <= x2 && y1 <= y2) {
						quadrant = 1
					} else if (x1 <= x2 && y1 > y2) {
						quadrant = 4
					} else if (x1 > x2 && y1 <= y2) {
						quadrant = 2
					} else if (x1 > x2 && y1 > y2) {
						quadrant = 3
					}

					let quads = data_presets.getQuadrants(village_id, preset_id)
					if (quads) {
						return quads.includes(quadrant);
					} else {
						return true
					}
				}
				, execute_presets = function (commands_for_presets, cicle) {
					return new Promise(function (resol, rejec) {
						var promise_preset = undefined
							, promise_preset_queue = [];
						commands_for_presets.forEach(function (cmd_preset) {
							var t = function (cmd_preset) {
								if (!promise_preset) {
									promise_preset = new Promise(function (resolve_presets, reject_presets) {
										sendCmd(cmd_preset, cicle).then(resolve_presets, reject_presets);
									})
										.then(function (c_preset) {
											promise_preset = undefined
											if (promise_preset_queue.length) {
												cmd_preset = promise_preset_queue.shift();
												//Intervalo de tempo entre mudança de predefinições
												$timeout(function () {
													t(cmd_preset)
												}, Math.round((3000 / 2) + (3000 * Math.random())))
											} else {
												//Termina os presets do ciclo
												resol(cicle)
											}
										}
											, function () {
												//Termina os presets do ciclo com erro								
												rejec(cicle)
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
				, checkGroup = function (village_id) {
					let groups = modelDataService.getGroupList().getVillageGroups(village_id)
					return !!groups.find(f => f.name == "no farm")
				}
				, checkCommand = function (village_id) {
					let cmds_attack = []
					//			, cmds_defense = []
					if (!data_farm.attack_prog && robotTW2.services.AttackService.isRunning()) {
						cmds_attack = robotTW2.services.AttackService.get_command(village_id) //Se estiver programado ataque na aldeia
					}
					//			if(!data_farm.defense_prog && robotTW2.services.DefenseService.isRunning()){
					//				cmds_defense = robotTW2.services.DefenseService.get_command(village_id) //Se estiver programado defesa na aldeia
					//			}
					//			let cmds = cmds_attack.concat(cmds_defense)
					//			return !!cmds.length
					return !!cmds_attack.length
				}
				, execute_cicle = function (tempo, cicle) {
					return new Promise(function (resol, rejec) {
						data_log_farm.set()
						angular.extend(data_presets, data_presets.get());
						$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "FARM" })
						$timeout(function () {
							commands_for_presets[cicle] = []
							let villages = modelDataService.getSelectedCharacter().getVillageList();
							if (!countCommands[cicle]) { countCommands[cicle] = {} }
							for (let i = 0; i < villages.length; i++) {
								let village = villages[i]
									, village_id = village.getId()
									, presets
									, aldeia_units
									, vill_attacked = modelDataService.getGroupList().getVillageGroups(village_id).some(f => f.id == -5 || f.id == -8) && !data_farm.attacked
									, aldeia_commands = village.getCommandListModel().getCommands()
								if (!countCommands[cicle][village_id]) { countCommands[cicle][village_id] = {} }
								if (!countCommands[cicle][village_id]["village"]) { countCommands[cicle][village_id]["village"] = [] }
								/*
								 * Verifica e adiciona os comandos já existentes das aldeias
								 */
								aldeia_commands.length ? aldeia_commands.forEach(function (cmd) {
									if (check_commands(cmd)) {
										countCommands[cicle][village_id]["village"].push(cmd.targetVillageId)
									}
								}) : aldeia_commands = [];
								if (!isRunning) {
									break;
								}
								if (!villages[i] || !village_id || !data_villages.villages[village_id] || !data_villages.villages[village_id].farm_activate || vill_attacked || checkGroup(village_id) || checkCommand(village_id)) {
									continue
								} else {
									//							presets = data_presets.villages[village_id].presets
									presets = presetListService.getPresetsForVillageId(village_id)
									aldeia_units = angular.copy(villages[i].getUnitInfo().getUnits())
								}
								let presets_order = []
								if (!data_farm.speed_direction) {
									presets_order = Object.keys(presets).map(function (preset) {
										return Object.keys(presets[preset].units).map(function (key) {
											return modelDataService.getGameData().data.units.map(function (obj, index, array) {
												return presets[preset].units[key] > 0 && key == obj.name ? [obj.speed, presets[preset]] : undefined
											}).filter(f => f != undefined)
										}).filter(f => f.length > 0)[0][0]
									}).sort(function (a, b) { return a[0] - b[0] }).map(function (obj) { return obj[1] })
								} else {
									presets_order = Object.keys(presets).map(function (preset) {
										return Object.keys(presets[preset].units).map(function (key) {
											return modelDataService.getGameData().data.units.map(function (obj, index, array) {
												return presets[preset].units[key] > 0 && key == obj.name ? [obj.speed, presets[preset]] : undefined
											}).filter(f => f != undefined)
										}).filter(f => f.length > 0)[0][0]
									}).sort(function (a, b) { return b[0] - a[0] }).map(function (obj) { return obj[1] })
								}
								presets_order.forEach(function (preset) {
									if (units_analyze(preset.units, aldeia_units, true)) {
										var comando = {
											village_id: village_id,
											preset_id: preset.id,
											preset_units: preset.units,
											x: villages[i].data.x,
											y: villages[i].data.y,
											max_journey_time: data_presets.villages[village_id].presets[preset.id].max_journey_time,
											min_journey_time: data_presets.villages[village_id].presets[preset.id].min_journey_time
										};
										if (!commands_for_presets[cicle].find(f => f === comando)) {
											commands_for_presets[cicle].push(comando);
										}
									}
								})
							}
							if (!isRunning || commands_for_presets[cicle].length) {
								data_log_farm.logs.push(
									{
										"text": $filter("i18n")("init_cicles", $rootScope.loc.ale, "farm") + " " + cicle,
										"origin": null,
										"origin_id": null,
										"target": null,
										"target_id": null,
										"date": time.convertedTime()
									}
								)
								data_log_farm.set()
								execute_presets(commands_for_presets[cicle], cicle).then(resol, rejec)
							} else {
								data_log_farm.logs.push(
									{
										"text": $filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm") + " " + cicle,
										"origin": null,
										"origin_id": null,
										"target": null,
										"target_id": null,
										"date": time.convertedTime()
									}
								)
								data_log_farm.set()
								clear_partial(cicle)
								resol(cicle)
							}
						}, tempo)
					})
				}
				, analyze_report = function analyze_report(event, data) {
					if (data.type == "attack" && data.read == 0 && (data.result === REPORT_TYPE_CONF.RESULT_TYPES.CASUALTIES || data.result === REPORT_TYPE_CONF.RESULT_TYPES.DEFEAT)) {
						if (!data_farm.list_exceptions.find(f => f == data.target_village_id)) {
							data_farm.list_exceptions.push(data.target_village_id)
							data_farm.set();
						}
					}
				}
				, init = function () {
					isInitialized = !0
					loadScript("/controllers/FarmCompletionController.js");
					start();
				}
				, start = function () {

					if (isRunning) { return }
					//			clear()

					function execute_init(opt) {
						this.opt = opt;
						isRunning = !0
						var init_first = true;
						var f = function () {
							if (!isRunning) { return }
							countCicle++
							if ((time.convertedTime() + data_farm.farm_time < data_farm.farm_time_stop) || this.opt) {
								if (opt && data_farm.farm_time < 900000) {
									data_farm.farm_time = 900000
									data_farm.set()
								}
								let tempo = Math.round((data_farm.farm_time / 2) + (data_farm.farm_time * Math.random()))
								!data_farm.complete ? data_farm.complete = 0 : null;
								data_farm.complete = time.convertedTime() + tempo
								data_farm.set()
								if (interval_cicle) {
									clearTimeout(interval_cicle)
								}
								interval_cicle = setTimeout(f, tempo)
								let gt = tempo
								if (init_first)
									gt = 0;
								execute_cicle(gt, countCicle).then(function (cic) {
									init_first = false;
									data_log_farm.logs.push(
										{
											"text": $filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm") + " " + cic,
											"origin": null,
											"origin_id": null,
											"target": null,
											"target_id": null,
											"date": time.convertedTime()
										}
									)
									data_log_farm.set()
									clear_partial(cic)
								}
									, function (cic) {
										data_log_farm.logs.push(
											{
												"text": $filter("i18n")("terminate_cicles", $rootScope.loc.ale, "farm") + " " + cic,
												"origin": null,
												"origin_id": null,
												"target": null,
												"target_id": null,
												"date": time.convertedTime()
											}
										)
										clear_partial(cic)
									})
							} else {
								data_log_farm.logs.push(
									{
										"text": $filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm"),
										"origin": null,
										"origin_id": null,
										"target": null,
										"target_id": null,
										"date": time.convertedTime()
									}
								)
								data_log_farm.set()
							}
						}
						f()
					}

					ready(function () {
						listener_report = $rootScope.$on(providers.eventTypeProvider.REPORT_NEW, analyze_report)
						listener_pause = $rootScope.$on(providers.eventTypeProvider.PAUSE, setPaused)
						data_presets.getAssignedPresets();

						$timeout(function () {
							if (!data_farm.infinite && data_farm.farm_time != 0) {
								if ((data_farm.farm_time_stop - time.convertedTime()) - data_farm.farm_time > 0) {
									var tempo_delay = data_farm.farm_time_start - time.convertedTime();
									if (tempo_delay < 0) {
										tempo_delay = 0
									} else {
										$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, { message: $filter("i18n")("wait_init", $rootScope.loc.ale, "farm") })
										data_log_farm.logs.push(
											{
												"text": $filter("i18n")("wait_init", $rootScope.loc.ale, "farm"),
												"origin": null,
												"origin_id": null,
												"target": null,
												"target_id": null,
												"date": time.convertedTime()
											}
										)
										data_log_farm.set()
									};
									data_farm.complete = time.convertedTime() + tempo_delay
									data_farm.set()
									!interval_init ? interval_init = $timeout(function () {
										$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, { message: $filter("i18n")("farm_init", $rootScope.loc.ale, "farm") })
										execute_init()
									}, tempo_delay) : null;
									return;
								} else {
									isRunning = !1;
									$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, { message: $filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm") })
									data_log_farm.logs.push(
										{
											"text": $filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm"),
											"origin": null,
											"origin_id": null,
											"target": null,
											"target_id": null,
											"date": time.convertedTime()
										}
									)
									data_log_farm.set()
									return;
								}
							} else {
								data_farm.infinite = true;
								data_farm.set();
								data_log_farm.logs.push(
									{
										"text": $filter("i18n")("init_cicles", $rootScope.loc.ale, "farm"),
										"origin": null,
										"origin_id": null,
										"target": null,
										"target_id": null,
										"date": time.convertedTime()
									}
								)
								execute_init(true)
							}
						}, 5000)
					}, ["all_villages_ready"])
				}
				, clear = function () {
					interval_init = null
					villages_town.renew();
					grid_town.renew();
					countCommands = {}
					countCicle = 0;
				}
				, clear_partial = function (cicle) {
					if (!cicle) { return }
					for (a = 1; a <= cicle; a++) {
						delete countCommands[a]
						delete commands_for_presets[a]
					}
				}
				, is_Running = function () {
					return isRunning
				}
				, is_Paused = function () {
					return isPaused
				}
				, setPaused = function ($event, time_opt) {
					if (!paused_promise) {
						paused_promise = new Promise(function (resolve, reject) {
							if (!time_opt || time_opt < 30000) {
								time_opt = 65000;
							}
							isPaused = !0
							data_log_farm.logs.push(
								{
									"text": "Paused",
									"origin": null,
									"origin_id": null,
									"target": null,
									"target_id": null,
									"date": time.convertedTime()
								}
							)
							data_log_farm.set()
							$timeout(function () {
								resolve()
							}, time_opt)
						}).then(function () {
							paused_promise = undefined;
							if (paused_queue) {
								paused_queue = false;
								setPaused()
							} else {
								setResumed()
							}
						}, function () {
							paused_promise = undefined;
							setResumed()
						})
					} else {
						paused_queue = true;
					}
				}
				, setResumed = function () {
					data_log_farm.logs.push(
						{
							"text": "Resumed",
							"origin": null,
							"origin_id": null,
							"target": null,
							"target_id": null,
							"date": time.convertedTime()
						}
					)
					data_log_farm.set()
					isPaused = !1
					$rootScope.$broadcast(providers.eventTypeProvider.RESUME)
				}
				, is_Initialized = function () {
					return isInitialized
				}
				, stop = function () {
					promise_send_queue = []
					data_farm.complete = 0
					data_farm.set()

					robotTW2.removeScript("/controllers/FarmCompletionController.js");

					if (promise_send) {
						Object.keys(promise_send).map(function (cicle_p) {
							if (promise_send[cicle_p]) {
								promise_send[cicle_p] = undefined
								delete promise_send[cicle_p];
							}
						})
					}

					typeof (listener_report) == "function" ? listener_report() : null;
					typeof (listener_pause) == "function" ? listener_pause() : null;
					typeof (listener_layout) == "function" ? listener_layout() : null;
					listener_report = undefined
					listener_pause = undefined
					listener_layout = undefined;
					clear();
					isRunning = !1
					$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "FARM" })
				}
				, setListener = function (listener) {
					!listener_layout ? listener_layout = listener : null
				}

			return {
				init: init,
				start: start,
				stop: stop,
				isRunning: is_Running,
				isPaused: is_Paused,
				setListener: setListener,
				isInitialized: is_Initialized,
				version: conf.VERSION.FARM,
				name: "farm"
			}
		})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.presetListService,
			robotTW2.services.armyService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.requestFn,
			robotTW2.loadScript,
			robotTW2.ready
		)
	})
