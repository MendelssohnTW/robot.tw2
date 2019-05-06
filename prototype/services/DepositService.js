define("robotTW2/services/DepositService", [
	"robotTW2",
	"robotTW2/time",
	"robotTW2/conf",
	"robotTW2/databases/data_deposit",
	"robotTW2/databases/data_log"
	], function(
			robotTW2,
			time,
			conf,
			data_deposit,
			data_log
	){
	return (function DepositService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			$filter,
			ready
	) {

		var isInitialized = !1 
		, isRunning = !1
		, inProcess = !0
		, interval_deposit = undefined
		, listener_job_collect = undefined
		, listener_job_rerolled = undefined
		, listener_job_collectible = undefined
		, listener_job_info = undefined
		, startJob = function(job) {
			data_deposit.interval = job.duration
			data_deposit.set()
			socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_START_JOB, {
				job_id: job.id
			})
		}
		, collectJob = function(job, callback) {
			
			data_log.spy.push(
					{
						"text": $filter("i18n")("title", $rootScope.loc.ale, "deposit"),
						"date": time.convertedTime()
					}
			)
			
			socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_COLLECT, {
				job_id: job.id,
				village_id: modelDataService.getSelectedVillage().getId()
			})
		}
		, sortJobs = function(jobs){
			return jobs.sort(function(a, b) {
				return a.duration - b.duration
			})[0]
		}
		, verify_deposit = function() {
			if(!isRunning) return !1;
			var resourceDepositModel = modelDataService.getSelectedCharacter().getResourceDeposit();
			if(!resourceDepositModel || !data_deposit.activated) 
				return !1;
			if(resourceDepositModel.getCurrentJob())
				return !1;
			if (resourceDepositModel.getCollectibleJobs()) 
				return collectJob(resourceDepositModel.getCollectibleJobs().shift());
			var readyJobs = resourceDepositModel.getReadyJobs();
			if(readyJobs)
				return startJob(sortJobs(readyJobs));
			
			var reroll = modelDataService.getInventory().getItemByType("resource_deposit_reroll");
			if (reroll && reroll.amount > 0 && data_deposit.use_reroll && resourceDepositModel.getMilestones().length){
				socketService.emit(providers.routeProvider.PREMIUM_USE_ITEM, {
					village_id: modelDataService.getSelectedVillage().getId(),
					item_id: reroll.id
				}, function(){
					verify_deposit()
					return !1;
				})
			}
		}
		, getInfo = function(){
			socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_GET_INFO, {})
		}
		, wait = function(job){
			var time_rest = 1e3 * job.time_next_reset - Date.now() + 1e3;
			$timeout.cancel(interval_deposit),
			interval_deposit = $timeout(getInfo, time_rest)
			data_deposit.interval = time_rest
			data_deposit.complete = time.convertedTime() + time_rest
			data_deposit.set()
		}
		, init = function (){
			isInitialized = !0
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				isRunning = !0
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DEPOSIT"})
				!listener_job_collect ? listener_job_collect = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTED, function(){$timeout(function(){verify_deposit()}, 3000)}) : listener_job_collect;
				!listener_job_rerolled ? listener_job_rerolled = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOBS_REROLLED, function(){$timeout(function(){verify_deposit()}, 3000)}) : listener_job_rerolled;
				!listener_job_collectible ? listener_job_collectible = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTIBLE, function(){
					if (!inProcess || !isRunning)
						return !1;
					inProcess = !1,
					$timeout(function(){
						inProcess = !0,
						verify_deposit()
					}, 3000)
				}) : listener_job_collectible;
				!listener_job_info ? listener_job_info = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_INFO, function($event, job){
					verify_deposit()
					wait(job)
				}) : listener_job_info;
				getInfo()
			}, ["all_villages_ready"])
		}
		, stop = function (){
			typeof(listener_job_collect) == "function" ? listener_job_collect(): null;
			typeof(listener_job_rerolled) == "function" ? listener_job_rerolled(): null;
			typeof(listener_job_collectible) == "function" ? listener_job_collectible(): null;
			typeof(listener_job_info) == "function" ? listener_job_info(): null;
			listener_job_collect = undefined;
			listener_job_rerolled = undefined;
			listener_job_collectible = undefined;
			listener_job_info = undefined;
			$timeout.cancel(interval_deposit);
			interval_deposit = undefined
			isRunning = !1
			inProcess = !0
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DEPOSIT"})
		}

		return	{
			init			: init,
			start			: start,
			stop 			: stop,
			isRunning		: function () {
				return isRunning
			},
			isInitialized	: function () {
				return isInitialized
			},
			version			: conf.VERSION.DEPOSIT,
			name			: "deposit",
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.ready
	)
})