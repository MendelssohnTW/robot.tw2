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
		, commands = {}
		, isPaused = !1
		, isInitialized = !1
		, interval_reload = undefined
		, that = this
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
			var expires = params.data_escolhida - params.duration - $rootScope.data_main.time_correction_command
			, timer_delay = expires - time.convertedTime()
			, id_command = (Math.round(time.convertedTime() + params.data_escolhida).toString());

			if(opt_id){
				id_command = params.id_command
			}

			if(timer_delay >= 0){
				angular.extend(params, {
					"timer_delay" : timer_delay,
					"id_command": id_command
				})
				
				commandQueue.bind(id_command, sendAttack, $rootScope.data_attack, params, function(fns){
					commands[fns.params.id_command] = fns.fn.apply(this, [fns.params])
				})
//				commandQueue.trigger(id_command, params)
//				} else {
//				removeCommandAttack(id_command)
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
//					scope.params[params.id_command].units = units
				};
			};
			if (lista.length > 0 || !params.enviarFull) {
				commandQueue.bind(params.id_command, resendAttack, $rootScope.data_attack, params, function(fns){
					commands[fns.params.id_command] = fns.fn.apply(this, [fns.params])
				})
			} else {
				removeCommandAttack(params.id_command)
			}
		}
//		, listener_command_sent = function($event, data){
//			if(data.direction == "forward" && data.type == "attack"){
//				var cmds = Object.keys($event.currentScope.params).map(function(param){
//					if($event.currentScope.params[param].start_village == data.home.id
//							&& $event.currentScope.params[param].target_village == data.target.id
//					) {
//						return $event.currentScope.params[param]	
//					} else {
//						return undefined
//					}
//				}).filter(f => f != undefined)
//			}
//		}
		, send = function(params){
			socketService.emit(
					providers.routeProvider.SEND_CUSTOM_ARMY, {
						start_village		: params.start_village,
						target_village		: params.target_village,
						type				: params.type,
						units				: params.units,
						icon				: 0,
						officers			: params.officers,
						catapult_target		: params.catapult_target
					}
			)
			
			removeCommandAttack(params.id_command)
			$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS)

//			!scope.listener ? scope.listener = scope.$on(providers.eventTypeProvider.COMMAND_SENT, listener_command_sent) : null;

		}
		, sendAttack = function(params){
			var that = this;
			return $timeout(units_to_send.bind(null, params), params.timer_delay - conf.TIME_DELAY_UPDATE)
		}
		, resendAttack = function(params){
			var expires_send = params.data_escolhida - params.duration - $rootScope.data_main.time_correction_command
			, timer_delay_send = expires_send - time.convertedTime();

			if(timer_delay_send < 0){
				removeCommandAttack(params.id_command)
				return 
			}
			return $timeout(send.bind(null, params), timer_delay_send)
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
			if(typeof(commands[id_command]) == "object"){
				if(commands[id_command].$$state.status == 0){
					$timeout.cancel(commands[id_command])	
				}
				delete commands[id_command];
			}
			
			commandQueue.unbind(id_command, $rootScope.data_attack)
		}
		, removeAll = function(){
			if(scope.params){
				Object.keys(scope.params).map(function(pn){
					if(scope.params[pn]){
						delete scope.params[pn]
					}
				})
			}
			commandQueue.unbindAll("attack", $rootScope.data_attack)
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
			scope[params] = {};
			if(scope.listener && typeof(scope.listener) == "function") {
				scope.listener();
				delete scope.listener;
			}
		}

		angular.extend(scope, {
			listener : {}, 
			params : {}
		})
		
		return	{
			init				: init,
			start				: start,
			stop 				: stop,
			sendCommandAttack 	: sendCommandAttack,
			calibrate_time		: calibrate_time,
			removeCommandAttack	: removeCommandAttack,
			removeAll			: removeAll,
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