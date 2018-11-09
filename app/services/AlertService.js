define("robotTW2/services/AlertService", [
	"robotTW2"
	], function(
			robotTW2
	){
	return (function AlertService(
			$rootScope,
			socketEmit,
			providers,
			modelDataService,
			$timeout
	) {
		var isInitialized = !1
		, isRunning = !1
		, interval_alert = null
		, listener_alert_ready = undefined
		, listener_tab_alert = undefined
		, notifyAttacks = function() {
			$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: "Jogadores sob ataque!"})
		}
		, verify_alert = function(){
			try {
				socketEmit(providers.routeProvider.TRIBE_GET_MEMBERLIST, {'tribe': robotTW2.services.modelDataService.getSelectedCharacter().getTribeId()}, function (o) {
					$timeout(_ => {
						var friends = $rootScope.data_alert.friends;
						if (o.members != undefined){
							if (o.members.filter(f => f.under_attack && friends.some(s => s === f.name)).length) {
								notifyAttacks();
							}
						}
						wait();
					}, 2000);
				});
			} catch (Error){
				wait();
				$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: "Erro ao carregar dados dos membros da tribo"})
			}
		}
		, wait = function(){
			if(!interval_alert){
				interval_alert = $timeout(verify_alert, $rootScope.data_alert.interval)
			} else {
				$timeout.cancel(interval_alert);
				interval_alert = $timeout(verify_alert, $rootScope.data_alert.interval)
			}
		}
		, init = function (){
			isInitialized = !0
			start();
		}
		, start = function (){
			if(isRunning){return}
			robotTW2.ready(function(){
				isRunning = !0;
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"ALERT"})
				verify_alert()
			}, ["tribe_relations"])
		}
		, stop = function (){
			isRunning = !1;
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"ALERT"})
			typeof(listener_tab_alert) == "function" ? listener_tab_alert(): null;
			listener_tab_alert = undefined;
			$timeout.cancel(interval_alert);
			interval_alert = undefined;
		}
		return	{
			init			: init,
			start 			: start,
			stop 			: stop,
			isRunning		: function() {
				return isRunning
			},
			isInitialized	: function(){
				return isInitialized
			},
			version			: "1.0.0",
			name			: "alert"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.socketEmit,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout
	)
})