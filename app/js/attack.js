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
	, sendCommandAttack = function(scope){
		var enviarFull = false;
		if (($("#check-button").attr("class")[0].split(' ').some(s => s === 'icon-26x26-dot-green'))){
			enviarFull = true;
		}
		var army = {
				'units': scope.unitsToSend,
				'officers': {}
		}
		for (officerName in scope.officers) {
			if (scope.officers.hasOwnProperty(officerName)) {
				if (scope.officers[officerName].checked === true) {
					army.officers[officerName] = true;
				}
			}
		}
		var durationInSeconds = services.armyService.getTravelTimeForDistance(army, scope.properties.travelTime, scope.distance, scope.activeTab, true);
		if (!scope.armyEmpty && enviarFull){
			durationInSeconds = 0;
		};
		if (scope.armyEmpty && !enviarFull){
			notify("unity_select");
		} else {
			var get_data = $("input#input-text1.input-border.input-created").val();
			var get_time = $("input#input-text2.input-border.input-created").val();
			var get_ms = $("input#input-text3.input-border.input-created").val();
			if (get_time.length <= 5){
				get_time = get_time + ":00"; 
			}
			if (get_data != undefined || get_time != undefined){
				var milisegundos_duracao = durationInSeconds * 1000;
				var tempo_escolhido = new Date(get_data + " " + get_time + "." + get_ms).getTime();
				var tempo_atual = new Date(new Date(gameTime()).getFullYear(),new Date(gameTime()).getMonth(),new Date(gameTime()).getDate(), new Date(gameTime()).getHours(), new Date(gameTime()).getMinutes(), new Date(gameTime()).getSeconds()).getTime();
				if (tempo_escolhido > (tempo_atual + milisegundos_duracao)){
					addCommandAttack(tempo_escolhido, milisegundos_duracao, enviarFull);
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
						removeCommand(cmd.id_command, "data_attack", timeoutIdAttack, upDateTbodyAttack)
					} else {
						addCommand(cmd.params, cmd.id_command, "data_attack", timeoutIdAttack, upDateTbodyAttack);
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
		interval_reload ? $timeout.cancel(interval_reload): null;
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

	}

	Object.setPrototypeOf(attack, {
		build : function(){
			build(injectScope)
		}
	})

})
