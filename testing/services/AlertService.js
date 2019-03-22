define("robotTW2/services/AlertService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/databases/data_alert",
	], function(
			robotTW2,
			version,
			data_alert
	){
	return (function AlertService(
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
		, interval_alert = null
		, listener_alert_ready = undefined
		, listener_tab_alert = undefined
		, notifyAttacks = function() {
			$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_DEBUG, {message: $filter("i18n")("text_underattack", $rootScope.loc.ale, "alert")})
		}
		, verify_alert = function(){
			try {
				socketService.emit(providers.routeProvider.TRIBE_GET_MEMBERLIST, {'tribe': robotTW2.services.modelDataService.getSelectedCharacter().getTribeId()}, function (o) {
					$timeout(_ => {
						var friends = data_alert.friends;
						if (o.members != undefined){
							if (o.members.filter(f => f.under_attack && friends.some(s => s === f.name)).length) {
								notifyAttacks();
							}
						}
					}, 2000);
				});
			} catch (Error){
				$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: "Erro ao carregar dados dos membros da tribo"})
			}
		}
		, wait = function(){
			if(!interval_alert){
				interval_alert = setInterval(verify_alert, data_alert.interval)
			}
		}
		, init = function (){
			isInitialized = !0
			start();
			wait();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
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
			version			: version.ALERT,
			name			: "alert"
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