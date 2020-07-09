define("robotTW2/CommandFake", [
], function () {
	return {}
})

define("robotTW2/services/FakeService", [
	"robotTW2",
	"robotTW2/time",
	"helper/time",
	"robotTW2/conf",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_fake",
	"robotTW2/CommandFake"
], function (
	robotTW2,
	time,
	helper,
	conf,
	data_villages,
	data_fake,
	commandFake
) {
		return (function FakeService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			commandQueue,
			ready,
			loadScript,
			loadController
		) {

			var isInitialized = !1
				, isRunning = !1
				, listener = undefined
				, listener_fake = undefined
				, list = []
				, addAttackFake = function (params, opt_id) {
					if (!params) { return }
					!(typeof (listener) == "function") ? listener = $rootScope.$on(providers.eventTypeProvider.SCOUTING_SENT, listener_command_sent) : null;
					var expires = params.data_escolhida - params.duration
						, timer_delay = (expires - time.convertedTime()) - robotTW2.databases.data_main.time_correction_command
						, id_command = (Math.round(time.convertedTime() + params.data_escolhida).toString());

					if (opt_id) {
						id_command = params.id_command
					}

					if (timer_delay >= 0) {
						angular.extend(params, {
							"timer_delay": timer_delay,
							"id_command": id_command
						})

						commandQueue.bind(id_command, sendAttackFake, data_fake, params, function (fns) {
							commandFake[fns.params.id_command] = {
								"timeout": fns.fn.apply(this, [fns.params]),
								"params": params
							}
						})
					}
				}
				, resend = function (params) {
					commandQueue.bind(params.id_command, resendAttackFake, data_fake, params, function (fns) {
						commandFake[fns.params.id_command] = {
							"timeout": fns.fn.apply(this, [fns.params]),
							"params": params
						}
					})
				}
				, listener_command_sent = function ($event, data) {
					if (!$event.currentScope) { return }
					if (data.direction == "forward" && data.type == "attack") {
						var params = Object.keys(commandFake).map(function (cmd) {
							if (commandFake[cmd].params.start_village == data.home.id
								&& commandFake[cmd].params.target_village == data.target.id
							) {
								return commandFake[cmd].params
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
					var village = modelDataService.getSelectedCharacter().getVillage(params.start_village)
					let qtd_spy = village.getScoutingInfo().getNumAvailableSpies();
					if (qtd_spy < params.spys) {
						params.spys = qtd_spy
					}
					if (params.spys != 0) {
						socketService.emit(providers.routeProvider.SCOUTING_SEND_COMMAND, {
							'startVillage': params.start_village,
							'targetVillage': params.target_village,
							'spys': params.spys,
							'type': params.type
						});
					}

					removeCommandAttackFake(params.id_command)
				}
				, sendAttackFake = function (params) {
					var that = this;
					return $timeout(resend.bind(null, params), params.timer_delay - conf.TIME_DELAY_UPDATE)
				}
				, resendAttackFake = function (params) {
					var expires_send = params.data_escolhida - params.duration
						, timer_delay_send = (expires_send - time.convertedTime()) - robotTW2.databases.data_main.time_correction_command;

					if (timer_delay_send < 0) {
						removeCommandAttackFake(params.id_command)
						return
					}
					return $timeout(send.bind(null, params), timer_delay_send)
				}
				, sendCommandAttackFake = function (scp) {
					let vl;
					if (scp.rangeSlider) {
						vl = scp.rangeSlider.value
					} else {
						vl = scp.qtd
					}
					let opt;
					if (scp.option) {
						opt = scp.option
					} else {
						opt = scp.type
					}
					var params = {
						start_village: scp.startId,
						target_village: scp.targetId,
						target_x: scp.targetX,
						target_y: scp.targetY,
						target_name: scp.targetVillage,
						spys: vl,
						duration: scp.milisegundos_duracao,
						type: opt,
						data_escolhida: scp.tempo_escolhido
					}
					addAttackFake(params);
				}
				, removeCommandAttackFake = function (id_command) {
					if (typeof (commandFake[id_command].timeout) == "object") {
						if (commandFake[id_command].timeout.$$state.status == 0) {
							$timeout.cancel(commandFake[id_command].timeout)
						}
						delete commandFake[id_command];
					}

					commandQueue.unbind(id_command, data_fake)
				}
				, removeAll = function () {
					Object.keys(commandFake).map(function (elem) {
						if (typeof (commandFake[elem].timeout) == "object") {
							if (commandFake[elem].timeout.$$state.status == 0) {
								$timeout.cancel(commandFake[elem].timeout)
							}
							delete commandFake[elem];
						}
					})
					commandQueue.unbindAll("units", data_fake)
					commandQueue.unbindAll("buildings", data_fake)
				}
				, init = function () {
					isInitialized = !0
					start();
				}
				, start = function () {
					if (isRunning) { return }
					ready(function () {
						var open = false;
						isRunning = !0;
						$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "FAKE" })
						if (!data_fake.commands) { data_fake.commands = {} }
						Object.values(data_fake.commands).forEach(function (param) {
							if ((param.data_escolhida - param.duration) < time.convertedTime()) {
								commandQueue.unbind(param.id_command, data_fake)
							} else {
								addAttackFake(param, true);
							}
						})
					}, ["all_villages_ready"])
				}
				, stop = function () {
					typeof (listener_fake) == "function" ? listener_fake() : null;
					typeof (listener) == "function" ? listener() : null
					listener_fake = undefined;
					isRunning = !1
					$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "FAKE" })
					$timeout.cancel(interval_fake);
					interval_fake = undefined;
				}
			return {
				init: init,
				start: start,
				stop: stop,
				sendCommandAttackFake: sendCommandAttackFake,
				removeCommandAttackFake: removeCommandAttackFake,
				removeAll: removeAll,
				isRunning: function () {
					return isRunning
				},
				isInitialized: function () {
					return isInitialized
				},
				version: conf.VERSION.FAKE,
				name: "fake"
			}

		})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.commandQueue,
			robotTW2.ready,
			robotTW2.loadScript,
			robotTW2.loadController
		)
	})
