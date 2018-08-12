define("robotTW2/deposit", [
	"robotTW2/ready",
	"robotTW2/eventQueue",
	"robotTW2/data_villages",
	"robotTW2/data_deposit",
	"robotTW2/conf", 
	"robotTW2/services",
	"robotTW2/providers"
	], function(
			ready,
			eventQueue,
			data_villages,
			data_deposit,
			conf, 
			services,
			providers
	){
	var isInitialized = !1 
	, isRunning = !1
	, interval_deposit = null
	, interval_deposit_collect = null
	, listener_job_collect = undefined
	, listener_job_rerolled = undefined
	, listener_job_collectible = undefined
	, data = data_deposit.getDeposit()
	, startJob = function(job) {
		services.socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_START_JOB, {
			job_id: job.id
		})
	}
	, collectJob = function(job) {
		services.socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_COLLECT, {
			job_id: job.id,
			village_id: services.modelDataService.getSelectedVillage().getId()
		})
		if(!interval_deposit){
			interval_deposit = services.$timeout(verify_deposit, data.INTERVAL)
		} else {
			services.$timeout.cancel(interval_deposit);
			interval_deposit = services.$timeout(verify_deposit, data.INTERVAL)
		}
	}
	, readyJobs = function (resourceDepositModel) {
		var resourceDepositModel = services.modelDataService.getSelectedCharacter().getResourceDeposit();
		var a;
		return resourceDepositModel && resourceDepositModel.isAvailable() ? (a = resourceDepositModel.getReadyJobs(),
				!resourceDepositModel.getCurrentJob() && a && a.length > 0) : !1
	}
	, collectibleJobs = function () {
		var resourceDepositModel = services.modelDataService.getSelectedCharacter().getResourceDeposit();
		return resourceDepositModel && resourceDepositModel.isAvailable() && !!resourceDepositModel.getCollectibleJobs()
	}
	, verify_deposit = function() {
		data = data_deposit.getDeposit()
		services.socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_OPEN);
		var resourceDepositModel = services.modelDataService.getSelectedCharacter().getResourceDeposit();
		var currentJob;
		if (isRunning && resourceDepositModel != undefined && data.ATIVATE) {
			if(!resourceDepositModel.getCurrentJob()){
				if (collectibleJobs()) {
					var job = resourceDepositModel.getCollectibleJobs().shift();
					job ? collectJob(job) : null;
				} else if (readyJobs()) {
					var job = resourceDepositModel.getReadyJobs().shift();
					job ? startJob(job) : null;
				} else {
					var reroll = services.modelDataService.getInventory().getItemByType("resource_deposit_reroll");
					if (reroll && reroll.amount > 0 && data.USE_REROLL && resourceDepositModel.getMilestones().length){
						services.socketService.emit(providers.routeProvider.PREMIUM_USE_ITEM, {
							village_id: services.modelDataService.getSelectedVillage().getId(),
							item_id: reroll.id
						})
					}
					wait();
				}
				$rootScope.$broadcast(providers.eventTypeProvider.SPY_READY)
			} else {
				wait();
			}
		} else {
			$rootScope.$broadcast(providers.eventTypeProvider.SPY_READY)
		}
	}
	, wait = function(){
		$rootScope.$broadcast(providers.eventTypeProvider.SPY_READY)
		if(!interval_deposit){
			interval_deposit = services.$timeout(verify_deposit, data.INTERVAL)
		} else {
			services.$timeout.cancel(interval_deposit);
			interval_deposit = services.$timeout(verify_deposit, data.INTERVAL)
		}
	}
	, init = function (){
		isInitialized = !0
		start();
	}
	, start = function (){
		if(isRunning){return}
		isRunning = !0
		!listener_job_collect ? listener_job_collect = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTED, function(){services.$timeout(function(){verify_deposit()}, 3000)}) : listener_job_collect;
		!listener_job_rerolled ? listener_job_rerolled = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOBS_REROLLED, function(){services.$timeout(function(){verify_deposit()}, 3000)}) : listener_job_rerolled;
		!listener_job_collectible ? listener_job_collectible = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTIBLE, function(){services.$timeout(function(){verify_deposit()}, 3000)}) : listener_job_collectible;
		verify_deposit();
	}
	, stop = function (){
		typeof(listener_job_collect) == "function" ? listener_job_collect(): null;
		typeof(listener_job_rerolled) == "function" ? listener_job_rerolled(): null;
		typeof(listener_job_collectible) == "function" ? listener_job_collectible(): null;
		listener_job_collect = undefined;
		listener_job_rerolled = undefined;
		listener_job_collectible = undefined;
		isRunning = !1,
		services.$timeout.cancel(interval_deposit);
		interval_deposit = undefined;
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
		name			: "deposit"
	}

})
,
define("robotTW2/deposit/ui", [
	"robotTW2/deposit",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_deposit",
	"helper/time",
	"robotTW2/conf"
	], function(
			deposit,
			builderWindow,
			services,
			providers,
			data_deposit,
			helper,
			conf
	){
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.DEPOSIT;
		var templateName = "deposit";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
	}
	, injectScope = function(){

	}

	Object.setPrototypeOf(deposit, {
		build : function(){
			build(injectScope)
		}
	})

})
