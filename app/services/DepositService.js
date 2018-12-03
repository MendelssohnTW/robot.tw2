define("robotTW2/services/DepositService", [
	"robotTW2",
	"helper/time",
	"robotTW2/conf"
	], function(
			robotTW2,
			helper,
			conf
	){
	return (function DepositService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			ready
	) {

		var isInitialized = !1 
		, isRunning = !1
		, list = []
		, interval_deposit = null
		, interval_deposit_collect = null
		, listener_job_collect = undefined
		, listener_job_rerolled = undefined
		, listener_job_collectible = undefined
		, startJob = function(job) {
			console.log("iniciando job")
			$rootScope.data_deposit.interval = job.duration
			setList();
			socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_START_JOB, {
				job_id: job.id
			})
		}
		, collectJob = function(job) {
			console.log("coletando job")
			socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_COLLECT, {
				job_id: job.id,
				village_id: modelDataService.getSelectedVillage().getId()
			})
		}
		, readyJobs = function (resourceDepositModel) {
			console.log("verificando job disponivel para iniciar")
			var resourceDepositModel = modelDataService.getSelectedCharacter().getResourceDeposit();
			var a;
			return resourceDepositModel && resourceDepositModel.isAvailable() ? (a = resourceDepositModel.getReadyJobs(),
					!resourceDepositModel.getCurrentJob() && a && a.length > 0) : !1
		}
		, collectibleJobs = function () {
			console.log("verificando job disponivel para coletar")
			var resourceDepositModel = modelDataService.getSelectedCharacter().getResourceDeposit();
			return resourceDepositModel && resourceDepositModel.isAvailable() && !!resourceDepositModel.getCollectibleJobs()
		}
		, verify_deposit = function() {
			console.log("verificando deposito")
			socketService.emit(providers.routeProvider.RESOURCE_DEPOSIT_OPEN);
			$timeout(function(){
				var resourceDepositModel = modelDataService.getSelectedCharacter().getResourceDeposit();
				if (isRunning && resourceDepositModel != undefined && $rootScope.data_deposit.activated) {
					console.log("verificando jobs")
					var currentJob = resourceDepositModel.getCurrentJob();
					if(currentJob){
						console.log("existe job corrente")
						$rootScope.data_deposit.interval = currentJob.model.completedAt - helper.gameTime()
						console.log("intervalo setado " + $rootScope.data_deposit.interval)
						$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT)
						wait();
					} else {
						console.log("não existe job corrente")
						if (collectibleJobs()) {
							console.log("existe job para coletar")
							var job = resourceDepositModel.getCollectibleJobs().shift();
							job ? collectJob(job) : null;
						} else if (readyJobs()) {
							console.log("não existe job para coletar, mas existe job pra iniciar")
							var job = resourceDepositModel.getReadyJobs().shift();
							job ? startJob(job) : null;
						} else {
							console.log("não existe job para coletar e nem job para iniciar")
							var reroll = modelDataService.getInventory().getItemByType("resource_deposit_reroll");
							if (reroll && reroll.amount > 0 && $rootScope.data_deposit.use_reroll && resourceDepositModel.getMilestones().length){
								socketService.emit(providers.routeProvider.PREMIUM_USE_ITEM, {
									village_id: modelDataService.getSelectedVillage().getId(),
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
			}, 5000)
		}
		, setList = function(callback){
			console.log("setando intevalo")
			list.push(conf.MIN_INTERVAL)
			list.push($rootScope.data_deposit.interval)
			var t = Math.min.apply(null, list)
			$rootScope.data_deposit.interval = t
			$rootScope.data_deposit.complete = helper.gameTime() + t
			console.log("próximo ciclo " + new Date($rootScope.data_deposit.complete))
			list = [];
			$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE_DEPOSIT)
			if(callback && typeof(callback) == "function"){callback(t)}
		}
		, wait = function(){
			console.log("aguardando")
			setList(function(tm){
				if(!interval_deposit){
					interval_deposit = $timeout(function(){verify_deposit()}, tm)
				} else {
					$timeout.cancel(interval_deposit);
					interval_deposit = undefined;
					interval_deposit = $timeout(function(){verify_deposit()}, tm)
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
				$rootScope.data_deposit.interval = conf.INTERVAL.DEPOSIT;
				isRunning = !0
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DEPOSIT"})
				!listener_job_collect ? listener_job_collect = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTED, function(){$timeout(function(){verify_deposit()}, 3000)}) : listener_job_collect;
				!listener_job_rerolled ? listener_job_rerolled = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOBS_REROLLED, function(){$timeout(function(){verify_deposit()}, 3000)}) : listener_job_rerolled;
				!listener_job_collectible ? listener_job_collectible = $rootScope.$on(providers.eventTypeProvider.RESOURCE_DEPOSIT_JOB_COLLECTIBLE, function(){$timeout(function(){verify_deposit()}, 3000)}) : listener_job_collectible;
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
			$timeout.cancel(interval_deposit);
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
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.ready
	)
})
