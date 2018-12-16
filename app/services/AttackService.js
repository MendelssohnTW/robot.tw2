define("robotTW2/services/AttackService", [
	"robotTW2",
	"robotTW2/version",
	"helper/time",
	"robotTW2/conf",
	"robotTW2/notify",
	"robotTW2/time"
	], function(
			robotTW2,
			version,
			helper,
			conf,
			notify,
			convertedTime
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
		, timeoutIdAttack = {}
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
		, calibrate_time = function(){
			var villages = modelDataService.getVillages()
			, village = villages[Object.keys(villages).shift()]
			, units = {}
			, unitInfo = village.unitInfo.getUnits()
			, listener_completed = undefined
			, gTime
			, duration = undefined
			, timetable = modelDataService.getGameData().data.units.map(function(obj, index, array){
				return [obj.speed * 60, obj.name]
			}).map(m => {
				return [m[0], m[1]];
			}).sort((a, b) => {
				return a[0] - b[0];
			})
			, units = {}
			, unitInfo = village.unitInfo.getUnits();

			if (!unitInfo) {return};
			for(obj in unitInfo){
				if (unitInfo.hasOwnProperty(obj)){
					if (unitInfo[obj].available > 0){
						var campo = {[obj]: unitInfo[obj].available};
						units[Object.keys(campo)[0]] = 
							Object.keys(campo).map(function(key) {return campo[key]})[0];
					}
				}
			}

			if(!units){
				console.log("no units")
				return
			}

			var newTimeTable = [];

			if(Object.keys(units).find(f=> f == "knight")) {
				newTimeTable.push([480, "light_cavalry"])
			} else {
				timetable.map(m => {
					if(Object.keys(units).find(f=> f == m[1])) {newTimeTable.push(m)}
				});
			}

			var timeCampo = newTimeTable.sort((a, b) => {
				return b[0] - a[0];
			})[0][0];

			socketService.emit(providers.routeProvider.MAP_GET_NEAREST_BARBARIAN_VILLAGE, {
				'x' : village.data.x,
				'y' : village.data.y
			}, function(bb) {
				if (bb) {

					var x1 = village.getX(), 
					y1 = village.getY(), 
					x2 = bb.x, 
					y2 = bb.y;

					if (y1 % 2) //se y é impar
						x1 += .5;
					if (y2 % 2)
						x2 += .5;
					var dy = y1 - y2,
					dx = x1 - x2; 

					var distancia = Math.abs(Math.sqrt(Math.pow(dx,2) + (Math.pow(dy,2) * 0.75)));
					duration = helper.unreadableSeconds(helper.readableSeconds(timeCampo * distancia, false))

					$timeout(function(){
						listener_completed ? listener_completed() : listener_completed;
						listener_completed = undefined;
						listener_completed = $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, function ($event, data){
							if(!data){return;}
							if(data.direction =="forward" && data.origin.id == village.data.villageId){
								var outgoing = modelDataService.getSelectedCharacter().getVillage(village.data.villageId).data.commands.outgoing;
								var completedAt = outgoing[Object.keys(outgoing).pop()].completedAt;
								var dif = completedAt - duration * 1000 - gTime;
								if(!$rootScope.data_main.max_time_correction || (dif > -$rootScope.data_main.max_time_correction && dif < $rootScope.data_main.max_time_correction)) {
									$rootScope.data_main.time_correction_command = dif
									$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_TIME_CORRECTION)
								}
								$timeout(function(){
									socketService.emit(providers.routeProvider.COMMAND_CANCEL, {
										command_id: data.command_id
									})
								}, 5000)
								listener_completed();
								listener_completed = undefined;
							}
						})
						gTime = convertedTime();
						socketService.emit(providers.routeProvider.SEND_CUSTOM_ARMY, {
							start_village: village.getId(),
							target_village: bb.id,
							type: "support",
							units: units,
							icon: 0,
							officers: {},
							catapult_target: null
						});
					}, 1000);
				}
			})
		}
		, addAttack = function(params, opt_id){
			if(!params){return}
			var id_command = (Math.round(convertedTime() / 1e9)).toString() + params.data_escolhida.toString();
			if(opt_id){
				id_command = params.id_command
			}

			var expires = params.data_escolhida - params.duration;
			var timer_delay = expires - convertedTime() - $rootScope.data_main.time_correction_command;

			params["timer_delay"] = timer_delay
			params["id_command"] = id_command
			commandQueue.bind(id_command, sendAttack, $rootScope.data_attack, params)

			if(timer_delay > 0){
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
					timeoutIdAttack[id_command] = resendAttack(params)
				} else {
					commandQueue.unbind(id_command, $rootScope.data_attack)
				}
				$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS)

			}, params.timer_delay - conf.TIME_DELAY_UPDATE)

			return promiseSendAttack
		}
		, resendAttack = function(params){
//			var data_main = robotTW2.databases.data_main.get()
			var id_command = params.id_command
			var expires_send = params.data_escolhida - params.duration;
			var timer_delay_send = expires_send - convertedTime() - $rootScope.data_main.time_correction_command;
			if(timer_delay_send > 0){
				return $timeout(function(){
					listener[id_command] = {listener : $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, function($event, data){
						if(params.start_village == data.origin.id){
							var id_command = params.id_command;
							if(listener[id_command] && typeof(listener[id_command].listener) == "function") {
								listener[id_command].listener();
								delete listener[id_command];
							}
							commandQueue.unbind(id_command, $rootScope.data_attack)
						}
					})}
					if (promiseReSendAttack) {
						queueReSendAttack.push(arguments);
						return;
					}

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
					if (scope.tempo_escolhido > convertedTime() + scope.milisegundos_duracao){
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
//				interval_reload = $timeout(function (){
//				stop();
//				start();
//				}, $rootScope.data_attack.interval)
//				listener_change = $rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"ATTACK"})
				isRunning = !0
				Object.values($rootScope.data_attack.commands).forEach(function(param){
					if((param.data_escolhida - param.duration) < convertedTime()){
						commandQueue.unbind(param.id_command, $rootScope.data_attack)
					} else {
						addAttack(param, true);
					}
				})
			}, ["all_villages_ready"])
		}
		, stop = function(){
			robotTW2.removeScript("/controllers/AttackCompletionController.js");
			commandQueue.unbindAll($rootScope.data_attack)
//			typeof(listener_change) == "function" ? listener_change(): null;
			interval_reload ? $timeout.cancel(interval_reload): null;
//			listener_change = undefined;
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
				commandQueue.unbindAll($rootScope.data_attack)
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