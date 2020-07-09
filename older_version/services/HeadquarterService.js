define("robotTW2/services/HeadquarterService", [
	"robotTW2",
	"robotTW2/time",
	"robotTW2/conf",
	"conf/conf",
	"conf/upgradeabilityStates",
	"conf/locationTypes",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_buildingorder",
	"robotTW2/databases/data_buildinglimit",
	"robotTW2/databases/data_buildinglist",
	"robotTW2/databases/data_headquarter",
	"robotTW2/databases/data_log",
	"helper/format"
], function (
	robotTW2,
	time,
	conf,
	conf_conf,
	upgradeabilityStates,
	locationTypes,
	data_villages,
	data_buildingorder,
	data_buildinglimit,
	data_buildinglist,
	data_headquarter,
	data_log,
	formatHelper
) {
		return (function HeadquarterService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			premiumActionService,
			buildingService,
			villageService,
			$timeout,
			ready
		) {

			var o
				, interval_builder
				, interval_cicle
				, q
				, s
				, r = undefined
				, isInitialized = !1
				, isRunning = !1
				, isPaused = !1
				, list = []
				, x = {}
				, y = {}
				, promise = undefined
				, promise_queue = []
				, promise_next = undefined
				, next_queue = []
				, listener_building_level_change = undefined
				, listener_resume = undefined
				, paused_promise = undefined
				, paused_queue = false
				, checkBuildingOrderLimit = function (buildingLevels, vill_id) {
					if (!data_villages.villages[vill_id].selected) {
						return []
					}
					var buildingLimit = data_buildinglimit.villages[vill_id].buildinglimit[data_villages.villages[vill_id].selected.value]
						, buildingList = data_buildinglist.villages[vill_id].buildinglist[data_villages.villages[vill_id].selected.value]
						, builds = []
						, loop_control = false;

					Object.keys(buildingLevels).forEach(function (key_level) {
						if (data_villages.villages[vill_id].seq_type != "seq_list") {
							if (buildingLimit) {
								Object.keys(buildingLimit).forEach(function (key_limit) {
									if (key_limit == "church" || key_limit == "chapel") {
										if (buildingLevels[key_level][key_limit] < buildingLimit[key_limit] && buildingLimit[key_limit] > 0 && modelDataService.getSelectedCharacter().getFaithFactorForVillage(vill_id) < 1) {
											builds.push({ [key_limit]: buildingLevels[key_level][key_limit] })
										}
									} else {
										if (buildingLevels[key_level][key_limit] < buildingLimit[key_limit] && buildingLimit[key_limit] > 0) {
											builds.push({ [key_limit]: buildingLevels[key_level][key_limit] })
										}
									}
								})
							}
						} else {
							if (buildingList) {
								buildingList.forEach(function (key) {
									let name = Object.keys(key)[0]
									if (name == "stop" || loop_control) {
										loop_control = true
										return
									}
									let level = Object.values(key)[0]
									if (buildingLevels[key_level][name] < level && level > 0) {
										builds.push(name)
									}
								})
							}
						}
					})

					return builds

				}
				, RESOURCE_TYPES = modelDataService.getGameData().getResourceTypes()
				, isUpgradeable = function (village, build, callback) {
					var buildingData = village.getBuildingData().getDataForBuilding(build)
						, nextLevelCosts = buildingData.nextLevelCosts
						, not_enough_resources = false
						, firstQueue = village.getBuildingQueue().getQueue()[0];
					if (firstQueue && firstQueue.canBeFinishedForFree) {
						premiumActionService.instantBuild(firstQueue, locationTypes.HEADQUARTER, true);
						callback(!1, "instant")
					} else {
						let resources = village.getResources().data.resources


						//				Object.keys(RESOURCE_TYPES).forEach(function(name){
						//				if (resources[RESOURCE_TYPES[name]] + data_headquarter.reserva[name.toLowerCase()] < nextLevelCosts[name]){
						//				data_log.headquarter.push(
						//				{
						//				"text": village.data.name + " not_enough_resources for " + build, 
						//				"date": time.convertedTime()
						//				}
						//				)
						//				data_log.set()
						//				callback(!1, {[village.data.name] : "not_enough_resources for " + build})
						//				return
						//				}
						//				});

						if (buildingData.upgradeability === upgradeabilityStates.POSSIBLE) {

							r = $timeout(function () {
								callback(!1)
							}, conf_conf.LOADING_TIMEOUT);

							data_log.headquarter.push(
								{
									"text": "Upgrade " + formatHelper.villageNameWithCoordinates(village.data) + " " + build,
									"date": time.convertedTime()
								}
							)
							data_log.set()

							socketService.emit(providers.routeProvider.VILLAGE_UPGRADE_BUILDING, {
								building: build,
								village_id: village.getId(),
								location: locationTypes.MASS_SCREEN,
								premium: !1
							}, function (data) {
								$timeout.cancel(r);
								r = undefined;
								if (!data || data.code == "Route/notPublic") {
									callback(!1)
								} else {
									callback(!0, data)
								}
							})
						} else {
							callback(!1, village.data.name + " in " + buildingData.upgradeability + " for " + build)
						}
					}
				}
				, canBeFinishedForFree = function (village) {
					if (village.getBuildingQueue()) {
						var queue = village.getBuildingQueue().getQueue()[0];
						var d = modelDataService.getWorldConfig().getFreeSecondsPerBuildingLevel() * village.getBuildingLevel("headquarter")
						return queue.finishedIn - d;
					} else {
						return data_headquarter.interval / 1e3;
					}
				}
				, getFinishedForFree = function (village) {
					var lt = [];
					if (village.getBuildingQueue().getQueue().length > 0) {
						var timer = Math.round(canBeFinishedForFree(village) * 1e3) + 5000;
						if (timer < data_headquarter.interval) {
							timer < 0 ? timer = 0 : timer;
							lt.push(timer);
						}
					}
					var t = data_headquarter.interval > 0 ? data_headquarter.interval : data_headquarter.interval = conf.INTERVAL.HEADQUARTER;
					if (lt.length) {
						t = Math.min.apply(null, lt);
					}
					return t || 0;
				}
				, setList = function (callback) {
					list.push(conf.INTERVAL.HEADQUARTER)
					data_headquarter.interval < conf.MIN_INTERVAL ? list.push(conf.MIN_INTERVAL) : list.push(data_headquarter.interval);
					var t = Math.min.apply(null, list);
					data_headquarter.interval = t
					data_headquarter.complete = time.convertedTime() + t
					data_headquarter.set()
					list = [];
					if (callback && typeof (callback) == "function") { callback(t) }
				}
				, upgradeBuilding = function (village, resolve) {
					return new Promise(function (resolve) {
						if (!data_villages.villages[village.getId()]) { resolve() }
						buildingService.compute(village)
						var buildingQueue = village.getBuildingQueue()
							, levels = village.getBuildingData().getBuildingLevels()
							, control_buildingLevels = angular.copy(Object.keys(levels).map(function (key) { return { [key]: levels[key] } }))
							, queues = village.buildingQueue.getQueue()
							, readyState = village.checkReadyState()
							, buildState = data_villages.villages[village.getId()].headquarter_activate
							, buildAmounts = buildingQueue.getAmountJobs()
							, buildUnlockedSlots = buildingQueue.getUnlockedSlots()

						var gt = getFinishedForFree(village);
						if (gt != Infinity && gt != 0 && !isNaN(gt) && gt > conf.MIN_INTERVAL) {
							list.push(gt)
						}

						if (!(
							buildAmounts !== buildUnlockedSlots
							&& buildState
							&& buildAmounts < data_headquarter.reserva.slots
							&& (readyState.buildingQueue || readyState.buildings)
							&& (village.isInitialized() || villageService.initializeVillage(village))
						)) {
							data_log.headquarter.push(
								{
									"text": "No upgrade " + formatHelper.villageNameWithCoordinates(village.data) + " - no limit for upgrade",
									"date": time.convertedTime()
								}
							)
							resolve();
							return;
						}

						if (queues.length) {
							queues.forEach(
								function (queue) {
									control_buildingLevels.map(function (value) {
										Object.keys(value)[0] == queue.building ? value[queue.building]++ : undefined;
									})
								}
							)
						}

						var bt = checkBuildingOrderLimit(control_buildingLevels, village.getId());

						if (!bt.length) {
							data_log.headquarter.push(
								{
									"text": "No upgrade " + formatHelper.villageNameWithCoordinates(village.data) + " - no Build for upgrade",
									"date": time.convertedTime()
								}
							)
							resolve();
							return;
						}

						var g = []

						//				if(data_headquarter.seq_type != "seq_list"){
						if (data_villages.villages[village.getId()].seq_type != "seq_list") {
							var bd = data_buildingorder.villages[village.getId()].buildingorder[data_villages.villages[village.getId()].selected.value]
								, bf = Object.keys(bd).map(function (bd_key) {
									return bt.find(f => Object.keys(f)[0] == bd_key) ? { [bd_key]: bd[bd_key] } : undefined;
								}).filter(f => f != undefined);

							bf.sort(function (a, b) { return Object.values(a)[0] - Object.values(b)[0] })

							bf.forEach(function (bf_obj) {
								let tr = bt.find(f => Object.keys(f)[0] == Object.keys(bf_obj)[0])
								tr ? g.push(Object.keys(tr)[0]) : tr
							})

							//					if(data_headquarter.seq_type == "seq_int"){
							if (data_villages.villages[village.getId()].seq_type == "seq_int") {
								g = g.splice(0, 1)
							};
						} else {
							g.push(Object.keys(bt.splice(0, 1)[0])[0])
						}

						g.forEach(function (g_obj) {
							function a(obj_build) {
								if (!promise_next) {
									promise_next = new Promise(function (res) {
										//								let build_name = Object.keys(build)[0]
										buildingService.compute(village)
										if (buildAmounts !== buildUnlockedSlots && buildAmounts < data_headquarter.reserva.slots) {
											isUpgradeable(village, obj_build, function (success, data) {
												if (success) {
													++buildAmounts;
												} else if (data == "instant") {
													res(true);
													return
												} else {
													data_log.headquarter.push(
														{
															"text": data,
															"date": time.convertedTime()
														}
													)
													data_log.set()
												}
												res()
											})
										} else {
											res();
										}
									}).then(function (repeat) {
										promise_next = undefined;
										if (repeat) {
											$timeout(function () {
												resolve(true);
												next_queue = [];
											}, 5000)
										} else if (g.length && isRunning) {
											$timeout(function () {
												a(g.shift())
											}, 5000)
										} else {
											$timeout(function () {
												resolve()
											}, 5000)
										}
									})
								} else {
									next_queue.push(obj_build)
								}
							}
							a(g_obj)
						})
					})
				}
				, seq_cicle = function (village) {
					function f(vill) {
						if (!promise) {
							promise = new Promise(function (res) {
								upgradeBuilding(vill).then(function (repeat) {
									promise = undefined;
									if (repeat) {
										promise_queue.unshift(vill)
										$timeout(function () { res() }, 5000)
									} else {
										res()
									}
								})
							}).then(function () {
								promise = undefined;
								if (isPaused) {
									typeof (listener_resume) == "function" ? listener_resume() : null;
									listener_resume = undefined
									listener_resume = $rootScope.$on(providers.eventTypeProvider.RESUME, function () {
										if (promise_queue.length) {
											vill = promise_queue.shift();
											f(vill);
										} else {
											wait()
										}
									})
								} else {
									if (promise_queue.length) {
										vill = promise_queue.shift();
										f(vill);
									} else {
										wait()
									}
								}
							})
						} else {
							promise_queue.push(vill)
						}
					}
					f(village)
				}
				, cicle_building = function ($event, data) {
					if (!isInitialized)
						return;
					var villages = modelDataService.getSelectedCharacter().getVillages();
					Object.values(villages).map(function (village) { seq_cicle(village) })
				}
				, wait = function () {
					setList(function (tm) {
						if (isRunning) {
							if (!interval_builder) {
								interval_builder = $timeout(cicle_building, tm || conf.MIN_INTERVAL)
							} else {
								$timeout.cancel(interval_builder);
								interval_builder = $timeout(cicle_building, tm || conf.MIN_INTERVAL)
							}
						}
					});
				}
				, init = function () {
					isInitialized = !0
					Object.keys(data_villages.villages).map(function (village) {
						if (!data_villages.villages[village].selected) {
							data_villages.villages[village].selected = data_headquarter.selects[0];
						}
					})
					data_villages.set();
					start();
				}
				, start = function () {
					if (isRunning) { return }
					ready(function () {
						interval_cicle = setInterval(cicle_building, 15 * 60 * 1000)
						data_headquarter.interval = conf.INTERVAL.HEADQUARTER;
						data_headquarter.set()
						listener_building_level_change = $rootScope.$on(providers.eventTypeProvider.BUILDING_LEVEL_CHANGED, cicle_building)
						isRunning = !0
						$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "HEADQUARTER" })
						wait();
						cicle_building()
					}, ["all_villages_ready"])
				}
				, stop = function () {
					$timeout.cancel(interval_builder);
					interval_cicle = undefined;
					promise = undefined
					promise_queue = []
					promise_next = undefined
					next_queue = []
					isRunning = !1
					$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "HEADQUARTER" })
					typeof (listener_building_level_change) == "function" ? listener_building_level_change() : null;
					listener_building_level_change = undefined
				}
				, setPaused = function () {
					if (!paused_promise) {
						paused_promise = new Promise(function (resolve, reject) {
							$timeout(function () {
								resolve()
							}, 65000)
						}).then(function () {
							data_log.headquarter.push(
								{
									"text": "Paused",
									"date": time.convertedTime()
								}
							)
							data_log.set()
							isPaused = !0
							paused_promise = undefined;
							if (paused_queue) {
								paused_queue = false;
								setPaused()
							} else {
								setResumed()
							}
						}, function () {
							paused_promise = undefined;
							setResumed()
						})
					} else {
						paused_queue = true;
					}
				}
				, setResumed = function () {
					data_log.headquarter.push(
						{
							"text": "Resumed",
							"date": time.convertedTime()
						}
					)
					data_log.set()
					isPaused = !1
					$rootScope.$broadcast(providers.eventTypeProvider.RESUME)
				}

			return {
				init: init,
				start: start,
				stop: stop,
				isRunning: function () {
					return isRunning
				},
				isPaused: function () {
					return isPaused
				},
				isInitialized: function () {
					return isInitialized
				},
				version: conf.VERSION.HEADQUARTER,
				name: "headquarter"
			}

		})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.premiumActionService,
			robotTW2.services.buildingService,
			robotTW2.services.villageService,
			robotTW2.services.$timeout,
			robotTW2.ready
		)
	})
