define("robotTW2/attack", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_villages",
	"robotTW2/data_attack",
	"robotTW2/data_main",
	"robotTW2/loadController",
	"robotTW2/notify",
	"robotTW2/getScope",
	"robotTW2/ready",
	"helper/time",
	"robotTW2/removeCommand",
	"robotTW2/addCommand",
	"robotTW2/templates",
	"robotTW2/conf"
	], function(
			services,
			providers,
			data_villages,
			data_attack,
			data_main,
			loadController,
			notify,
			getScope,
			ready,
			helper,
			removeCommand,
			addCommand,
			templates,
			conf
	){
	var isInitialized = !1
	, isRunning = !1
	, scope = {}
	, listener_layout = undefined
	, interval_reload = undefined
	, timeoutIdAttack = {}
	, timetable = services.modelDataService.getGameData().data.units.map(function(obj, index, array){
		return [obj.speed * 60, obj.name]
	}).map(m => {
		return [m[0], m[1]];
	}).sort((a, b) => {
		return a[0] - b[0];
	})
	, villages = data_villages.getVillages()
	, tBody = function(){
		$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS)
	}
	, sendAttack = function(params){
		var id_command = params.id_command;
		var timer_delay = params.timer_delay;
		var a = {}
		, command_sent = function($event, data){
			if(params.start_village == data.origin.id){
				//var dados = database.get("dados_attack")
				if(a[id_command] && typeof(a[id_command].listener) == "function") {
					//database.set("dados_attack", dados, true);
					a[id_command].listener();
					delete a[id_command];
				}
				console.log("Comando da aldeia " 
						+ data.home.name + 
						" enviado as " 
						+ new Date(helper.gameTime()) + 
						" solicitado para sair as " 
						+ new Date(data.time_start * 1000) + 
						" solicitado para chegar as " 
						+ new Date(data.time_completed * 1000) +
						" com as seguintes unidades " 
						+ JSON.stringify(data.units)
				);
				if (timeoutIdAttack[id_command]){
					services.$timeout.cancel(timeoutIdAttack[id_command]);
					delete timeoutIdAttack[id_command]	
				}
				removeCommand(id_command, "data_attack", timeoutIdAttack, tBody)
			}
		}

		return services.$timeout(function () {
			var lista = [],
			units = {};
			if (params.enviarFull){
				var village = services.modelDataService.getSelectedCharacter().getVillage(params.start_village);
				if (village.unitInfo != undefined){
					var unitInfo = village.unitInfo.units;
					for(obj in unitInfo){
						if (unitInfo.hasOwnProperty(obj)){
							if (unitInfo[obj].available > 0){
								//var campo = {[obj]: unitInfo[obj].available};
								units[obj] = unitInfo[obj].available
								//Object.keys(campo).map(function(key) {return campo[key]})[0];
								lista.push(units);
							}
						}
					}
					params.units = units;
				};
			};
			if (lista.length > 0 || !params.enviarFull) {
				var expires_send = params.data_escolhida - params.duration;
				var timer_delay_send = expires_send - helper.gameTime() - data_main.getMain().TIME_CORRECTION_COMMAND;
				if(timer_delay_send > 0){
					services.$timeout(function(){
						a[id_command] = {
//								time 		: params.data_escolhida,
								listener 	: $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, command_sent)
						} 
						services.socketService.emit(
								providers.routeProvider.SEND_CUSTOM_ARMY, {
									start_village: params.start_village,
									target_village: params.target_village,
									type: params.type,
									units: params.units,
									icon: 0,
									officers: params.officers,
									catapult_target: params.catapult_target
								});
					}, timer_delay_send)
				} else {
					console.log("Comando da aldeia " + services.modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(helper.gameTime()) + " com tempo do servidor, devido vencimento de limite de delay");
				}
			} else {
				console.log("Comando da aldeia " + services.modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(helper.gameTime()) + " com tempo do servidor, pois não, possui tropas");
				tBody();
			};

		}, params.timer_delay - conf.TIME_DELAY_UPDATE);
	}
	, addAttack = function(params, id_command){
		if(params && id_command){
			var t = {
					id_command: id_command
			}
			angular.merge(params, t);
			var cmd = {
					id_command: id_command,
					params: params
			}

			var db = data_attack.getAttack();
			var comandos = db.COMMANDS;
			var expires = params.data_escolhida - params.duration;
			var timer_delay = expires - helper.gameTime() - data_main.getMain().TIME_CORRECTION_COMMAND;
			var p = {
					timer_delay: timer_delay
			}
			angular.merge(params, p);
			if(timeoutIdAttack[id_command]){
				services.$timeout.cancel(timeoutIdAttack[id_command])
				delete (timeoutIdAttack[id_command])
			}
			if(timer_delay > 0){
				timeoutIdAttack[id_command] = sendAttack(params);
				!comandos.find(f => f.id_command == cmd.id_command) ? comandos.push(cmd) : null;
			} else {
				comandos = comandos.filter(f => f.id_command != cmd.id_command);
				console.log("Comando da aldeia " + services. modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(helper.gameTime()) + " com tempo do servidor, devido vencimento de limite de delay");
			}
			db.COMMANDS = comandos;
			data_attack.setAttack(db);
		}
	}
	, addCommandAttack = function(scp){

//		var ModalCustomArmyController = loadController("ModalCustomArmyController");
//		var a;
//		var e = {}
		var id_command = helper.gameTime();
//		for (a in scp.officers) {
//		if (scp.officers.hasOwnProperty(a)) {
//		if (scp.officers[a].checked === !0){
//		e[a] = scp.officers[a];
//		}
//		};
//		}
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
				officers			: scp.officers,
				catapult_target		: scp.catapultTarget.value
		}
		addAttack(params, id_command);
	}
	, sendCommandAttack = function(scope){
		var army = {
				'units': scope.unitsToSend,
				'officers': scope.officers
		}
//		for (officerName in scope.officers) {
//		if (scope.officers.hasOwnProperty(officerName)) {
//		if (scope.officers[officerName].checked === true) {
//		army.officers[officerName] = true;
//		}
//		}
//		}
//		var durationInSeconds = services.armyService.getTravelTimeForDistance(army, scope.properties.travelTime, scope.distance, scope.activeTab, true);
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
//				var tempo_atual = new Date(new Date(helper.gameTime()).getFullYear(),new Date(helper.gameTime()).getMonth(),new Date(helper.gameTime()).getDate(), new Date(helper.gameTime()).getHours(), new Date(helper.gameTime()).getMinutes(), new Date(helper.gameTime()).getSeconds()).getTime();
				if (scope.tempo_escolhido > (helper.gameTime() + milisegundos_duracao)){
					addCommandAttack(scope);
					scope.closeWindow();
				} else {
					notify("date_error");
				}       
			} else {
				return;
			}
		}
	}
	, calibrate_time = function(callback){
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
					services.socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:xT, y:yT, width: dist, height: dist}, function(data){
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

				function command_sent($event, data){
					if(!data){
						return;
					}
					if(data.direction =="forward" && data.origin.id == vl && duration){
						var main = data_main.getMain();
						var t = data.time_completed * 1000 - duration * 1000 - gTime;
						if(t > -main.MAX_TIME_CORRECTION && t < main.MAX_TIME_CORRECTION) {
							main.TIME_CORRECTION_COMMAND = t
							data_main.setMain(main);
						}

						services.socketService.emit(providers.routeProvider.COMMAND_CANCEL, {
							command_id: data.command_id
						})
						listener_completed();
						listener_completed = undefined;
						callback();
					}
				}

				var v = list.shift();
				var village = services.modelDataService.getSelectedCharacter().getVillage(v);
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
					var villageV = services.modelDataService.getSelectedCharacter().getVillage(v);
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

					services.$timeout(function(){
						listener_completed ? listener_completed() : listener_completed;
						listener_completed = undefined;
						listener_completed = $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, command_sent)
						gTime = helper.gameTime();
						services.socketService.emit(providers.routeProvider.SEND_CUSTOM_ARMY, {
							start_village: village.getId(),
							target_village: villageV.getId(),
							type: "support",
							units: units,
							icon: 0,
							officers: {},
							catapult_target: null
						});
					}, 10000);
				})
			} else {
				callback()
			}
		}
		nx()
		//})

	}
	, createLayoutAttack = function(){
		var templateName = "attackcompletion";
		$rootScope.$on("$includeContentLoaded", function(event, screenTemplateName, data){
			var $scope = loadController("ModalCustomArmyController");
			if($scope){
				$scope.text_date = services.$filter("i18n")("text_date", $rootScope.loc.ale, "attack");
				$scope.text_hour = services.$filter("i18n")("text_hour", $rootScope.loc.ale, "attack");
				$scope.text_ms = services.$filter("i18n")("text_ms", $rootScope.loc.ale, "attack");
				$scope.text_full = services.$filter("i18n")("text_full", $rootScope.loc.ale, "attack");
				$scope.text_prog_full = services.$filter("i18n")("text_prog_full", $rootScope.loc.ale, "attack");
				$scope.text_prog = services.$filter("i18n")("text_prog", $rootScope.loc.ale, "attack");
				$scope.date_init = services.$filter("date")(new Date(helper.gameTime()), "yyyy-MM-dd")
				$scope.hour_init = services.$filter("date")(new Date(helper.gameTime()), "HH:mm:ss")
				$scope.schedule = services.$filter("i18n")("SCHEDULE", $rootScope.loc.ale);
				$scope.ms_init = 0;

				$scope.enviarFull = false;
				$scope.btnActive = false;

				$scope.sendAttack = function(){
					sendCommandAttack($scope)
				}

				$scope.toggleFull = function(elem){

					$scope.enviarFull = elem.enviarFull;
					$scope.btnActive = !$scope.armyEmpty || $scope.enviarFull;
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				}

				$scope.$watch("armyEmpty", function(){
					$scope.btnActive = !$scope.armyEmpty || $scope.enviarFull;

					if (!$scope.$$phase) {
						$scope.$apply();
					}
				})

				if (!$scope.$$phase) {
					$scope.$apply();
				}
			}

		})

		var success = function(template){
			if (!services.$templateCache.get(templateName)) {
				services.$templateCache.put(templateName, template);
			}
			var pai = $('[ng-controller="ModalCustomArmyController"]');
			var filho = pai.children("div").children(".box-paper").children(".scroll-wrap"); 
			filho.append(template)
			services.$compile(template)(loadController("ModalCustomArmyController"))
		}

		if (services.$templateCache.get(templateName)) {
			success(services.$templateCache.get(templateName));
		} else {
			templates.get(templateName, success);
		}
	}
	, init = function (){
		isInitialized = !0
		start();
	}
	, start = function (){
		if(isRunning){return}
		ready(function(){
			calibrate_time(function(){
				var db = data_attack.getAttack();
				db.INTERVAL = conf.INTERVAL.HEADQUARTER;
				data_attack.setAttack(db);
				interval_reload = services.$timeout(function (){
					stop();
					start();	
				}, data_attack.getAttack().INTERVAL)
				listener_layout = $rootScope.$on(providers.eventTypeProvider.PREMIUM_SHOP_OFFERS, createLayoutAttack)
				isRunning = !0
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"ATTACK"})

				db.COMMANDS.forEach(function(cmd){
					if(cmd.params.data_escolhida < helper.gameTime()){
						removeCommand(cmd.id_command, "data_attack", timeoutIdAttack, tBody)
					} else {
						addCommand(cmd.params, cmd.id_command, "data_attack", timeoutIdAttack, tBody);
					}
				})
			})
		}, ["all_villages_ready"])
	}
	, stop = function (){
		Object.keys(timeoutIdAttack).map(function(key) {
			services.$timeout.cancel(timeoutIdAttack[key]);
			delete (timeoutIdAttack[key])
		});
		typeof(listener_layout) == "function" ? listener_layout(): null;
		interval_reload ? services.$timeout.cancel(interval_reload): null;
		listener_layout = undefined;
		interval_reload = undefined;
		isRunning = !1;
	}
	return	{
		init			: init,
		start			: start,
		stop 			: stop,
		isRunning		: function() {
			return isRunning
		},
		isInitialized	: function(){
			return isInitialized
		},
		version			: "1.0.0",
		name			: "attack"
	}

})
,
define("robotTW2/attack/ui", [
	"robotTW2/attack",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_alert",
	"helper/time",
	"robotTW2/conf"
	], function(
			attack,
			builderWindow,
			services,
			providers,
			data_alert,
			helper,
			conf
	){
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.ATTACK;
		var templateName = "attack";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
	}
	, injectScope = function(){
		var $scope = $window.$data.scope;
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);

		if (!$scope.$$phase) {
			$scope.$apply();
		}
	}

	Object.setPrototypeOf(attack, {
		build : function(){
			build(injectScope)
		}
	})

})
