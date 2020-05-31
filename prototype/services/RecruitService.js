define("robotTW2/services/RecruitService", [
	"robotTW2",
	"robotTW2/time",
	"robotTW2/conf",
	"robotTW2/databases/data_log",
	"robotTW2/databases/data_recruit",
	"robotTW2/databases/data_villages",
	"helper/format"
], function (
	robotTW2,
	time,
	conf,
	data_log,
	data_recruit,
	data_villages,
	formatHelper
) {
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
				, listener_resume = undefined
				, paused_promise = undefined
				, paused_queue = false
				, promise_UnitsAndResources = undefined
				, queue_UnitsAndResources = []
				, interval_recruit = null
				, interval_cicle = null
				, listener_recruit = undefined
				, listener_group_updated = undefined
				, listener_group_created = undefined
				, listener_group_destroyed = undefined
				, list = []
				, prices = (function () {
					var unitData = modelDataService.getGameData().getUnits();
					var prices = {};
					unitData.forEach(function (data) {
						var array_price = [];
						array_price.push(data.wood);
						array_price.push(data.clay);
						array_price.push(data.iron);
						array_price.push(data.food);
						prices[data.name] = array_price;
					});
					return prices;
				})()
				, verifyGroups = function () {
					var groups = groupService.getGroups();
					Object.keys(groups).forEach(function (id) {
						if (!data_recruit.groups) { data_recruit.groups = {} }
						if (!data_recruit.groups[id]) {
							data_recruit.groups[id] = groups[id];
						}
					});

					Object.keys(data_recruit.groups).forEach(function (id) {
						if (!groups[id]) {
							delete data_recruit.groups[id];
						}
					});

					data_recruit.set();

					return;
				}
				, RESOURCE_TYPES = modelDataService.getGameData().getResourceTypes()
				, recruitSteps = function (list_recruit) {
					if (!list_recruit.length) { return }
					list_recruit.forEach(function (village_id) {
						var sort_max = function (obj) {
							return Object.values(Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a] })).map(function (res) {
								return { [res]: obj[res] }
							}).filter(f => f != undefined)
						}
							, sec_promise = function (village_id) {
								if (!promise_UnitsAndResources) {
									promise_UnitsAndResources = new Promise(function (res, rej) {
										let village = modelDataService.getSelectedCharacter().getVillage(village_id)
										if (!village) {
											res()
											return
										};
										let units = village.getUnitInfo().getUnits()
											, resources = village.getResources().getResources()
											, listGroups = modelDataService.getGroupList().getVillageGroups(village_id)
											, villageUnits = {}
											, ltz = []
											, grs_units = {}
											, gf_units = {}
											, gf_units_prov = {}

										for (let unit in units) {
											villageUnits[unit] = units[unit].total + units[unit].recruiting;
										}

										Object.keys(RESOURCE_TYPES).forEach(function (name) {
											if (resources[RESOURCE_TYPES[name]] < data_recruit.reserva[name.toLowerCase()]) {
												ltz.push(true);
											} else {
												ltz.push(false);
											}
										});

										if (ltz.some(f => f == true || !Object.keys(listGroups).length)) {
											res()
											return
										};

										if (!Object.keys(listGroups).length) {
											res()
											return
										}

										listGroups.map(function (gr) {
											if (!data_recruit.groups[gr.id]) { return }
											if (data_recruit.groups[gr.id].units && Object.values(data_recruit.groups[gr.id].units).some(f => f > 0)) {
												Object.keys(data_recruit.groups[gr.id].units).map(function (gt) {
													if (data_recruit.groups[gr.id].units[gt] > 0) {
														return grs_units[gt] = data_recruit.groups[gr.id].units[gt]
													}
												})
												return
											}
										})

										if (!Object.keys(grs_units).length) {
											res()
											return
										}

										Object.keys(grs_units).map(function (gr) {
											let qtd_units = Math.trunc(
												Math.min.apply(null, [
													Math.min.apply(null, [
														(resources.wood - data_recruit.reserva.wood) / prices[gr][0],
														(resources.clay - data_recruit.reserva.clay) / prices[gr][1],
														(resources.iron - data_recruit.reserva.iron) / prices[gr][2],
														(resources.food - data_recruit.reserva.food) / prices[gr][3]
													]
													), grs_units[gr] - villageUnits[gr]])
											).bound(0, 200) //limit 200 units per type
												, prov = qtd_units * prices[gr][3]
											if (qtd_units > 0) {
												gf_units[gr] = qtd_units
												gf_units_prov[gr] = prov
											}
											return
										})

										let gf_units_list = sort_max(gf_units_prov)

										function nt() {
											if (gf_units_list.length) {
												let unit_gf = gf_units_list.shift()
													, unit_type = Object.keys(unit_gf)[0]
													, recruitable = village.getUnitInfo().recruitable[unit_type]
													, amount = gf_units[unit_type]
													, remaining = grs_units[unit_type] - villageUnits[unit_type]

												if (remaining <= 0 || !recruitable) {
													return nt()
												};
												//									if (amount > remaining) {
												//										amount = remaining;
												//									} else {
												//										if (amount < 1) {
												//											return nt()
												//										};
												//									};

												amount = amount.bound(0, remaining)

												let data_rec = {
													"village_id": village_id,
													"unit_type": unit_type,
													"amount": amount
												}

												data_log.recruit.push(
													{
														"text": $filter("i18n")("recruit", $rootScope.loc.ale, "recruit") + " " + formatHelper.villageNameWithCoordinates(modelDataService.getVillage(village_id).data) + " " + amount + " " + unit_type,
														"date": time.convertedTime()
													}
												)
												socketService.emit(providers.routeProvider.BARRACKS_RECRUIT, data_rec);
												res()
											} else {
												res()
											}
										}
										nt()

									}).then(function () {
										promise_UnitsAndResources = undefined
										if (isPaused) {
											typeof (listener_resume) == "function" ? listener_resume() : null;
											listener_resume = undefined
											listener_resume = $rootScope.$on(providers.eventTypeProvider.RESUME, function () {
												if (queue_UnitsAndResources.length) {
													village_id = queue_UnitsAndResources.shift()
													sec_promise(village_id)
												}
											})
										} else {
											if (queue_UnitsAndResources.length) {
												$timeout(function () {
													village_id = queue_UnitsAndResources.shift()
													sec_promise(village_id)
												}, 2000)
											}
										}

									}, function (data) {
										promise_UnitsAndResources = undefined
										$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, { message: data.message });
										if (isPaused) {
											typeof (listener_resume) == "function" ? listener_resume() : null;
											listener_resume = undefined
											listener_resume = $rootScope.$on(providers.eventTypeProvider.RESUME, function () {
												if (queue_UnitsAndResources.length) {
													village_id = queue_UnitsAndResources.shift()
													sec_promise(village_id)
												}
											})
										} else {
											if (queue_UnitsAndResources.length) {
												$timeout(function () {
													village_id = queue_UnitsAndResources.shift()
													sec_promise(village_id)
												}, 2000)
											}
										}
									})
								} else {
									queue_UnitsAndResources.push(village_id);
								}
							}

						sec_promise(village_id)

					})
				}
				, wait = function () {
					setList(function (tm) {
						if (!interval_recruit) {
							interval_recruit = $timeout(function () { recruit() }, tm)
						} else {
							$timeout.cancel(interval_recruit);
							interval_recruit = $timeout(function () { recruit() }, tm)
						}
					});
				}
				, getFinishedForFree = function (village) {
					var lt = [];
					var job = village.getRecruitingQueue("barracks").jobs[0];
					if (job) {
						var timer = job.data.completed * 1000;
						var dif = timer - time.convertedTime();
						dif < conf.MIN_INTERVAL ? dif = conf.MIN_INTERVAL : dif;
						lt.push(dif);
						lt.push(data_recruit.interval);
					}
					var t = data_recruit.interval > 0 ? data_recruit.interval : data_recruit.interval = conf.INTERVAL.RECRUIT;
					if (lt.length) {
						t = Math.min.apply(null, lt);
					}
					return t || 0;
				}
				, setList = function (callback) {
					list.push(conf.INTERVAL.RECRUIT)
					data_recruit.interval < conf.MIN_INTERVAL ? list.push(conf.MIN_INTERVAL) : list.push(data_recruit.interval)
					var t = Math.min.apply(null, list);
					data_recruit.interval = t
					data_recruit.complete = time.convertedTime() + t
					list = [];
					data_recruit.set();
					$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE, { name: "RECRUIT" })
					if (callback && typeof (callback) == "function") { callback(t) }
				}
				, recruit = function () {
					data_log.recruit.push({
						"text": $filter("i18n")("init_cicles", $rootScope.loc.ale, "recruit"),
						"date": time.convertedTime()
					}
					)
					var vls = modelDataService.getSelectedCharacter().getVillageList();
					vls = Object.keys(vls).map(function (elem) {
						if (!data_villages.villages[vls[elem].getId()]) {
							return undefined
						}
						let tam = vls[elem].getRecruitingQueue("barracks").length || 0;
						let gt = getFinishedForFree(vls[elem]);
						if (gt != Infinity && gt != 0 && !isNaN(gt)) {
							list.push(getFinishedForFree(vls[elem]))
						}
						if (data_villages.villages[vls[elem].getId()].recruit_activate && tam < data_recruit.reserva.slots) {
							return vls[elem].getId()
						}
					}).filter(f => f != undefined)

					setList();

					recruitSteps(vls)
				}
				, init = function () {
					isInitialized = !0
					start();
				}
				, start = function () {
					if (isRunning) { return }
					ready(function () {
						interval_cicle = setInterval(recruit, data_recruit.interval)
						verifyGroups();
						listener_recruit = $rootScope.$on(providers.eventTypeProvider.UNIT_RECRUIT_JOB_FINISHED, recruit)
						listener_group_updated = $rootScope.$on(providers.eventTypeProvider.GROUPS_UPDATED, verifyGroups)
						listener_group_created = $rootScope.$on(providers.eventTypeProvider.GROUPS_CREATED, verifyGroups)
						listener_group_destroyed = $rootScope.$on(providers.eventTypeProvider.GROUPS_DESTROYED, verifyGroups)
						isRunning = !0;
						$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "RECRUIT" })
						wait();
						recruit()
					}, ["all_villages_ready"])
				}
				, stop = function () {
					typeof (listener_recruit) == "function" ? listener_recruit() : null;
					typeof (listener_group_updated) == "function" ? listener_group_updated() : null;
					typeof (listener_group_created) == "function" ? listener_group_created() : null;
					typeof (listener_group_destroyed) == "function" ? listener_group_destroyed() : null;
					listener_recruit = undefined;
					listener_group_updated = undefined;
					listener_group_created = undefined;
					listener_group_destroyed = undefined;
					promise_UnitsAndResources = undefined
					queue_UnitsAndResources = []
					isRunning = !1
					$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "RECRUIT" })
					$timeout.cancel(listener_recruit);
					interval_recruit = null
					interval_cicle = null
					list = []

				}
				, setPaused = function () {
					if (!paused_promise) {
						paused_promise = new Promise(function (resolve, reject) {
							$timeout(function () {
								resolve()
							}, 65000)
						}).then(function () {
							data_log.recruit.push(
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
					data_log.recruit.push(
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
				version: conf.VERSION.RECRUIT,
				name: "recruit"
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
