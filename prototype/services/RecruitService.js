define("robotTW2/services/RecruitService", [
	"robotTW2",
	"robotTW2/time",
	"robotTW2/conf",
	"robotTW2/databases/data_log",
	"robotTW2/databases/data_recruit",
	"robotTW2/databases/data_villages"
	], function(
			robotTW2,
			time,
			conf,
			data_log,
			data_recruit,
			data_villages
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
				var sort_max = function (obj){
					return Object.values(Object.keys(obj).sort(function(a, b){return obj[b] - obj[a]})).map(function(res){
						return {[res]: obj[res]}
					}).filter(f=>f!=undefined)
				}
				, sec_groups = function (data){
					var listGroups = modelDataService.getGroupList().getVillageGroups(data.village_id)
					, amount
					, requests = 0
					, requestsReadys = 0
					, copia_listGroups = angular.extend({}, listGroups)
					, copia_res = angular.extend({}, data.resources)
					, villageUnits = data.villageUnits
					, keys_listGroups = Object.keys(copia_listGroups)
					, village_id = data.village_id;

					var RESOURCE_TYPES = modelDataService.getGameData().getResourceTypes()
					, ltz = [];
					Object.keys(RESOURCE_TYPES).forEach(
							function(name){
								if (copia_res[RESOURCE_TYPES[name]] < data_recruit.reserva[name.toLowerCase()]){
									ltz.push(true);
								} else {
									ltz.push(false);
								}
							});

					if (ltz.some(f => f == true)) {
						console.log("limite de recursos")
						return;
					};

					let grs_units = {}
					modelDataService.getGroupList().getVillageGroups(village_id).map(function(gr){
						if(!data_recruit.Groups[gr.id]){return}
						if(Object.values(data_recruit.Groups[gr.id].units).some(f=>f>0)){
							Object.keys(data_recruit.Groups[gr.id].units).map(function(gt){
								if(data_recruit.Groups[gr.id].units[gt] > 0){
									return grs_units[gt] = data_recruit.Groups[gr.id].units[gt]
								}
							})
							return
						}
					})

					let gf_units = {}

					Object.keys(grs_units).map(function(gr){
						let unit = gr
						let value = grs_units[gr]
						return gf_units[gr] = Math.trunc(
								Math.min.apply(null, [
									(copia_res.wood - data_recruit.reserva.wood) / prices[unit][0], 
									(copia_res.clay - data_recruit.reserva.clay) / prices[unit][1], 
									(copia_res.iron - data_recruit.reserva.iron) / prices[unit][2],
									(copia_res.food - data_recruit.reserva.food) / prices[unit][3]
									]
								)
						)
					})

					let gf_units_list = sort_max(gf_units)
					var unit = gf_units_list[0]
					unit_type = Object.keys(unit)[0];
					amount = unit[unit_type]
					remaining = grs_units[unit_type] - (amount + villageUnits[unit_type]);
					if (remaining <= 0) {
						console.log(unit_type + " cheio")
						continue
					};
					if (amount > remaining) {
						amount = remaining;
					} else {
						if (amount < 1) {
							console.log(unit_type + " sem unidades previstas")
							continue
						};
					};

					let data_rec = {
							"village_id": village_id,
							"unit_type": unit_type,
							"amount": amount
					}

					var recruit_promise = function(data_rec){
						if(!promise_recruitRequest){
							promise_recruitRequest = new Promise(function(res, rej){
								data_log.recruit.push({"text":$filter("i18n")("recruit", $rootScope.loc.ale, "recruit") + " - village_id " + village_id + " / unit_type " + unit_type, "date": (new Date(time.convertedTime())).toString()})
								socketService.emit(providers.routeProvider.BARRACKS_RECRUIT, data_rec);
								res()
							}). then(function(data){
								promise_recruitRequest = undefined
								if(queue_recruitRequest.length){
									data_rec = queue_recruitRequest.shift()
									recruit_promise(data_rec)
								} else {
									console.log("terminou recruit")
									data_log.recruit.push({"text":$filter("i18n")("terminate_cicles", $rootScope.loc.ale, "recruit"), "date": (new Date(time.convertedTime())).toString()})
								}
							})
						} else {
							queue_recruitRequest.push(data_rec);
						}
					}

					recruit_promise(data_rec)
				}
				, sec_promise = function (village_id){
					if(!promise_UnitsAndResources){
						promise_UnitsAndResources = new Promise(function(res, rej){
							let village = modelDataService.getSelectedCharacter().getVillage(village_id)
							, units = village.getUnitInfo().units
							, resources = village.getResources().data.resources
							, unit
							, i
							, villageUnits = {};

							for (unit in units) {
								villageUnits[unit] = units[unit].total + units[unit].recruiting;
							}
							res({
								"village_id": village_id,
								"villageUnits": villageUnits, 
								"resources": resources
							})
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
				if(!data_villages.villages[vls[elem].data.villageId]){
					return undefined
				}
				let tam = vls[elem].getRecruitingQueue("barracks").length || 0;
				let gt = getFinishedForFree(vls[elem]);
				if(gt != Infinity && gt != 0 && !isNaN(gt)){
					list.push(getFinishedForFree(vls[elem]))
				}
				if(!!data_villages.villages[vls[elem].data.villageId].recruit_activate && tam < data_recruit.reserva.slots){
					return vls[elem].data.villageId
				} else {
					console.log("sem slots ou desativado")
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
			version			: conf.VERSION.RECRUIT,
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
