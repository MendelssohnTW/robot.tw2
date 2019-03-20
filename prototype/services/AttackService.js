define("robotTW2/CommandAttack", [
	], function(){
	return {}
})

define("robotTW2/services/AttackService", [
	"robotTW2",
	"robotTW2/version",
	"helper/time",
	"robotTW2/conf",
	"robotTW2/notify",
	"robotTW2/time",
	"robotTW2/databases/data_attack",
	"robotTW2/CommandAttack"
	], function(
			robotTW2,
			version,
			helper,
			conf,
			notify,
			time,
			data_attack,
			commandAttack
	){
	return (function AttackService(
			$rootScope,
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
		, interval_reload = undefined
		, that = this
		, timetable = modelDataService.getGameData().data.units.map(function(obj, index, array){
			return [obj.speed * 60, obj.name]
		}).map(m => {
			return [m[0], m[1]];
		}).sort((a, b) => {
			return a[0] - b[0];
		})
		, addAttack = function(params, opt_id){
			if(!params){return}
			!(typeof(listener) == "function") ? listener = $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, listener_command_sent) : null;
			var expires = params.data_escolhida - params.duration
			, timer_delay = (expires - time.convertedTime()) + robotTW2.databases.data_main.time_correction_command
			, id_command = (Math.round(time.convertedTime() + params.data_escolhida).toString());

			if(opt_id){
				id_command = params.id_command
			}

			if(timer_delay >= 0){
				angular.extend(params, {
					"timer_delay" : timer_delay,
					"id_command": id_command
				})

				commandQueue.bind(id_command, sendAttack, data_attack, params, function(fns){
					commandAttack[fns.params.id_command] = {
						"timeout" 	: fns.fn.apply(this, [fns.params]),
						"params"	: params
					}
				})
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
				};
			};
			if (lista.length > 0 || !params.enviarFull) {
				commandQueue.bind(params.id_command, resendAttack, data_attack, params, function(fns){
					commandAttack[fns.params.id_command] = {
						"timeout" 	: fns.fn.apply(this, [fns.params]),
						"params"	: params
					}
				})
			} else {
				removeCommandAttack(params.id_command)
			}
		}
		, listener_command_sent = function($event, data){
			if(!$event.currentScope){return}
			if(data.direction == "forward" && data.type == "attack"){
				var params = Object.keys(commandAttack).map(function(cmd){
					if(commandAttack[cmd].params.start_village == data.home.id
							&& commandAttack[cmd].params.target_village == data.target.id
					) {
						return commandAttack[cmd].params	
					} else {
						return undefined
					}
				}).filter(f => f != undefined)

				let param = undefined;
				if(params.length){
					params.sort(function(a,b){return a.data_escolhida - b.data_escolhida})
					param = params.shift();
				}

				$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS)
			}
		}
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
		}
		, sendAttack = function(params){
			var that = this;
			return $timeout(units_to_send.bind(null, params), params.timer_delay - conf.TIME_DELAY_UPDATE)
		}
		, resendAttack = function(params){
			var expires_send = params.data_escolhida - params.duration
			, timer_delay_send = (expires_send - time.convertedTime()) + robotTW2.databases.data_main.time_correction_command;

			if(timer_delay_send < 0){
				removeCommandAttack(params.id_command)
				return 
			}
			return $timeout(send.bind(null, params), timer_delay_send)
		}
		, sendCommandAttack = function(scp){
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
			if(typeof(commandAttack[id_command].timeout) == "object"){
				if(commandAttack[id_command].timeout.$$state.status == 0){
					$timeout.cancel(commandAttack[id_command].timeout)	
				}
				delete commandAttack[id_command];
			}

			commandQueue.unbind(id_command, data_attack)
		}
		, removeAll = function(){
			commandAttack = {};
			commandQueue.unbindAll("attack", data_attack)
		}
		, init = function(){
			isInitialized = !0
			loadScript("/controllers/AttackCompletionController.js");
			start();
		}
		, start = function(){
			if(isRunning){return}
			ready(function(){
				loadScript("/controllers/AttackCompletionController.js", true);
				isRunning = !0
				Object.values(data_attack.commands).forEach(function(param){
					if((param.data_escolhida - param.duration) < time.convertedTime()){
						commandQueue.unbind(param.id_command, data_attack)
					} else {
						addAttack(param, true);
					}
				})
			}, ["all_villages_ready"])
		}
		, stop = function(){
			robotTW2.removeScript("/controllers/AttackCompletionController.js");
			commandQueue.unbindAll("attack", data_attack)
			interval_reload ? $timeout.cancel(interval_reload): null;
			interval_reload = undefined;
			isRunning = !1;
			typeof(listener) == "function" ? listener(): null
		}

		return	{
			init				: init,
			start				: start,
			stop 				: stop,
			sendCommandAttack 	: sendCommandAttack,
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
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.commandQueue,
			robotTW2.services.socketService,
			robotTW2.ready,
			robotTW2.loadScript
	)
})