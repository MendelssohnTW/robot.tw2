define("robotTW2/recruit", [
	"robotTW2/ready",
	"robotTW2/eventQueue",
	"robotTW2/data_recruit",
	"robotTW2/data_villages",
	"robotTW2/conf", 
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time"
	], function(
			ready,
			eventQueue,
			data_recruit,
			data_villages,
			conf, 
			services,
			providers,
			helper
	){

	var isInitialized = !1
	, isRunning = !1
	, isPaused = !1
	, data = data_recruit.getRecruit()
	, interval_recruit = null
	, listener_recruit = undefined
	, listener_group_updated = undefined
	, listener_group_created = undefined
	, listener_group_destroyed = undefined
	, listener_window_recruit = undefined
	, listener_resume = undefined
	, prices = undefined
	, data = data_recruit.getRecruit()
	, grupos = data.GROUPS
	, getUnitPrices = function (){
		var unitData = services.modelDataService.getGameData().getUnits();
		var prices = {};
		unitData.forEach(function(data){
			var array_price  = [];
			array_price.push(data.wood);
			array_price.push(data.clay);
			array_price.push(data.iron);
			array_price.push(data.food);
			prices[data.name] = array_price;
		});
		return prices;
	}
	, verificarGroups = function (){
		data = data_recruit.getRecruit()
		if (data.GROUPS == undefined) {
			grupos = {}
		} else {
			grupos = data.GROUPS
		}
		var dbGrp = function () {
			var db = {};
			db.Groups = grupos
			db.GroupsKeys = Object.keys(db.Groups);
			db.GroupsName = db.GroupsKeys.map(m => db.Groups[m].name);
			db.GroupsCount = db.GroupsKeys.length;
			return db;
		}
		, gameGrp = function () {
			var game = {};
			game.Groups = services.groupService.getGroups();
			game.GroupsKeys = Object.keys(game.Groups);
			game.GroupsName = game.GroupsKeys.map(m => game.Groups[m].name);
			game.GroupsCount = game.GroupsKeys.length;
			return game;
		}

		var grp = dbGrp();
		var gagrp = gameGrp();

		gagrp.GroupsKeys.forEach(function(id){
			if (!grp.Groups[id]){
				grp.Groups[id] = gagrp.Groups[id]; 
			}
		});

		data.GROUPS = grp.Groups
		data_recruit.setRecruit(data);
		grp = dbGrp();

		grp.GroupsKeys.forEach(function(id){
			if (!gagrp.Groups[id]){
				delete grp.Groups[id];
			}
		});

		data.GROUPS = grp.Groups
		data_recruit.setRecruit(data);

		return;
	}
	, getTotalUnitsAndResources = function (village_id, callback) { //busca as unidades da aldeia pelo ID
		return services.socketService.emit(providers.routeProvider.VILLAGE_UNIT_INFO, {village_id: village_id}, function (data) {
			if(!data){
				if(typeof(callback) == "function") {callback(null, null)} else {return}
			}
			var villageUnits = {};
			for (var unit in data.available_units) {
				villageUnits[unit] = data.available_units[unit].total;
			}
			for (var i = 0; i < data.queues.barracks.length;  i++ ) {
				villageUnits[data.queues.barracks[i].unit_type] += data.queues.barracks[i].amount;
			}
			services.socketService.emit(providers.routeProvider.VILLAGE_GET_VILLAGE, {village_id: village_id}, function (data) {
				if(typeof(callback) == "function") {callback(villageUnits, data.resources)} else {return}
			})
		});
	}
	, recruitSteps = function(village_id){
		data = data_recruit.getRecruit()
		getTotalUnitsAndResources(village_id, function (villageUnits, res) {
			if(villageUnits == null || res == null) {return}
			var listGroups = services.modelDataService.getGroupList().getVillageGroups(village_id)
			, copia_listGroups = []
			, copia_res = []
			, amount
			, requests = 0
			, requestsReadys = 0;
			angular.extend(copia_listGroups, listGroups);
			angular.extend(copia_res, res);

			var sort_units_unstabled = function (units, name){
				var lista = [];
				if (units != undefined){
					Object.keys(units).forEach(function(key){
						var ti = prices[key][0] + prices[key][1] + prices[key][2]
						if(units[key] > 0) {
							lista.push({[key] : units[key], "wood" : prices[key][0] * 100 / ti, "clay" : prices[key][1] * 100 / ti, "iron" : prices[key][2] * 100 / ti})
						}
					});
					lista.sort(function(a, b){
						return b[name] - a[name]}
					);
					lista.forEach(function(key){
						delete key.wood;
						delete key.clay;
						delete key.iron;
					})
					return lista;
				} else {
					return [];
				}
			}
			, sort_units_stabled = function (units, villageUnits){
				var lista = [];
				if (villageUnits != undefined){
					for (key in villageUnits){
						if (villageUnits.hasOwnProperty(key)) {
							if (villageUnits[key] == 0 || data.TROOPS_NOT.some(elem => elem == key)){
								delete villageUnits[key];
							}
						}
					}
					lista = Object.keys(villageUnits).sort(function(a, b){return villageUnits[a] - villageUnits[b]});

					var lis = [];
					for (key in lista){
						if (lista.hasOwnProperty(key)) {
							lis.push({[lista[key]]: villageUnits[lista[key]]});
						}
					}
					return lis;
				} else {
					return [];
				}
			}
			, sort_max = function (list_object){
				var food = list_object.food;
				delete list_object.food;
				var sorted_max = Object.keys(list_object).sort(function(a, b){return list_object[b] - list_object[a]});
				var list_sorted = [];
				var count = 0;
				Object.keys(list_object).forEach(function(){
					var max = sorted_max.shift();
					var max_value = list_object[max];
					list_sorted.push({[max] : max_value});
				})
				list_object.food = food;
				var lis = {};
				for (key in list_sorted){
					if (list_sorted.hasOwnProperty(key)) {
						lis[Object.keys(list_sorted[key])[0]] = list_sorted[key][Object.keys(list_sorted[key])[0]]
					}
				}
				return lis;
			}
			, recruitRequest = function (village_id, unit_type, amount, callback) {
				if (village_id && unit_type){
					services.socketService.emit(providers.routeProvider.BARRACKS_RECRUIT, {
						village_id: village_id, 
						unit_type: unit_type, 
						amount: amount
					});
				};
			}
			, groupLoop = function (villageUnits){
				if (copia_listGroups.length){
					var group = copia_listGroups.shift()
					, gr = grupos[group.id];
					if (gr && gr.units){
						var units = gr.units;
						var copia_res_sorted = sort_max(copia_res);
						var max = copia_res_sorted[Object.keys(copia_res_sorted)[0]];
						var mid = copia_res_sorted[Object.keys(copia_res_sorted)[1]];
						var min = copia_res_sorted[Object.keys(copia_res_sorted)[2]];
						var max_name = Object.keys(copia_res_sorted)[0];
						var taxa = mid / (max - min);
						var units_sorted = [];
						if (taxa > 1) {
							units_sorted = sort_units_unstabled(units, max_name);
						} else {
							units_sorted = sort_units_stabled(units, villageUnits);
						};
						var unitName
						, remaing
						, fully = false
						, unitsLoop = function (units_sorted){
							if (units_sorted.length){
								var unit = units_sorted.shift();
								unitName = Object.keys(unit)[0];
								var RESOURCE_TYPES = services.modelDataService.getGameData().getResourceTypes();
								var list = [];
								Object.keys(RESOURCE_TYPES).forEach(
										function(name){
											if (copia_res[RESOURCE_TYPES[name]] < data.RESERVA[name.toUpperCase()]){
												list.push(true);
											} else {
												list.push(false);
											}
										});

								if (list.every(f => f == true)) {
									unitsLoop(units_sorted);
									return;
								};
								amount = Math.floor(
										Math.min(
												(copia_res.wood - data.RESERVA.WOOD) / prices[unitName][0], 
												(copia_res.clay - data.RESERVA.CLAY) / prices[unitName][1], 
												(copia_res.iron - data.RESERVA.IRON) / prices[unitName][2], 
												(copia_res.food - data.RESERVA.FOOD) / prices[unitName][3]
										)
								)

								remaing = units[unitName] - villageUnits[unitName];
								if (remaing <= 0) {
									unitsLoop(units_sorted);
									return;
								};
								if (amount > remaing) {
									amount = remaing;
								} else {
									if (amount < 1) {
										unitsLoop(units_sorted);
										return;
									};
								};
								requests++;
								recruitRequest(village_id, unitName, amount, function (data) {
									if (++requestsReadys === requests) {
										groupLoop(villageUnits, copia_res)
										return;
									};
								});
							} else {
								groupLoop(villageUnits, copia_res);
								return;
							};
						};
						unitsLoop(units_sorted);
					} else {
						groupLoop(villageUnits);
						return;
					};
				};
			};
			groupLoop(villageUnits);
			return;
		});
	}
	, prices = getUnitPrices()
	, villages = data_villages.getVillages()
	, wait = function(){
		data = data_recruit.getRecruit();
		if(!interval_recruit){
			interval_recruit = services.$timeout(recruit, data.INTERVAL)
		} else {
			services.$timeout.cancel(interval_recruit);
			interval_recruit = services.$timeout(recruit, data.INTERVAL)
		}
		$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_RECRUIT)
	}
	, list = [conf.INTERVAL.RECRUIT]
	, recruit = function(){
		var reqD = 0
		, respD = 0;

		data = data_recruit.getRecruit();
		if(isPaused){
			listener_resume = $rootScope.$on(providers.eventTypeProvider.RESUME_CHANGE_RECRUIT, function(){
				recruit()
				listener_resume()
				listener_resume = undefined;
				return
			})
		}
		Object.keys(villages).map(function(village_id){
			reqD++
			services.$timeout(function(){
				var village = services.modelDataService.getSelectedCharacter().getVillage(village_id);
				var tam = village.getRecruitingQueue("barracks").length || 0;
				respD++
				if (tam < data.RESERVA.SLOTS || tam < 1){
					recruitSteps(village_id);
				} else {
					var timer = village.getRecruitingQueue("barracks").jobs[tam-1].data.time_completed * 1000;
					var dif = timer - helper.gameTime(); 
					if (dif < data.INTERVAL){
						list.push(dif);
					}
				}
				if(reqD == respD){
					if (list.length > 0){
						data.INTERVAL = Math.min.apply(null, list);
						data.INTERVAL == 0 ? data.INTERVAL = conf.h : data.INTERVAL;
						data_recruit.setRecruit(data)
						list = [conf.INTERVAL.RECRUIT];
					}

					wait();			
				}
			}, reqD * 3000)
		})

	}
	, init = function (){
		isInitialized = !0
		start();
	}
	, start = function (){
		villages = data_villages.getVillages();
		verificarGroups();
		listener_recruit = $rootScope.$on(providers.eventTypeProvider.UNIT_RECRUIT_JOB_FINISHED, recruit)
		listener_group_updated = $rootScope.$on(providers.eventTypeProvider.GROUPS_UPDATED, verificarGroups)
		listener_group_created = $rootScope.$on(providers.eventTypeProvider.GROUPS_CREATED, verificarGroups)
		listener_group_destroyed = $rootScope.$on(providers.eventTypeProvider.GROUPS_DESTROYED, verificarGroups)
		isRunning = !0;
		$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
		wait();
		ready(recruit, ["all_villages_ready"])
	}
	, stop = function (){
		typeof(listener_recruit) == "function" ? listener_recruit(): null;
		typeof(listener_group_updated) == "function" ? listener_group_updated(): null;
		typeof(listener_group_created) == "function" ? listener_group_created(): null;
		typeof(listener_group_destroyed) == "function" ? listener_group_destroyed(): null;
		listener_recruit = undefined;
		listener_group_updated = undefined;
		listener_group_created = undefined;
		listener_group_destroyed = undefined;
		isRunning = !1
		$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
		services.$timeout.cancel(listener_recruit);
		services.$timeout.cancel(listener_window_recruit);
	}
	, pause = function (){
		isPaused = !0
		$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
	}
	, resume = function (){
		isPaused = !1
		$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
		$rootScope.$broadcast(providers.eventTypeProvider.RESUME_CHANGE_RECRUIT)
	}

	return	{
		init			: init,
		start 			: start,
		stop 			: stop,
		pause 			: pause,
		resume 			: resume,
		isRunning		: function() {
			return isRunning
		},
		isPaused		: function() {
			return isPaused
		},
		isInitialized	: function(){
			return isInitialized
		},
		version			: "1.0.0",
		name			: "recruit"
	}

})
,
define("robotTW2/recruit/ui", [
	"robotTW2/recruit",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_recruit",
	"robotTW2/data_main",
	"helper/time",
	"robotTW2/conf",
	"conf/unitTypes"
	], function(
			recruit,
			builderWindow,
			services,
			providers,
			data_recruit,
			data_main,
			helper,
			conf,
			unitTypes
	){
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.RECRUIT;
		var templateName = "recruit";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
	}
	, injectScope = function(){

		function return_units(unitTypes){
			var units = {};
			Object.keys(unitTypes).map(function(key){
				if(data.TROOPS_NOT.some(elem => elem == unitTypes[key])){
					delete units[unitTypes[key]]
				}
			})
			return units
		}

		var $scope = $window.$data.scope;
		$($window.$data.rootnode)[0].setAttribute("style", "width:850px;");
		$scope.title = services.$filter("i18n")("title", $rootScope.loc.ale, "recruit");
		$scope.settings = services.$filter("i18n")("settings", $rootScope.loc.ale, "recruit");
		$scope.recruit_running = services.$filter("i18n")("recruit_running", $rootScope.loc.ale, "recruit");
		$scope.text_interval_recruit = services.$filter("i18n")("text_interval_recruit", $rootScope.loc.ale, "recruit");
		$scope.text_reserva_food = services.$filter("i18n")("text_reserva_food", $rootScope.loc.ale, "recruit");
		$scope.text_reserva_slots = services.$filter("i18n")("text_reserva_slots", $rootScope.loc.ale, "recruit");
		$scope.text_reserva_wood = services.$filter("i18n")("text_reserva_wood", $rootScope.loc.ale, "recruit");
		$scope.text_reserva_clay = services.$filter("i18n")("text_reserva_clay", $rootScope.loc.ale, "recruit");
		$scope.text_reserva_iron = services.$filter("i18n")("text_reserva_iron", $rootScope.loc.ale, "recruit");
		$scope.groups_selection = services.$filter("i18n")("groups_selection", $rootScope.loc.ale, "recruit");
		$scope.unit_settings = services.$filter("i18n")("unit_settings", $rootScope.loc.ale, "recruit");
		$scope.save = services.$filter("i18n")("SAVE", $rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.start = services.$filter("i18n")("START", $rootScope.loc.ale);
		$scope.pause = services.$filter("i18n")("PAUSE", $rootScope.loc.ale);
		$scope.resume = services.$filter("i18n")("RESUME", $rootScope.loc.ale);
		$scope.stop = services.$filter("i18n")("STOP", $rootScope.loc.ale);

		$scope.data_recruit = data_recruit.getRecruit();
		$scope.grupo = $scope.data_recruit.GROUPS[Object.keys($scope.data_recruit.GROUPS)[0]]

		$window.$data.ativate = $scope.data_recruit.ATIVATE;
		$scope.isRunning = recruit.isRunning();
		$scope.paused = recruit.isPaused();

		$scope.interval_recruit = helper.readableMilliseconds(data_recruit.getTimeCicle())

		$scope.onchangeGroup = function (gr){
			$scope.grupo = gr;
			if(!$scope.grupo.units){
				$scope.grupo.units = return_units(unitTypes);
			}
			if (!$scope.$$phase) {$scope.$apply()}
		}

		$scope.getText = function(key){
			return services.$filter("i18n")("text_" + key, $rootScope.loc.ale, "recruit");
		}

		$scope.getClass = function(key){
			return "icon-20x20-unit-" + key;
		}

		$rootScope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_RECRUIT, function() {
			$scope.interval_recruit = helper.readableMilliseconds(data_recruit.getTimeCicle())
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})

		$scope.start_recruit = function(){
			recruit.start();
			$scope.isRunning = recruit.isRunning();
		}

		$scope.stop_recruit = function(){
			recruit.stop();
			$scope.isRunning = recruit.isRunning();
		}

		$scope.pause_recruit = function(){
			recruit.pause();
			$scope.paused = !0;
		}
		$scope.resume_recruit = function(){
			recruit.resume();
			$scope.paused = !1;
		}

		$scope.save_recruit = function(){
			Object.keys($scope.data_recruit.GROUPS).map(m => $scope.data_recruit.GROUPS[m]).find(f => f.id == $scope.grupo.id).units = $scope.grupo.units
			data_recruit.setRecruit($scope.data_recruit);
		}

		if (!$scope.$$phase) {
			$scope.$apply();
		}

		services.$timeout(function(){
			$scope.onchangeGroup($scope.grupo)
			$window.setCollapse();
			$window.recalcScrollbar();
			$(".win-foot .btn-orange").forEach(function(d){
				d.setAttribute("style", "min-width:80px")
			})
		}, 500)
	}

	Object.setPrototypeOf(recruit, {
		build : function(){
			build(injectScope)
		}
	})

})