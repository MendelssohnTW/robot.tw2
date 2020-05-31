define("robotTW2/services/ExtensionService", [
	"robotTW2",
	"robotTW2/conf"
	], function(
			robotTW2,
			conf
	){
	return (function ExtensionService(
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
		, init = function (){
			isInitialized = !0
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				isRunning = !0;
				
				var port = chrome.runtime.connect({name: "knockknock"});
				port.onMessage.addListener(function(msg) {
					if (msg.question == "Who's there?")
						port.postMessage({answer: "Madame"});
					else if (msg.question == "Madame who?")
						port.postMessage({answer: "Madame... Bovary"});
				});
				
			}, ["all_villages_ready"])
		}
		, stop = function (){
			isRunning = !1;
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