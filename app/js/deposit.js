define("robotTW2/deposit", [
	"robotTW2/ready",
	"robotTW2/eventQueue",
	"robotTW2/data_villages",
	"robotTW2/data_deposit",
	"robotTW2/conf", 
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time"
	], function(
			ready,
			eventQueue,
			data_villages,
			data_deposit,
			conf, 
			services,
			providers,
			helper
	){
	var isInitialized = !1 
	, isRunning = !1
	, list = []
	, interval_deposit = null
	, interval_deposit_collect = null
	, listener_job_collect = undefined
	, listener_job_rerolled = undefined
	, listener_job_collectible = undefined
	, startJob = function(job) {
		data_deposit.setTimeCicle(job.duration)
		setList();
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
			interval_deposit = services.$timeout(verify_deposit, data_deposit.getTimeCicle())
		} else {
			services.$timeout.cancel(interval_deposit);
			interval_deposit = services.$timeout(verify_deposit, data_deposit.getTimeCicle())
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
		services.socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_OPEN);
		var resourceDepositModel = services.modelDataService.getSelectedCharacter().getResourceDeposit();
		if (isRunning && resourceDepositModel != undefined && data_deposit.getDeposit().ATIVATE) {
			var currentJob = resourceDepositModel.getCurrentJob();
			if(currentJob && data_deposit.getDeposit().ATIVATE){
				data_deposit.setTimeCicle(currentJob.model.completedAt - helper.gameTime())
				$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT)
				wait();
			} else {
				if (collectibleJobs()) {
					var job = resourceDepositModel.getCollectibleJobs().shift();
					job ? collectJob(job) : null;
				} else if (readyJobs()) {
					var job = resourceDepositModel.getReadyJobs().shift();
					job ? startJob(job) : null;
				} else {
					var reroll = services.modelDataService.getInventory().getItemByType("resource_deposit_reroll");
					if (reroll && reroll.amount > 0 && data_deposit.getDeposit().USE_REROLL && resourceDepositModel.getMilestones().length){
						services.socketService.emit(providers.routeProvider.PREMIUM_USE_ITEM, {
							village_id: services.modelDataService.getSelectedVillage().getId(),
							item_id: reroll.id
						}, function(){
							verify_deposit()
							return
						})
					}
					wait();
					return
				}
			}
		}
	}
	, setList = function(callback){
		list.push(conf.INTERVAL.DEPOSIT)
		list.push(data_deposit.getTimeCicle())
		var t = Math.min.apply(null, list)
		t < 3000 ? t = 3000 : t;
		data_deposit.setTimeCicle(t)
		data_deposit.setTimeComplete(helper.gameTime() + t)
		list = [];
		$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT)
		if(callback && typeof(callback) == "function"){callback(t)}
	}
	, wait = function(){
		setList(function(tm){
			if(!interval_deposit){
				interval_deposit = services.$timeout(function(){verify_deposit()}, tm)
			} else {
				services.$timeout.cancel(interval_deposit);
				interval_deposit = undefined;
				interval_deposit = services.$timeout(function(){verify_deposit()}, tm)
			}	
		});

	}
	, init = function (){
		isInitialized = !0
		start();
	}
	, start = function (){
		if(isRunning){return}
		ready(function(){
			var d = data_deposit.getDeposit();
			d.INTERVAL = conf.INTERVAL.DEPOSIT;
			data_deposit.setDeposit(d);
			isRunning = !0
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DEPOSIT"})
			!listener_job_collect ? listener_job_collect = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTED, function(){services.$timeout(function(){verify_deposit()}, 3000)}) : listener_job_collect;
			!listener_job_rerolled ? listener_job_rerolled = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOBS_REROLLED, function(){services.$timeout(function(){verify_deposit()}, 3000)}) : listener_job_rerolled;
			!listener_job_collectible ? listener_job_collectible = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTIBLE, function(){services.$timeout(function(){verify_deposit()}, 3000)}) : listener_job_collectible;
			verify_deposit()
		}, ["all_villages_ready"])
	}
	, stop = function (){
		typeof(listener_job_collect) == "function" ? listener_job_collect(): null;
		typeof(listener_job_rerolled) == "function" ? listener_job_rerolled(): null;
		typeof(listener_job_collectible) == "function" ? listener_job_collectible(): null;
		listener_job_collect = undefined;
		listener_job_rerolled = undefined;
		listener_job_collectible = undefined;
		isRunning = !1
		$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DEPOSIT"})
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