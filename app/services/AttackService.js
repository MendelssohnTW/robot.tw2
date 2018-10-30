define("robotTW2/services/AttackService", [
	"robotTW2",
	"helper/time",
	"robotTW2/conf",
	], function(
			robotTW2,
			helper,
			conf
	){
	return (function AttackService() {

		var init = function(){
			isInitialized = !0
			start();
		}
		, start = function(){
			if(isRunning){return}
			robotTW2.ready(function(){
				robotTW2.loadScript("/controllers/AttackCompletionController.js");
				calibrate_time()
				interval_reload = robotTW2.services.$timeout(function (){
					stop();
					start();
				}, interval)
//				listener_change = robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"ATTACK"})
				isRunning = !0
				Object.values(db.commands).forEach(function(param){
					if(param.data_escolhida < helper.gameTime()){
						robotTW2.commandQueueAttack.unbind(param.id_command, true, true)
					} else {
						addAttack(param, true);
					}
				})
			}, ["all_villages_ready"])
		}
		, stop = function(){
			robotTW2.commandQueueAttack.unbindAll(db)
//			typeof(listener_change) == "function" ? listener_change(): null;
			interval_reload ? robotTW2.services.$timeout.cancel(interval_reload): null;
//			listener_change = undefined;
			interval_reload = undefined;
			isRunning = !1;
		}
		, isRunning = !1
		, isPaused = !1
		, isInitialized = !1
		, interval_reload = undefined
//		, listener_change = undefined
		, timeoutIdAttack = {}
		, data_attack = robotTW2.databases.data_attack
		, db = data_attack.get()
		, data_main = robotTW2.databases.data_main
		, db_main = data_main.get()
		, interval = db.interval
		, that = this
		, promiseReSendAttack
		, queueReSendAttack = []
		, timetable = robotTW2.services.modelDataService.getGameData().data.units.map(function(obj, index, array){
			return [obj.speed * 60, obj.name]
		}).map(m => {
			return [m[0], m[1]];
		}).sort((a, b) => {
			return a[0] - b[0];
		})
		, villages = robotTW2.databases.data_villages.getVillages()
		, calibrate_time = function(){
			var duration = undefined
			, sTime
			, gTime
			, vl
			, listener_completed = undefined;

			var list = [];
			for (v in villages){
				if (villages.hasOwnProperty(v)){
					list.push(v)
				}
			};

			var nx = function (){
				if(list.length){
					function getVills(village, callbackVill){				
						robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.MAP_GETVILLAGES,{x:xT, y:yT, width: dist, height: dist}, function(data){
							if(!data){return}
							if (data.villages != undefined && data.villages.length > 0){
								var listaVil = angular.copy(data.villages);
								var s = xT + dist / 2;
								var r = yT + dist / 2;
								listaVil.sort(function (a, b) {
									if (Math.abs(a.x - s) != Math.abs(b.x - s)){
										if (Math.abs(a.x - s) < Math.abs(b.x - s)) {
											return 1;
										};
										if (Math.abs(a.x - s) > Math.abs(b.x - s)) {
											return -1;
										};
									} else if(Math.abs(a.y - r) != Math.abs(b.y - r)){
										if (Math.abs(a.y - r) < Math.abs(b.y - r)) {
											return 1;
										};
										if (Math.abs(a.y - r) > Math.abs(b.y - r)) {
											return -1;
										};
									} else {
										return 0;	
									}
								});
								for (j = 0; j < listaVil.length; j++){
									if (listaVil[j].affiliation == "own"){
										list_villages.push(listaVil[j].id);
									}
								}
								list_villages = list_villages.filter(f => f != village.getId())
								if(list_villages.length > 1){
									callbackVill(list_villages.pop());
								} else {
									callbackVill()
								}
							} 
						});
					}

					var v = list.shift();
					var village = robotTW2.services.modelDataService.getSelectedCharacter().getVillage(v);
					vl = village.getId();
					var dist = 50;
					var xT = village.getX() - dist / 2;
					var yT = village.getY() - dist / 2;
					var list_villages = [];

					getVills(village, function(v){
						if(!v){
							nx(); 
							return
						}
						var villageV = robotTW2.services.modelDataService.getSelectedCharacter().getVillage(v);
						var units = {};
						var unitInfo = village.unitInfo.getUnits();
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

						if (!Object.keys(units).length){
							nx()
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

						var x1 = village.getX(), 
						y1 = village.getY(), 
						x2 = villageV.getX(), 
						y2 = villageV.getY();

						if (y1 % 2) //se y é impar
							x1 += .5;
						if (y2 % 2)
							x2 += .5;
						var dy = y1 - y2,
						dx = x1 - x2; 

						var distancia = Math.abs(Math.sqrt(Math.pow(dx,2) + (Math.pow(dy,2) * 0.75)));
						duration = helper.unreadableSeconds(helper.readableSeconds(timeCampo * distancia, false))

						robotTW2.services.$timeout(function(){
							listener_completed ? listener_completed() : listener_completed;
							listener_completed = undefined;
							listener_completed = robotTW2.services.$rootScope.$on(robotTW2.providers.eventTypeProvider.COMMAND_SENT, function ($event, data){
								if(!data){
									return;
								}
								if(data.direction =="forward" && data.origin.id == vl && duration){
//									var db_main = data_main.get();
									var t = data.time_completed * 1000 - duration * 1000 - gTime;
									if(!db_main.max_time_correction || (t > -db_main.max_time_correction && t < db_main.max_time_correction)) {
										db_main.time_correction_command = t
										db_main.set(main);
										robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.CHANGE_TIME_CORRECTION)
									}

									robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.COMMAND_CANCEL, {
										command_id: data.command_id
									})
									listener_completed();
									listener_completed = undefined;
								}
							})
							gTime = helper.gameTime();
							robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.SEND_CUSTOM_ARMY, {
								start_village: village.getId(),
								target_village: villageV.getId(),
								type: "support",
								units: units,
								icon: 0,
								officers: {},
								catapult_target: null
							});
						}, 1000);
					})
				}
			}
			nx()
		}
		, addAttack = function(params, opt_id){
			if(!params){return}
			var id_command = (Math.round(helper.gameTime() / 1e9)).toString() + params.data_escolhida.toString();
			if(opt_id){
				id_command = params.id_command
			}
			robotTW2.commandQueueAttack.bind(id_command, sendAttack, db)

			var expires = params.data_escolhida - params.duration;
			var timer_delay = expires - helper.gameTime() - db_main.time_correction_command;
			params["id_command"] = id_command
			params["timer_delay"] = timer_delay

			if(timer_delay > 0){
				robotTW2.commandQueueAttack.trigger(id_command, params)
			} else {
				robotTW2.commandQueueAttack.unbind(id_command, db)
				console.log("Comando da aldeia " + robotTW2.services.modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(helper.gameTime()) + " com tempo do servidor, devido vencimento de limite de delay");
			}
		}
		, sendAttack = function(params){
			var id_command = params.id_command
			, timer_delay = params.timer_delay;

			return robotTW2.services.$timeout(function () {
				var lista = [],
				units = {};
				if (params.enviarFull){
					var village = robotTW2.services.modelDataService.getSelectedCharacter().getVillage(params.start_village);
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
					robotTW2.commandQueueAttack.unbind(id_command, db)
					console.log("Comando da aldeia " + robotTW2.services.modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(helper.gameTime()) + " com tempo do servidor, pois não, possui tropas");
				}
				$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS)

			}, params.timer_delay - conf.TIME_DELAY_UPDATE)

			return promiseSendAttack
		}
		, resendAttack = function(params){
//			var data_main = robotTW2.databases.data_main.get()
			var id_command = params.id_command
			var expires_send = params.data_escolhida - params.duration;
			var timer_delay_send = expires_send - helper.gameTime() - db_main.time_correction_command;
			if(timer_delay_send > 0){
				return robotTW2.services.$timeout(function(){
					listener[id_command] = {listener : $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, function($event, data){
						if(params.start_village == data.origin.id){
							console.log("Comando da aldeia " 
									+ data.home.name + 
									" enviado as " 
									+ new Date(helper.gameTime()) + 
									" solicitado para sair as " 
									+ new Date(data.time_start * 1000) + 
									" solicitado para chegar as " 
									+ new Date(params.data_escolhida) +
									" com as seguintes unidades " 
									+ JSON.stringify(data.units)
							);
							var id_command = params.id_command;
							if(listener[id_command] && typeof(listener[id_command].listener) == "function") {
								listener[id_command].listener();
								delete listener[id_command];
							}
							robotTW2.commandQueueAttack.unbind(id_command, db)
						}
					})}
					if (promiseReSendAttack) {
						queueReSendAttack.push(arguments);
						return;
					}

					robotTW2.services.socketService.emit(
							robotTW2.providers.routeProvider.SEND_CUSTOM_ARMY, {
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
				robotTW2.commandQueueAttack.unbind(id_command, db)
				console.log("Comando da aldeia " + robotTW2.services.modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(helper.gameTime()) + " com tempo do servidor, devido vencimento de limite de delay");
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
					if (scope.tempo_escolhido > (helper.gameTime() + scope.milisegundos_duracao)){
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
		
		return	{
			init				: init,
			start				: start,
			stop 				: stop,
			sendCommandAttack 	: sendCommandAttack,
			calibrate_time		: calibrate_time,
			removeCommandAttack	: function(id_command){
				robotTW2.commandQueueAttack.unbind(id_command, db)
			},
			removeAll			: function(id_command){
				robotTW2.commandQueueAttack.unbindAll(db)
			},
			isRunning			: function () {
				return isRunning
			},
			isInitialized		: function () {
				return isInitialized
			},
			version				: "1.0.0",
			name				: "attack"
		}
	})()
})