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
		, that = this
		, promiseReSendAttack
		, queueReSendAttack = []
		, scope = $rootScope.$new()
		, timetable = modelDataService.getGameData().data.units.map(function(obj, index, array){
			return [obj.speed * 60, obj.name]
		}).map(m => {
			return [m[0], m[1]];
		}).sort((a, b) => {
			return a[0] - b[0];
		})
		, addAttack = function(params, opt_id){
			if(!params){return}
			var id_command = (Math.round(time.convertedTime() + params.data_escolhida).toString());
			if(opt_id){
				id_command = params.id_command
			}

			var expires = params.data_escolhida - params.duration - $rootScope.data_main.time_correction_command;;
			var timer_delay = expires - time.convertedTime();

			params["timer_delay"] = timer_delay
			params["id_command"] = id_command
			if(!scope.params[id_command]){scope.params[id_command] = {}}
			angular.merge(scope.params[id_command], params);
			commandQueue.bind(id_command, sendAttack, $rootScope.data_attack, params)

			if(timer_delay >= 0){
				commandQueue.trigger(id_command, params)
			} else {
				removeCommandAttack(id_command)
			}
		}
		, units_to_send = function (params) {
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
					scope.params[params.id_command].units = units
				};
			};
			if (lista.length > 0 || !params.enviarFull) {
				resendAttack(params.id_command)
			} else {
				removeCommandAttack(params.id_command)
			}
		}
		, listener_command_sent = function($event, data){
			if(data.direction == "forward" && data.type == "attack"){
				var p = angular.merger({}, $event.currentScope.params);
			}
//			if(params.start_village == data.origin.id){
////				var id_command = data.command_id;
//				if(listener[that.id_command] && typeof(listener[that.id_command].listener) == "function") {
//					listener[that.id_command].listener();
//					delete listener[that.id_command];
//				}
//				commandQueue.unbind(that.id_command, $rootScope.data_attack)
//			}
		}
		, send = function(id_command){
			socketService.emit(
					providers.routeProvider.SEND_CUSTOM_ARMY, {
						start_village		: scope.params[id_command].start_village,
						target_village		: scope.params[id_command].target_village,
						type				: scope.params[id_command].type,
						units				: scope.params[id_command].units,
						icon				: 0,
						officers			: scope.params[id_command].officers,
						catapult_target		: scope.params[id_command].catapult_target
					}
			)

			scope.listener[id_command] = scope.$on(providers.eventTypeProvider.COMMAND_SENT, listener_command_sent)

		}
		, sendAttack = function(params){
			return $timeout(units_to_send.bind(null, params), params.timer_delay - conf.TIME_DELAY_UPDATE)
		}
		, resendAttack = function(id_command){
			var expires_send = scope.params[id_command].data_escolhida - scope.params[id_command].duration - $rootScope.data_main.time_correction_command
			, timer_delay_send = expires_send - time.convertedTime();

			if(timer_delay_send < 0){
				removeCommandAttack(id_command)
				return 
			}
			return $timeout(send.bind(null, id_command), timer_delay_send)
		}
		, sendCommandAttack = function(scp){
			scp.army = {
					'officers': {}
			}
			for (officerName in scp.officers) {
				if (scp.officers.hasOwnProperty(officerName)) {
					if (scp.officers[officerName].checked === true) {
						scp.army.officers[officerName] = true;
					}
				}
			}
			var durationInSeconds = helper.unreadableSeconds(scp.properties.duration);
			if (scp.enviarFull){
				durationInSeconds = 0;
			}
			if (scp.armyEmpty && !scp.enviarFull){
				notify("unity_select");
			} else {
				var get_data = $("#input-date").val();
				var get_time = $("#input-time").val();
				var get_ms = $("#input-ms").val();
				if (get_time.length <= 5){
					get_time = get_time + ":00"; 
				}
				if (get_data != undefined && get_time != undefined){
					scp.milisegundos_duracao = durationInSeconds * 1000;
					scp.tempo_escolhido = new Date(get_data + " " + get_time + "." + get_ms).getTime();
					if (scp.tempo_escolhido > time.convertedTime() + scp.milisegundos_duracao){
						addScopeAttack(scp);
						scp.closeWindow();
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
		, removeCommandAttack = function(id_command){
			if(scope.params[id_command]){delete scope.params[id_command]}
			commandQueue.unbind(id_command, $rootScope.data_attack)
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
		angular.extend(scope, {
			listener : [], 
			params : []
		})

		return	{
			init				: init,
			start				: start,
			stop 				: stop,
			sendCommandAttack 	: sendCommandAttack,
			calibrate_time		: calibrate_time,
			removeCommandAttack	: removeCommandAttack,
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