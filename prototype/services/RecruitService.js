define("robotTW2/services/RecruitService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/time",
	"robotTW2/conf",
	"robotTW2/databases/data_log",
	"robotTW2/databases/data_recruit",
	], function(
			robotTW2,
			version,
			time,
			conf,
			data_log,
			data_recruit
	){
	return (function FarmService(
			$rootScope,
			socketService,
			providers,
			groupService,
			modelDataService,
			$timeout,
			$filter,
			ready
	) {
		var isInitialized = !1
		, isRunning = !1
		, isPaused = !1
		, promise_UnitsAndResources = undefined 
		, queue_UnitsAndResources = []
		, promise_recruitRequest = undefined 
		, queue_recruitRequest = []
		, interval_recruit = null
		, interval_cicle = null
		, listener_recruit = undefined
		, listener_group_updated = undefined
		, listener_group_created = undefined
		, listener_group_destroyed = undefined
		, list = []
		, prices = (function (){
			var unitData = modelDataService.getGameData().getUnits();
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
		})()
		, verificarGroups = function (){
			var game = {}
			game.Groups = groupService.getGroups();
			game.GroupsKeys = Object.keys(game.Groups);
			game.GroupsName = game.GroupsKeys.map(m => game.Groups[m].name);
			game.GroupsCount = game.GroupsKeys.length;

			game.GroupsKeys.forEach(function(id){
				if (!data_recruit.Groups[id]){
					data_recruit.Groups[id] = game.Groups[id]; 
				}
			});

			data_recruit.GroupsKeys.forEach(function(id){
				if (!game.Groups[id]){
					delete data_recruit.Groups[id];
				}
			});

			data_recruit.set();

			return;
		}
		, recruitSteps = function(list_recruit){
			if(!list_recruit.length){return}
			list_recruit.forEach(function(village_id){
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
								if (villageUnits[key] == 0 || data_recruit.troops_not.some(elem => elem == key)){
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
				, sec_groups = function (resp){
					var listGroups = modelDataService.getGroupList().getVillageGroups(resp.data.village_id)
					, amount
					, requests = 0
					, requestsReadys = 0
					, copia_listGroups = angular.extend({}, listGroups)
					, copia_res = angular.extend({}, resp.data.resources)
					, villageUnits = resp.data.villageUnits
					, keys_listGroups = Object.keys(copia_listGroups)
					, village_id = resp.data.village_id;

					var groupLoop = function (){
						if(keys_listGroups.length){
							var key = keys_listGroups.shift()
							, group = copia_listGroups[key]
							, gr = data_recruit.Groups[group.id]

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
								var unit_type
								, remaing
								, fully = false
								, unitsLoop = function (){
									if (units_sorted.length){
										var unit = units_sorted.shift();
										unit_type = Object.keys(unit)[0];
										var RESOURCE_TYPES = modelDataService.getGameData().getResourceTypes();
										var ltz = [];
										Object.keys(RESOURCE_TYPES).forEach(
												function(name){
													if (copia_res[RESOURCE_TYPES[name]] < data_recruit.reserva[name.toLowerCase()]){
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
														(copia_res.wood - data_recruit.reserva.wood) / prices[unit_type][0], 
														(copia_res.clay - data_recruit.reserva.clay) / prices[unit_type][1], 
														(copia_res.iron - data_recruit.reserva.iron) / prices[unit_type][2], 
														(copia_res.food - data_recruit.reserva.food) / prices[unit_type][3]
												) * 0.9
										)

										remaing = units[unit_type] - villageUnits[unit_type];
										if (remaing <= 0) {
											unitsLoop();
											return;
										};
										if (amount > remaing) {
											amount = remaing;
										} else {
											if (amount < 1) {
												unitsLoop();
												return;
											};
										};

										var data_rec = {
												"village_id": village_id,
												"unit_type": unit_type,
												"amount": amount
										}

										var recruit_promise = function(data_rec){
											if(!promise_recruitRequest){
												promise_recruitRequest = new Promise(function(res, rej){
													if (village_id && unit_type){
														data_log.recruit.push({"text":$filter("i18n")("recruit", $rootScope.loc.ale, "recruit") + " - village_id " + village_id + " / unit_type " + unit_type, "date": (new Date(time.convertedTime())).toString()})
														socketService.emit(providers.routeProvider.BARRACKS_RECRUIT, data_rec, function(){
															res()
														});
													};
												}). then(function(data){
													groupLoop()
													promise_recruitRequest = undefined
													if(queue_recruitRequest.length){
														data_rec = queue_recruitRequest.shift()
														recruit_promise(data_rec)
													} else {
														data_log.recruit.push({"text":$filter("i18n")("terminate_cicles", $rootScope.loc.ale, "recruit"), "date": (new Date(time.convertedTime())).toString()})
													}
												})
											} else {
												queue_recruitRequest.push(data_rec);
											}
										}

										recruit_promise(data_rec)

									} else {
										groupLoop();
										return;
									};
								};
								unitsLoop();
							} else {
								groupLoop();
								return;
							};
						}
					};
					groupLoop();

				}
				, sec_promise = function (village_id){
					if(!promise_UnitsAndResources){
						promise_UnitsAndResources = new Promise(function(res, rej){
							socketService.emit(providers.routeProvider.VILLAGE_UNIT_INFO, {village_id: village_id}, function (data) {
								var unit, i;
								if(!data){
									rej()
								}
								if(data.error_code){
									rej(data)
								}
								var villageUnits = {};
								for (unit in data.available_units) {
									villageUnits[unit] = data.available_units[unit].total;
								}
								for (i = 0; i < data.queues.barracks.length;  i++ ) {
									villageUnits[data.queues.barracks[i].unit_type] += data.queues.barracks[i].amount;
								}
								socketService.emit(providers.routeProvider.VILLAGE_GET_VILLAGE, {village_id: village_id}, function (data) {
									if(villageUnits == null || res == null) {rej()}
									res({
										"data": {
											"village_id": village_id,
											"villageUnits": villageUnits, 
											"resources": data.resources
										}
									})
								})
							});
						})
						.then(function(data){
							sec_groups(data)
							promise_UnitsAndResources = undefined
							if(queue_UnitsAndResources.length){
								village_id = queue_UnitsAndResources.shift()
								sec_promise(village_id)
							}

						}, function(data){
							promise_UnitsAndResources = undefined
							$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: data.message});
							if(queue_UnitsAndResources.length){
								village_id = queue_UnitsAndResources.shift()
								sec_promise(village_id)
							}
						})
					} else {
						queue_UnitsAndResources.push(village_id);
					}
				}

				sec_promise(village_id)

			})
		}
		, wait = function(){
			setList(function(tm){
				if(!interval_recruit){
					interval_recruit = $timeout(function(){recruit()}, tm)
				} else {
					$timeout.cancel(interval_recruit);
					interval_recruit = $timeout(function(){recruit()}, tm)
				}
			});
		}
		, getFinishedForFree = function (village){
			var lt = [];
			var job = village.getRecruitingQueue("barracks").jobs[0];
			if(job){
				var timer = job.data.completed * 1000;
				var dif = timer - time.convertedTime();
				dif < conf.MIN_INTERVAL ? dif = conf.MIN_INTERVAL : dif;
				lt.push(dif);
				lt.push(data_recruit.interval);
			}
			var t = data_recruit.interval > 0 ? data_recruit.interval : data_recruit.interval = conf.INTERVAL.RECRUIT;
			if(lt.length){
				t = Math.min.apply(null, lt);
			}
			return t || 0;
		}
		, setList = function(callback){
			list.push(conf.INTERVAL.RECRUIT)
			data_recruit.interval < conf.MIN_INTERVAL ? list.push(conf.MIN_INTERVAL) : list.push(data_recruit.interval)
					var t = Math.min.apply(null, list);
			data_recruit.interval = t
			data_recruit.complete = time.convertedTime() + t
			list = [];
			data_recruit.set();
			$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_RECRUIT)
			if(callback && typeof(callback) == "function"){callback(t)}
		}
		, recruit = function(){
			data_log.recruit.push({"text":$filter("i18n")("init_cicles", $rootScope.loc.ale, "recruit"), "date": (new Date(time.convertedTime())).toString()})
			var vls = modelDataService.getSelectedCharacter().getVillageList();
			vls = Object.keys(vls).map(function(elem){
				let tam = vls[elem].getRecruitingQueue("barracks").length || 0;
				let gt = getFinishedForFree(elem);
				if(gt != Infinity && gt != 0 && !isNaN(gt)){
					list.push(getFinishedForFree(elem))
				}
				if(data_villages.villages[vls[elem].data.villageId].recruit_activate && tam < data_recruit.reserva.slots || tam < 1){
					return vls[elem].data.villageId
				}
			}).filter(f=>f!=undefined)
			
			setList();

			recruitSteps(vls)
		}
		, init = function (bool) {
			isInitialized = !0
			if(bool){return}
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				interval_cicle = setInterval(recruit, 60 * 60 * 1000)
				verificarGroups();
				listener_recruit = $rootScope.$on(providers.eventTypeProvider.UNIT_RECRUIT_JOB_FINISHED, recruit)
				listener_group_updated = $rootScope.$on(providers.eventTypeProvider.GROUPS_UPDATED, verificarGroups)
				listener_group_created = $rootScope.$on(providers.eventTypeProvider.GROUPS_CREATED, verificarGroups)
				listener_group_destroyed = $rootScope.$on(providers.eventTypeProvider.GROUPS_DESTROYED, verificarGroups)
				isRunning = !0;
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
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
			promise_UnitsAndResources = undefined 
			queue_UnitsAndResources = []
			promise_recruitRequest = undefined 
			queue_recruitRequest = []
			isRunning = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECRUIT"})
			$timeout.cancel(listener_recruit);
			interval_recruit = null
			interval_cicle = null
			list = []

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
			version			: version.recruit,
			name			: "recruit"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.groupService,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.ready
	)
})
