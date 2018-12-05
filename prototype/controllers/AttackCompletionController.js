define("robotTW2/controllers/AttackCompletionController", [
	"robotTW2/services",
	"helper/time",
	"robotTW2/time"
	], function(
			services,
			helper,
			converted
	){
	return function AttackCompletionController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.SCHEDULE = services.$filter("i18n")("SCHEDULE", $rootScope.loc.ale);
		
		var self = this;

		$scope.date_init = services.$filter("date")(new Date(converted.gameTime()), "yyyy-MM-dd")
		$scope.hour_init = services.$filter("date")(new Date(converted.gameTime()), "HH:mm:ss")
		$scope.ms_init = 0;
		$scope.enviarFull = false;
//		$scope.btnActive = false;

		$scope.sendAttack = function(){
			services.AttackService.sendCommandAttack($scope)
		}

//		$scope.toggleFull = function(elem){
//
//			$scope.enviarFull = elem.enviarFull;
//			$scope.btnActive = !$scope.armyEmpty || $scope.enviarFull;
//			if (!$scope.$$phase) {
//				$scope.$apply();
//			}
//		}

//		$scope.$watch("armyEmpty", function(){
//			$scope.btnActive = !$scope.armyEmpty || $scope.enviarFull;
//
//			if (!$scope.$$phase) {
//				$scope.$apply();
//			}
//		})

		if (!$scope.$$phase) {
			$scope.$apply();
		}

		return $scope;
	}
})