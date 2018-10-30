define("robotTW2/services/RecruitService", [
	"robotTW2"
	], function(
			robotTW2
	){
	return (function RecruitService() {

		var isInitialized = !1
		, isRunning = !1
		, isPaused = !1
		, interval_recruit = null
		, listener_recruit = undefined
		, listener_group_updated = undefined
		, listener_group_created = undefined
		, listener_group_destroyed = undefined
		, listener_window_recruit = undefined
		, listener_resume = undefined
		, list = []
		, prices = undefined
		, data_recruit = robotTW2.databases.data_recruit
		, db = data_recruit.get()
		, data_villages = robotTW2.databases.data_villages
		, db_villages = data_villages.get()
		, grupos = db.groups
		, getUnitPrices = function (){
			var unitData = robotTW2.services.modelDataService.getGameData().getUnits();
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
			if (db.groups == undefined) {
				grupos = {}
			} else {
				grupos = db.groups
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
				game.Groups = robotTW2.services.groupService.getGroups();
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

			var dt = data_recruit.getRecruit()
			dt.groups = grp.Groups
			data_recruit.set(dt);
			grp = dbGrp();

			grp.GroupsKeys.forEach(function(id){
				if (!gagrp.Groups[id]){
					delete grp.Groups[id];
				}
			});

			dt.groups = grp.Groups
			data_recruit.set(dt);

			return;
		}
		, getTotalUnitsAndResources = function (village_id, callback) { //busca as unidades da aldeia pelo ID
			return robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.VILLAGE_UNIT_INFO, {village_id: village_id}, function (data) {
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
				robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.VILLAGE_GET_VILLAGE, {village_id: village_id}, function (data) {
					if(typeof(callback) == "function") {callback(villageUnits, data.resources)} else {return}
				})
			});
		}
		, recruitSteps = function(village_id){
			data = data_recruit.getRecruit()
			getTotalUnitsAndResources(village_id, function (villageUnits, res) {
				if(villageUnits == null || res == null) {return}
				var listGroups = robotTW2.services.modelDataService.getGroupList().getVillageGroups(village_id)
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
								if (villageUnits[key] == 0 || db.troops_not.some(elem => elem == key)){
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
						robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.BARRACKS_RECRUIT, {
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
									var RESOURCE_TYPES = robotTW2.services.modelDataService.getGameData().getResourceTypes();
									var ltz = [];
									Object.keys(RESOURCE_TYPES).forEach(
											function(name){
												if (copia_res[RESOURCE_TYPES[name]] < db.reserva[name.toUpperCase()]){
													ltz.push(true);
												} else {
													ltz.push(false);
												}
											});

									if (ltz.every(f => f == true)) {
										unitsLoop(units_sorted);
										return;
									};
									amount = Math.floor(
											Math.min(
													(copia_res.wood - db.reserva.wood) / prices[unitName][0], 
													(copia_res.clay - db.reserva.clay) / prices[unitName][1], 
													(copia_res.iron - db.reserva.iron) / prices[unitName][2], 
													(copia_res.food - db.reserva.food) / prices[unitName][3]
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
		, villages = db_villages.getVillages()
		, wait = function(){
			setList();
			if(!interval_recruit){
				interval_recruit = robotTW2.services.$timeout(recruit, data_recruit.getTimeCicle())
			} else {
				robotTW2.services.$timeout.cancel(interval_recruit);
				interval_recruit = robotTW2.services.$timeout(recruit, data_recruit.getTimeCicle())
			}
		}
		, getFinishedForFree = function (village, lt){
			var job = village.getRecruitingQueue("barracks").jobs[0];
			if(job){
				var timer = job.data.time_completed * 1000;
				var dif = timer - helper.gameTime(); 
				if (dif < data_recruit.getTimeCicle()){
					dif < 0 ? dif = 0 : dif;
					lt.push(dif);
				}
			}
			return lt
		}
		, setList = function(){
			list.push(conf.INTERVAL.RECRUIT)
			list.push(data_recruit.getTimeCicle())
			var t = Math.min.apply(null, list);
			data_recruit.setTimeCicle(t)
			data_recruit.setTimeComplete(helper.gameTime() + t)
			list = [];
			$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.INTERVAL_CHANGE_RECRUIT)
		}
		, recruit = function(){
			var reqD = 0
			, respD = 0;

			data = data_recruit.getRecruit();

			if(isPaused){
				listener_resume = $rootScope.$on(robotTW2.providers.eventTypeProvider.RESUME_CHANGE_RECRUIT, function(){
					recruit()
					listener_resume()
					listener_resume = undefined;
					return
				})
			}
			Object.keys(villages).map(function(village_id){

				reqD++
				robotTW2.services.$timeout(function(){
					var village = robotTW2.services.modelDataService.getSelectedCharacter().getVillage(village_id);
					var tam = village.getRecruitingQueue("barracks").length || 0;
					list = getFinishedForFree(village, list)
					respD++
					setList();
					if (tam < db.reserva.slots || tam < 1){
						recruitSteps(village_id);
					}
					if(reqD == respD){
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
			if(isRunning){return}
			robotTW2.ready(function(){
				villages = db_villages.getVillages();
				verificarGroups();
				db.interval = conf.INTERVAL.RECRUIT;
				data_recruit.set(db);
				listener_recruit = $rootScope.$on(robotTW2.providers.eventTypeProvider.UNIT_RECRUIT_JOB_FINISHED, recruit)
				listener_group_updated = $rootScope.$on(robotTW2.providers.eventTypeProvider.GROUPS_UPDATED, verificarGroups)
				listener_group_created = $rootScope.$on(robotTW2.providers.eventTypeProvider.GROUPS_CREATED, verificarGroups)
				listener_group_destroyed = $rootScope.$on(robotTW2.providers.eventTypeProvider.GROUPS_DESTROYED, verificarGroups)
				isRunning = !0;
				$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
				wait();
				recruit()
			}, ["all_villages_ready"])
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
			$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
			robotTW2.services.$timeout.cancel(listener_recruit);
			robotTW2.services.$timeout.cancel(listener_window_recruit);
		}
		, pause = function (){
			isPaused = !0
			$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
		}
		, resume = function (){
			isPaused = !1
			$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
			$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.RESUME_CHANGE_RECRUIT)
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

	})()
})