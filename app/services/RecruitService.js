define("robotTW2/services/RecruitService", [
	"robotTW2"
	], function(
			robotTW2
	){
	return (function RecruitService() {

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
			version			: "1.0.0",
			name			: "recruit",
		}

	})()
})