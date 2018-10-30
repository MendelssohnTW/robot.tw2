define("robotTW2/services/AlertService", [
	"robotTW2"
	], function(
			robotTW2
	){
	return (function AlertService() {
		var isInitialized = !1
		, isRunning = !1
		, interval_alert = null
		, listener_alert_ready = undefined
		, listener_tab_alert = undefined
		, data_alert = robotTW2.databases.data_alert
		, db = data_alert.get()
		, notifyAttacks = function() {
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.MESSAGE_DEBUG, {message: "Jogadores sob ataque!"})
		}
		, verify_alert = function(){
			try {
				robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.TRIBE_GET_MEMBERLIST, {'tribe': robotTW2.services.modelDataService.getSelectedCharacter().getTribeId()}, function (o) {
					robotTW2.services.$timeout(_ => {
						var friends = db.getFriends();
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
				robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.MESSAGE_ERROR, {message: "Erro ao carregar dados dos membros da tribo"})
			}
		}
		, wait = function(){
			if(!interval_alert){
				interval_alert = robotTW2.services.$timeout(verify_alert, db.getTimeCicle())
			} else {
				robotTW2.services.$timeout.cancel(interval_alert);
				interval_alert = robotTW2.services.$timeout(verify_alert, db.getTimeCicle())
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
				robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"ALERT"})
				verify_alert()
			}, ["tribe_relations"])
		}
		, stop = function (){
			isRunning = !1;
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"ALERT"})
			typeof(listener_tab_alert) == "function" ? listener_tab_alert(): null;
			listener_tab_alert = undefined;
			robotTW2.services.$timeout.cancel(interval_alert);
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
	})()
})