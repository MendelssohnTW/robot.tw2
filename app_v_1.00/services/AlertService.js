define("robotTW2/services/AlertService", [
	"robotTW2",
	"robotTW2/conf",
	"robotTW2/databases/data_alert",
	"conf/conf"
	], function(
			robotTW2,
			conf,
			data_alert,
			conf_conf
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
			let members = modelDataService.getSelectedCharacter().getTribeMemberModel()
			, friends = data_alert.friends;
			if (members != undefined){
				if (members.data.filter(f => f.under_attack && friends.some(s => s === f.name)).length) {
					notifyAttacks();
				}
			} else {
				socketService.emit(providers.routeProvider.TRIBE_GET_MEMBERLIST, {'tribe': modelDataService.getSelectedCharacter().getTribeId()});
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
			version			: conf.VERSION.ALERT,
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