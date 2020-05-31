define("robotTW2/services/SecondVillageService", [
	"robotTW2",
	"helper/time",
	"models/SecondVillageModel",
	"robotTW2/conf",
	"conf/conf",
	"robotTW2/databases/data_cdr"
], function (
	robotTW2,
	helper,
	SecondVillageModel,
	conf,
	conf_conf,
	data_cdr
) {
		return (function SecondVillageService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			secondVillageService,
			$timeout,
			ready
		) {

			var isInitialized = !1
				, isRunning = !1
				, r = undefined
				, listener_job_collect = undefined
				, listener_job_started = undefined
				, readyJobs = function (jobs) {
					var actual_date = Date.now();
					for (var key in jobs)
						if (jobs[key].time_started && jobs[key].time_completed && actual_date < helper.server2ClientTime(jobs[key].time_completed))
							return jobs[key];
					return !1
				}
				, collectibleJobs = function (jobs) {
					var actual_date = Date.now();
					for (var key in jobs)
						if (jobs[key].time_started && jobs[key].time_completed && actual_date >= helper.server2ClientTime(jobs[key].time_completed) && !jobs[key].collected)
							return key;
					return !1
				}
				, collectJob = function (id) {
					socketService.emit(providers.routeProvider.SECOND_VILLAGE_COLLECT_JOB_REWARD, {
						village_id: modelDataService.getSelectedVillage().getId(),
						job_id: id
					})
				}
				, start_job = function (id, callback) {
					r = $timeout(function () {
						callback(!1)
					}, conf_conf.LOADING_TIMEOUT);
					socketService.emit(providers.routeProvider.SECOND_VILLAGE_START_JOB, {
						village_id: modelDataService.getSelectedVillage().getId(),
						job_id: id
					}, callback)
				}
				, getKey = function (jobs) {
					for (var job in jobs)
						return job;
					return !1
				}
				, get_info = function (callback) {
					socketService.emit(providers.routeProvider.SECOND_VILLAGE_GET_INFO, {}, function (b) {
						if (!SecondVillageModel || !b) { return }
						var second_village = new SecondVillageModel(b);
						modelDataService.getSelectedCharacter().setSecondVillage(second_village),
							callback()
					})
				}
				, verify_second = function () {
					get_info(update);
				}
				, update = function () {
					var second_village = modelDataService.getSelectedCharacter().getSecondVillage();
					if (!isRunning || !second_village || !second_village.isAvailable())
						return !1;
					var job = readyJobs(second_village.data.jobs);
					if (job) {
						var time_job = helper.server2ClientTime(job.time_completed)
							, time_rest = time_job - Date.now() + 1e3;
						return setTimeout(verify_second, time_rest),
							!1
					}
					var job_for_collect = collectibleJobs(second_village.data.jobs);
					if (job_for_collect)
						return collectJob(job_for_collect);
					var currentJobs = secondVillageService.getCurrentDayJobs(second_village.data.jobs, second_village.data.day)
						, collectedJobs = secondVillageService.getCollectedJobs(second_village.data.jobs)
						, resources = modelDataService.getSelectedVillage().getResources().getResources()
						, availableJobs = secondVillageService.getAvailableJobs(currentJobs, collectedJobs, resources, []);
					if (Object.keys(availableJobs).length) {
						var job_id = getKey(availableJobs);
						start_job(job_id, function () {
							$timeout.cancel(r);
							r = undefined;
							var available_job = availableJobs[job_id];
							$timeout(verify_second, 1e3 * available_job.duration + 1e3)
						})
					}
				}
				, init = function () {
					if (!secondVillageService.isFeatureActive())
						return !1;
					isInitialized = !0
					start()
				}
				, start = function () {
					if (isRunning) { return }
					ready(function () {
						data_cdr.interval = conf.INTERVAL.CDR;
						data_cdr.set();
						isRunning = !0
						$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "CDR" })
						!listener_job_collect ? listener_job_collect = $rootScope.$on(providers.eventTypeProvider.SECOND_VILLAGE_JOB_COLLECTED, function () { $timeout(function () { verify_second() }, 3000) }) : listener_job_collect;
						!listener_job_started ? listener_job_started = $rootScope.$on(providers.eventTypeProvider.SECOND_VILLAGE_VILLAGE_CREATED, function () { $timeout(function () { verify_second() }, 3000) }) : listener_job_started;
						verify_second()
					}, ["all_villages_ready"])

				}
				, stop = function () {
					typeof (listener_job_collect) == "function" ? listener_job_collect() : null;
					typeof (listener_job_started) == "function" ? listener_job_started() : null;
					listener_job_collect = undefined;
					listener_job_started = undefined;
					isRunning = !1
					$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "SECONDVILLAGE" })
				}

			return {
				init: init,
				start: start,
				stop: stop,
				isRunning: function () {
					return isRunning
				},
				isInitialized: function () {
					return isInitialized
				},
				version: conf.VERSION.SECONDVILLAGE,
				name: "secondvillage"
			}

		})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.secondVillageService,
			robotTW2.services.$timeout,
			robotTW2.ready
		)
	})