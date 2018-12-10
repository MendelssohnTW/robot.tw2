define("robotTW2/services/MedicService", [
	"robotTW2",
	"robotTW2/version"
	], function(
			robotTW2,
			version
	){
	return (function MedicService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			ready
	) {

		var init = function(){
			
		}
		, start, stop, pause, resume, isRunning, isPaused, isInitialized;
		return	{
			init			: init,
			start			: start,
			stop 			: stop,
			pause 			: pause,
			resume 			: resume,
			isRunning		: function () {
				return isRunning
			},
			isPaused		: function () {
				return isPaused
			},
			isInitialized	: function () {
				return isInitialized
			},
			version			: version.medic,
			name			: "medic",
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