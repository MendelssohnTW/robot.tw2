define("robotTW2/attack", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_villages",
	"robotTW2/data_attack",
	"robotTW2/data_main",
	"robotTW2/loadController",
	"robotTW2/notify",
	"robotTW2/ready",
	"helper/time",
	"robotTW2/templates",
	"robotTW2/conf",
	"robotTW2/listener",
	"robotTW2/commandQueueAttack"
	], function(
			services,
			providers,
			data_villages,
			data_attack,
			data_main,
			loadController,
			notify,
			ready,
			helper,
			templates,
			conf,
			listener,
			commandQueueAttack
	){
	var isInitialized = !1
	, isRunning = !1
	, scope = {}
	, listener_layout = undefined
	, interval_reload = undefined
	, listener_change = undefined
	, timeoutIdAttack = {}
	, that = this
	, promiseReSendAttack
	, queueReSendAttack = []
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
	, resendAttack = function(params){
		var id_command = params.id_command
		var expires_send = params.data_escolhida - params.duration;
		var timer_delay_send = expires_send - helper.gameTime() - data_main.getMain().TIME_CORRECTION_COMMAND;
		if(timer_delay_send > 0){
			return services.$timeout(function(){
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
						commandQueueAttack.unbind(id_command, true, true)
					}
				})}
				if (promiseReSendAttack) {
					queueReSendAttack.push(arguments);
					return;
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
						}
				)

			}, timer_delay_send)
		} else {
			commandQueueAttack.unbind(id_command, true, true)
			console.log("Comando da aldeia " + services.modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(helper.gameTime()) + " com tempo do servidor, devido vencimento de limite de delay");
			return null
		}

	}
	, sendAttack = function(params){
		var id_command = params.id_command
		, timer_delay = params.timer_delay;

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
				commandQueueAttack.unbind(id_command, true, true)
				console.log("Comando da aldeia " + services.modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(helper.gameTime()) + " com tempo do servidor, pois não, possui tropas");
			}
			$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS)

		}, params.timer_delay - conf.TIME_DELAY_UPDATE)

		return promiseSendAttack
	}
	, addAttack = function(params, opt_id){
		if(!params){return}
		var id_command = (Math.round(helper.gameTime() / 1e9)).toString() + params.data_escolhida.toString();
		if(opt_id){
			id_command = params.id_command
		}
		commandQueueAttack.bind(id_command, sendAttack)

		var expires = params.data_escolhida - params.duration;
		var timer_delay = expires - helper.gameTime() - data_main.getMain().TIME_CORRECTION_COMMAND;
		params["id_command"] = id_command
		params["timer_delay"] = timer_delay

		if(timer_delay > 0){
			commandQueueAttack.trigger(id_command, params, true)
		} else {
			commandQueueAttack.unbind(id_command, true, true)
			console.log("Comando da aldeia " + services. modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(helper.gameTime()) + " com tempo do servidor, devido vencimento de limite de delay");
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

				var command_sent = function ($event, data){
					if(!data){
						return;
					}
					if(data.direction =="forward" && data.origin.id == vl && duration){
						var main = data_main.getMain();
						var t = data.time_completed * 1000 - duration * 1000 - gTime;
						if(!main.MAX_TIME_CORRECTION || (t > -main.MAX_TIME_CORRECTION && t < main.MAX_TIME_CORRECTION)) {
							main.TIME_CORRECTION_COMMAND = t
							data_main.setMain(main);
							$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_TIME_CORRECTION)
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
						listener_completed = $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, function ($event, data){
							if(!data){
								return;
							}
							if(data.direction =="forward" && data.origin.id == vl && duration){
								var main = data_main.getMain();
								var t = data.time_completed * 1000 - duration * 1000 - gTime;
								if(!main.MAX_TIME_CORRECTION || (t > -main.MAX_TIME_CORRECTION && t < main.MAX_TIME_CORRECTION)) {
									main.TIME_CORRECTION_COMMAND = t
									data_main.setMain(main);
									$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_TIME_CORRECTION)
								}

								services.socketService.emit(providers.routeProvider.COMMAND_CANCEL, {
									command_id: data.command_id
								})
								listener_completed();
								listener_completed = undefined;
								callback();
							}
						})
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
					}, 1000);
				})
			} else {
				callback()
			}
		}
		nx()
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
				$scope.text_check = services.$filter("i18n")("text_check", $rootScope.loc.ale, "attack");
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
			var scp = loadController("ModalCustomArmyController");
			if(!scp){return}
			services.$compile(template)(scp)
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
				listener_change = $rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"ATTACK"})
				isRunning = !0
				Object.values(db.COMMANDS).forEach(function(param){
					if(param.data_escolhida < helper.gameTime()){
						//removeCommandAttack(param.id_command)
						commandQueueAttack.unbind(param.id_command, true, true)
					} else {
						addAttack(param, true);
					}
				})
			})
		}, ["all_villages_ready"])
	}
	, stop = function (){
		commandQueueAttack.unbindAll()
		typeof(listener_layout) == "function" ? listener_layout(): null;
		typeof(listener_change) == "function" ? listener_change(): null;
		interval_reload ? services.$timeout.cancel(interval_reload): null;
		listener_layout = undefined;
		listener_change = undefined;
		interval_reload = undefined;
		isRunning = !1;
	}
	return	{
		init				: init,
		start				: start,
		stop 				: stop,
		removeCommandAttack	: function(id_command){
			commandQueueAttack.unbind(id_command, true, true)
		},
		removeAll			: function(id_command){
			commandQueueAttack.unbindAll(true)
		},
		isRunning			: function() {
			return isRunning
		},
		isInitialized		: function(){
			return isInitialized
		},
		version				: "1.0.0",
		name				: "attack"
	}

})
,
define("robotTW2/attack/ui", [
	"robotTW2/attack",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_attack",
	"helper/time",
	"robotTW2/conf"
	], function(
			attack,
			builderWindow,
			services,
			providers,
			data_attack,
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
		$($window.$data.rootnode).addClass("fullsize")
		var $scope = $window.$data.scope;
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.clear = services.$filter("i18n")("CLEAR", $rootScope.loc.ale);
		$scope.title = services.$filter("i18n")("title", $rootScope.loc.ale, "attack");
		$scope.command_list = services.$filter("i18n")("command_list", $rootScope.loc.ale, "attack");
		$scope.ident_cmd = services.$filter("i18n")("ident_cmd", $rootScope.loc.ale, "attack");
		$scope.exclude_button = services.$filter("i18n")("exclude_button", $rootScope.loc.ale, "attack");

		$scope.data_attack = data_attack.getAttack();
		$scope.comandos = $scope.data_attack.COMMANDS;

		$scope.getVstart = function(param){
			var vid = param.start_village;
			if(!vid){return}
			return services.modelDataService.getSelectedCharacter().getVillage(vid).data.name
		}

		$scope.getVcoordStart = function(param){

			var vid = param.start_village;
			if(!vid){return}
			var x = services.modelDataService.getSelectedCharacter().getVillage(vid).data.x
			var y = services.modelDataService.getSelectedCharacter().getVillage(vid).data.y
			return "(" + x + "/" + y + ")"
		}

		$scope.getClass = function(type){
			var className = "";
			switch (type) {
			case "support": {
				className = "icon-26x26-support";
				break;
			}
			case "attack": {
				className = "icon-26x26-attack-red";
				break;
			}
			case "relocate": {
				className = "icon-26x26-relocate";
				break;
			}
			}
			return className
		}

		$scope.getHoraSend = function(param){

			return services.$filter("date")(new Date(param.data_escolhida - param.duration), "HH:mm:ss.sss");
		}

		$scope.getHoraAlvo = function(param){

			return services.$filter("date")(new Date(param.data_escolhida), "HH:mm:ss.sss");
		}

		$scope.getDataAlvo = function(param){

			return services.$filter("date")(new Date(param.data_escolhida), "dd/MM/yyyy");
		}

		$scope.getTimeRest = function(param){
			var difTime = param.data_escolhida - helper.gameTime() - param.duration; 
			return helper.readableMilliseconds(difTime)
		}

		$scope.getVcoordTarget = function(param){

			return "(" + param.target_x + "/" + param.target_y + ")"
		}

		$scope.clear_attack = function(){
			attack.removeAll();
		}

		$scope.removeCommand = attack.removeCommandAttack;

		$rootScope.$on(providers.eventTypeProvider.CHANGE_COMMANDS, function() {
			$scope.data_attack = data_attack.getAttack();
			$scope.comandos = $scope.data_attack.COMMANDS;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})

		if (!$scope.$$phase) {
			$scope.$apply();
		}

		services.$timeout(function(){
			$window.setCollapse();
			$window.recalcScrollbar();
		}, 500)
	}

	Object.setPrototypeOf(attack, {
		build : function(){
			build(injectScope)
		}
	})

})
