define("robotTW2/services/AttackService", [
	"robotTW2",
	"robotTW2/version",
	"helper/time",
	"robotTW2/conf",
	"robotTW2/notify",
	"robotTW2/time",
	"robotTW2/calibrate_time",
	], function(
			robotTW2,
			version,
			helper,
			conf,
			notify,
			time,
			calibrate_time
	){
	return (function AttackService(
			$rootScope,
			databases,
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
		, interval_reload = undefined
//		, listener_change = undefined
		, listener = []
		, that = this
		, promiseReSendAttack
		, queueReSendAttack = []
		, timetable = modelDataService.getGameData().data.units.map(function(obj, index, array){
			return [obj.speed * 60, obj.name]
		}).map(m => {
			return [m[0], m[1]];
		}).sort((a, b) => {
			return a[0] - b[0];
		})
		, addAttack = function(params, opt_id){
			if(!params){return}
			var id_command = (Math.round(time.convertedTime() / 1e9)).toString() + params.data_escolhida.toString();
			if(opt_id){
				id_command = params.id_command
			}

			var expires = params.data_escolhida - params.duration;
			var timer_delay = expires - time.convertedTime();

			params["timer_delay"] = timer_delay
			params["id_command"] = id_command
			commandQueue.bind(id_command, sendAttack, $rootScope.data_attack, params)

			if(timer_delay >= 0){
				commandQueue.trigger(id_command, params)
			}
		}
		, sendAttack = function(params){
			var id_command = params.id_command
			, timer_delay = params.timer_delay;

			return $timeout(function () {
				var lista = [],
				units = {};
				if (params.enviarFull){
					var village = modelDataService.getSelectedCharacter().getVillage(params.start_village);
					if (village.unitInfo != undefined){
						var unitInfo = village.unitInfo.units;
						for(obj in unitInfo){
							if (unitInfo.hasOwnProperty(obj)){
								if (unitInfo[obj].available > 0){
									units[obj] = unitInfo[obj].available
									lista.push(units);
								}
							}
						}
						params.units = units;
					};
				};
				if (lista.length > 0 || !params.enviarFull) {
					resendAttack(params)
				} else {
					commandQueue.unbind(id_command, $rootScope.data_attack)
				}
				$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS)

			}, params.timer_delay - conf.TIME_DELAY_UPDATE)

			return
		}
		, resendAttack = function(params){
//			var data_main = robotTW2.databases.data_main.get()
			var id_command = params.id_command
			var expires_send = params.data_escolhida - params.duration + $rootScope.data_main.time_correction_command;
			var timer_delay_send = expires_send - time.convertedTime();
			if(timer_delay_send >= 0){
				function e (){
					return $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, function($event, data){
						if(params.start_village == data.origin.id){
							var id_command = data.command_id;
							if(listener[id_command] && typeof(listener[id_command].listener) == "function") {
								listener[id_command].listener();
								delete listener[id_command];
							}
							commandQueue.unbind(id_command, $rootScope.data_attack)
						}
					})
				}

				return $timeout(function(){
					listener[id_command] = {listener : e}
//					if (promiseReSendAttack) {
//						queueReSendAttack.push(arguments);
//						return;
//					}

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

				}, timer_delay_send)
			} else {
				commandQueue.unbind(id_command, $rootScope.data_attack)
				return null
			}

		}
		, sendCommandAttack = function(scope){
			scope.army = {
					'officers': {}
			}
			for (officerName in scope.officers) {
				if (scope.officers.hasOwnProperty(officerName)) {
					if (scope.officers[officerName].checked === true) {
						scope.army.officers[officerName] = true;
					}
				}
			}
			var durationInSeconds = helper.unreadableSeconds(scope.properties.duration);
			if (scope.enviarFull){
				durationInSeconds = 0;
			}
			if (scope.armyEmpty && !scope.enviarFull){
				notify("unity_select");
			} else {
				var get_data = $("#input-date").val();
				var get_time = $("#input-time").val();
				var get_ms = $("#input-ms").val();
				if (get_time.length <= 5){
					get_time = get_time + ":00"; 
				}
				if (get_data != undefined && get_time != undefined){
					scope.milisegundos_duracao = durationInSeconds * 1000;
					scope.tempo_escolhido = new Date(get_data + " " + get_time + "." + get_ms).getTime();
					if (scope.tempo_escolhido > time.convertedTime() + scope.milisegundos_duracao){
						addScopeAttack(scope);
						scope.closeWindow();
					} else {
						notify("date_error");
					}       
				} else {
					return;
				}
			}
		}
		, addScopeAttack = function(scp){
			var params = {
					start_village		: scp.selectedVillage.data.villageId,
					target_village		: scp.target.id,
					target_name			: scp.target.data.name,
					target_x			: scp.target.data.x,
					target_y			: scp.target.data.y,
					type				: scp.activeTab,
					duration			: scp.milisegundos_duracao,
					enviarFull			: scp.enviarFull,
					data_escolhida		: scp.tempo_escolhido,
					units				: scp.unitsToSend,
					officers			: scp.army.officers,
					catapult_target		: scp.catapultTarget.value
			}
			addAttack(params);
		}
		, init = function(){
			isInitialized = !0
			start();
		}
		, start = function(){
			if(isRunning){return}
			ready(function(){
				loadScript("/controllers/AttackCompletionController.js");
				calibrate_time()
				isRunning = !0
				Object.values($rootScope.data_attack.commands).forEach(function(param){
					if((param.data_escolhida - param.duration) < time.convertedTime()){
						commandQueue.unbind(param.id_command, $rootScope.data_attack)
					} else {
						addAttack(param, true);
					}
				})
			}, ["all_villages_ready"])
		}
		, stop = function(){
			robotTW2.removeScript("/controllers/AttackCompletionController.js");
			commandQueue.unbindAll("attack", $rootScope.data_attack)
			interval_reload ? $timeout.cancel(interval_reload): null;
			interval_reload = undefined;
			isRunning = !1;
		}

		return	{
			init				: init,
			start				: start,
			stop 				: stop,
			sendCommandAttack 	: sendCommandAttack,
			calibrate_time		: calibrate_time,
			removeCommandAttack	: function(id_command){
				commandQueue.unbind(id_command, $rootScope.data_attack)
			},
			removeAll			: function(id_command){
				commandQueue.unbindAll("attack", $rootScope.data_attack)
			},
			isRunning			: function () {
				return isRunning
			},
			isInitialized		: function () {
				return isInitialized
			},
			version				: version.attack,
			name				: "attack"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.databases,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.commandQueue,
			robotTW2.services.socketService,
			robotTW2.ready,
			robotTW2.loadScript
	)
})