define("robotTW2/services/FarmService", [
	"robotTW2"
	], function(
			robotTW2
	){
	return (function FarmService() {

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
			name			: "farm",
			analytics 		: function () {
				ga("create", "UA-115071391-2", "auto", "RobotTW2");
				ga('send', 'pageview');
				ga('RobotTW2.set', 'appName', 'RobotTW2');
				var player = robotTW2.services.modelDataService.getPlayer()
				, character = player.getSelectedCharacter()
				, e = [];
				e.push(character.getName()),
				e.push(character.getId()),
				e.push(character.getWorldId()),
				robotTW2.requestFn.bind("Farm/sendCmd", function () {
					ga("RobotTW2.send", "event", "commands", "farm_command", e.join("~"))
				})
				robotTW2.requestFn.bind("Farm/run", function () {
					ga("RobotTW2.send", "event", "run", "farm_run", e.join("~"))
				})
				robotTW2.requestFn.bind("Farm/cicle", function () {
					ga("RobotTW2.send", "event", "cicle", "farm_cicle", e.join("~"))
				})
			}
		}
	})()
})