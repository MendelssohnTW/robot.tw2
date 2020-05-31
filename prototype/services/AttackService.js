define("robotTW2/CommandAttack", [
], function () {
	return {}
})

define("robotTW2/services/AttackService", [
	"robotTW2",
	"helper/time",
	"robotTW2/conf",
	"robotTW2/notify",
	"robotTW2/time",
	"robotTW2/databases/data_attack",
	"robotTW2/databases/data_log_attack",
	"robotTW2/CommandAttack",
	"helper/format"
], function (
	robotTW2,
	helper,
	conf,
	notify,
	time,
	data_attack,
	data_log_attack,
	commandAttack,
	formatHelper
) {
		return (function AttackService(
			$rootScope,
			$filter,
			providers,
			modelDataService,
			$timeout,
			commandQueue,
			socketService,
			ready,
			loadScript
		) {

			var isRunning = !1
				, isPaused = !1
				, isInitialized = !1
				, listener = undefined
				, listener_layout = undefined
				, that = this
				, timetable = modelDataService.getGameData().data.units.map(function (obj, index, array) {
					return [obj.speed * 60, obj.name]
				}).map(m => {
					return [m[0], m[1]];
				}).sort((a, b) => {
					return a[0] - b[0];
				})
				, addAttack = function (params, opt_id) {
					if (!params) { return }
					!(typeof (listener) == "function") ? listener = $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, listener_command_sent) : null;
					var expires = params.data_escolhida - params.duration
						, timer_delay = expires - time.convertedTime() - robotTW2.databases.data_main.time_correction_command
						, id_command = Math.round(time.convertedTime() + params.data_escolhida).toString();

					if (opt_id) {
						id_command = params.id_command
					}

					if (timer_delay >= 0) {
						angular.extend(params, {
							"timer_delay": timer_delay,
							"id_command": id_command
						})
						if (typeof (commandQueue.bind) == "function") {
							commandQueue.bind(id_command, sendAttack, data_attack, params, function (fns) {
								commandAttack[fns.params.id_command] = {
									"timeout": fns.fn.apply(this, [fns.params]),
									"params": params
								}
							})
						} else {
							data_log_attack.attack.push(
								{
									"text": "attack not sent - catch",
									"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
									"target": formatHelper.villageNameWithCoordinates(
										{
											"name": params.target_name,
											"x": params.target_x,
											"y": params.target_y
										}
									),
									"date": time.convertedTime()
								}
							)
							removeCommandAttack(params.id_command)
						}
					} else {
						data_log_attack.logs.push(
							{
								"text": "attack not sent - expires",
								"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
								"target": formatHelper.villageNameWithCoordinates(
									{
										"name": params.target_name,
										"x": params.target_x,
										"y": params.target_y
									}
								),
								"date": time.convertedTime()
							}
						)
						removeCommandAttack(params.id_command)
					}
				}
				, listener_command_sent = function ($event, data) {
					if (!$event.currentScope) { return }
					if (data.direction == "forward" && data.type == "attack") {
						var params = Object.keys(commandAttack).map(function (cmd) {
							if (commandAttack[cmd].params.start_village == data.home.id
								&& commandAttack[cmd].params.target_village == data.target.id
							) {
								return commandAttack[cmd].params
							} else {
								return undefined
							}
						}).filter(f => f != undefined)

						let param = undefined;
						if (params.length) {
							params.sort(function (a, b) { return a.data_escolhida - b.data_escolhida })
							param = params.shift();
						}

						$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS)
					}
				}
				, send = function (params) {
					data_log_attack.logs.push(
						{
							"text": $filter("i18n")("attack", $rootScope.loc.ale, "attack"),
							"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
							"target": formatHelper.villageNameWithCoordinates(
								{
									"name": params.target_name,
									"x": params.target_x,
									"y": params.target_y
								}
							),
							"date": time.convertedTime()
						}
					)

					socketService.emit(
						providers.routeProvider.SEND_CUSTOM_ARMY, {
							start_village: params.start_village,
							target_village: params.target_village,
							type: params.type,
							units: params.units,
							icon: 0,
							officers: params.officers,
							catapult_target: params.catapult_target
						}
					)
					removeCommandAttack(params.id_command)
				}
				, sendAttack = function (params) {
					return $timeout(function () {
						if (typeof (commandQueue.bind) == "function") {
							commandQueue.bind(params.id_command, resendAttack, data_attack, params, function (fns) {
								commandAttack[fns.params.id_command] = {
									"timeout": fns.fn.apply(this, [fns.params]),
									"params": params
								}
							})
						} else {
							data_log_attack.logs.push(
								{
									"text": "attack not sent - catch",
									"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
									"target": formatHelper.villageNameWithCoordinates(
										{
											"name": params.target_name,
											"x": params.target_x,
											"y": params.target_y
										}
									),
									"date": time.convertedTime()
								}
							)
							removeCommandAttack(params.id_command)
						}

					}, params.timer_delay - conf.TIME_DELAY_UPDATE - modelDataService.getSelectedCharacter().getTimeSync().csDiff)
					//			}, params.timer_delay - conf.TIME_DELAY_UPDATE)
				}
				, resendAttack = function (params) {
					let units = {};
					let list_units = modelDataService.getSelectedCharacter().getVillage(params.start_village).getUnitInfo().getUnits();;
					if (params.enviarFull) {
						Object.keys(list_units).map(
							function (f) {
								if (list_units[f].available > 0) {
									units[f] = list_units[f].available;
								}
							}
						)
						params.units = units;
					} else {
						//				params.units
						//				list_units
						Object.keys(params.units).map(function (un) {
							params.units[un] = params.units[un].bound(0, list_units[un].available)
						})

					}
					if (!Object.keys(units).length || !params.enviarFull) {
						let expires_send = params.data_escolhida - params.duration
							, timer_delay_send = expires_send - time.convertedTime() - robotTW2.databases.data_main.time_correction_command
						if (timer_delay_send < 0) {
							data_log_attack.logs.push(
								{
									"text": "attack not sent - expires",
									"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
									"target": formatHelper.villageNameWithCoordinates(
										{
											"name": params.target_name,
											"x": params.target_x,
											"y": params.target_y
										}
									),
									"date": time.convertedTime()
								}
							)
							removeCommandAttack(params.id_command)
							return
						}
						$rootScope.$broadcast(providers.eventTypeProvider.PAUSE, 35000)
						return $timeout(function () {
							data_log_attack.logs.push(
								{
									"text": $filter("i18n")("attack", $rootScope.loc.ale, "attack"),
									"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
									"target": formatHelper.villageNameWithCoordinates(
										{
											"name": params.target_name,
											"x": params.target_x,
											"y": params.target_y
										}
									),
									"date": time.convertedTime()
								}
							)

							socketService.emit(
								providers.routeProvider.SEND_CUSTOM_ARMY, {
									start_village: params.start_village,
									target_village: params.target_village,
									type: params.type,
									units: params.units,
									icon: 0,
									officers: params.officers,
									catapult_target: params.catapult_target
								}
							)
							removeCommandAttack(params.id_command)
						}, timer_delay_send - modelDataService.getSelectedCharacter().getTimeSync().csDiff)
						//				}, timer_delay_send)
					} else {
						data_log_attack.logs.push(
							{
								"text": "attack not sent - units not found",
								"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
								"target": formatHelper.villageNameWithCoordinates(
									{
										"name": params.target_name,
										"x": params.target_x,
										"y": params.target_y
									}
								),
								"date": time.convertedTime()
							}
						)
						removeCommandAttack(params.id_command)
					}
				}
				, sendCommandAttack = function (scp) {
					var params = {
						start_village: scp.selectedVillage.data.villageId,
						target_village: scp.target.id,
						target_name: scp.target.data.name,
						target_x: scp.target.data.x,
						target_y: scp.target.data.y,
						type: scp.activeTab,
						duration: scp.milisegundos_duracao,
						enviarFull: scp.enviarFull,
						data_escolhida: scp.tempo_escolhido,
						units: scp.unitsToSend,
						officers: scp.army.officers,
						catapult_target: scp.catapultTarget.value
					}
					addAttack(params);
				}
				, removeCommandAttack = function (id_command) {
					if (typeof (commandAttack[id_command].timeout) == "object") {
						if (commandAttack[id_command].timeout.$$state.status == 0) {
							$timeout.cancel(commandAttack[id_command].timeout)
						}
						delete commandAttack[id_command];
					}

					commandQueue.unbind(id_command, data_attack)
					$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_ATTACK)
				}
				, removeAll = function () {
					Object.keys(commandAttack).map(function (elem) {
						if (typeof (commandAttack[elem].timeout) == "object") {
							if (commandAttack[elem].timeout.$$state.status == 0) {
								$timeout.cancel(commandAttack[elem].timeout)
							}
							delete commandAttack[elem];
						}
					})
					commandQueue.unbindAll("attack", data_attack)
					$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_ATTACK)
				}
				, init = function () {
					isInitialized = !0
					start();
				}
				, start = function () {
					if (isRunning) { return }
					ready(function () {
						loadScript("/controllers/AttackCompletionController.js", true);
						isRunning = !0
						Object.values(data_attack.commands).forEach(function (param) {
							if ((param.data_escolhida - param.duration) < time.convertedTime()) {
								commandQueue.unbind(param.id_command, data_attack)
							} else {
								addAttack(param, true);
							}
						})
						$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "ATTACK" })
					}, ["all_villages_ready"])
				}
				, stop = function () {
					robotTW2.removeScript("/controllers/AttackCompletionController.js");

					commandQueue.unbindAll("attack", data_attack)
					isRunning = !1;
					typeof (listener) == "function" ? listener() : null
					typeof (listener_layout) == "function" ? listener_layout() : null;
					listener = undefined;
					listener_layout = undefined;
					$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "ATTACK" })
				}
				, setListener = function (listener) {
					!listener_layout ? listener_layout = listener : null
				}

			return {
				init: init,
				start: start,
				stop: stop,
				get_commands: function () {
					return Object.keys(commandAttack).map(function (key) {
						return commandAttack[key].params;
					});
				},
				get_command: function (id) {
					return Object.keys(commandAttack).map(function (key) {
						if (commandAttack[key].params.start_village == id) {
							return commandAttack[key].params.start_village;
						}
					}).filter(f => f != undefined);
				},
				sendCommandAttack: sendCommandAttack,
				removeCommandAttack: removeCommandAttack,
				removeAll: removeAll,
				setListener: setListener,
				isRunning: function () {
					return isRunning
				},
				isInitialized: function () {
					return isInitialized
				},
				version: conf.VERSION.ATTACK,
				name: "attack"
			}
		})(
			robotTW2.services.$rootScope,
			robotTW2.services.$filter,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.commandQueue,
			robotTW2.services.socketService,
			robotTW2.ready,
			robotTW2.loadScript
		)
	})