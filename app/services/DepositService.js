define("robotTW2/services/DepositService", [
	"robotTW2",
	"robotTW2/conf"
	], function(
			robotTW2,
			conf
	){
	return (function DepositService() {

		var isInitialized = !1 
		, isRunning = !1
		, list = []
		, interval_deposit = null
		, interval_deposit_collect = null
		, listener_job_collect = undefined
		, listener_job_rerolled = undefined
		, listener_job_collectible = undefined
		, data_deposit = robotTW2.databases.data_deposit
		, startJob = function(job) {
			data_deposit.setTimeCicle(job.duration)
			setList();
			robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.RESOURCE_DEPOSIT_START_JOB, {
				job_id: job.id
			})
		}
		, collectJob = function(job) {
			robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.RESOURCE_DEPOSIT_COLLECT, {
				job_id: job.id,
				village_id: robotTW2.services.modelDataService.getSelectedVillage().getId()
			})
		}
		, readyJobs = function (resourceDepositModel) {
			var resourceDepositModel = robotTW2.services.modelDataService.getSelectedCharacter().getResourceDeposit();
			var a;
			return resourceDepositModel && resourceDepositModel.isAvailable() ? (a = resourceDepositModel.getReadyJobs(),
					!resourceDepositModel.getCurrentJob() && a && a.length > 0) : !1
		}
		, collectibleJobs = function () {
			var resourceDepositModel = robotTW2.services.modelDataService.getSelectedCharacter().getResourceDeposit();
			return resourceDepositModel && resourceDepositModel.isAvailable() && !!resourceDepositModel.getCollectibleJobs()
		}
		, verify_deposit = function() {
			robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.RESOURCE_DEPOSIT_OPEN);
			var resourceDepositModel = robotTW2.services.modelDataService.getSelectedCharacter().getResourceDeposit();
			if (isRunning && resourceDepositModel != undefined && data_deposit.ativate) {
				var currentJob = resourceDepositModel.getCurrentJob();
				if(currentJob){
					data_deposit.setTimeCicle(currentJob.model.completedAt - helper.gameTime())
					robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT)
					wait();
				} else {
					if (collectibleJobs()) {
						var job = resourceDepositModel.getCollectibleJobs().shift();
						job ? collectJob(job) : null;
					} else if (readyJobs()) {
						var job = resourceDepositModel.getReadyJobs().shift();
						job ? startJob(job) : null;
					} else {
						var reroll = robotTW2.services.modelDataService.getInventory().getItemByType("resource_deposit_reroll");
						if (reroll && reroll.amount > 0 && data_deposit.use_reroll && resourceDepositModel.getMilestones().length){
							robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.PREMIUM_USE_ITEM, {
								village_id: robotTW2.services.modelDataService.getSelectedVillage().getId(),
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
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT)
			if(callback && typeof(callback) == "function"){callback(t)}
		}
		, wait = function(){
			setList(function(tm){
				if(!interval_deposit){
					interval_deposit = robotTW2.services.$timeout(function(){verify_deposit()}, tm)
				} else {
					robotTW2.services.$timeout.cancel(interval_deposit);
					interval_deposit = undefined;
					interval_deposit = robotTW2.services.$timeout(function(){verify_deposit()}, tm)
				}	
			});

		}
		, init = function (){
			isInitialized = !0
			start();
		}
		, start = function (){
			if(isRunning){return}
			robotTW2.ready(function(){
				data_deposit.get().interval = conf.INTERVAL.DEPOSIT;
				data_deposit.set(data_deposit.get());
				isRunning = !0
				robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DEPOSIT"})
				!listener_job_collect ? listener_job_collect = robotTW2.services.$rootScope.$on(robotTW2.providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTED, function(){robotTW2.services.$timeout(function(){verify_deposit()}, 3000)}) : listener_job_collect;
				!listener_job_rerolled ? listener_job_rerolled = robotTW2.services.$rootScope.$on(robotTW2.providers.eventTypeProvider.RESOURCE_DEPOSIT_JOBS_REROLLED, function(){robotTW2.services.$timeout(function(){verify_deposit()}, 3000)}) : listener_job_rerolled;
				!listener_job_collectible ? listener_job_collectible = robotTW2.services.$rootScope.$on(robotTW2.providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTIBLE, function(){robotTW2.services.$timeout(function(){verify_deposit()}, 3000)}) : listener_job_collectible;
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
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DEPOSIT"})
			robotTW2.services.$timeout.cancel(interval_deposit);
			interval_deposit = undefined;
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
			version			: "1.0.0",
			name			: "deposit",
		}
	})()
})