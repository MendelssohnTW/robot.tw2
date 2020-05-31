define("robotTW2/controllers/AttackCompletionController", [
	"robotTW2/services",
	"robotTW2/unreadableSeconds", 
	"robotTW2/time",
	"robotTW2/notify"
	], function(
			services,
			unreadableSeconds,
			time,
			notify
	){
	return function AttackCompletionController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.SCHEDULE = services.$filter("i18n")("SCHEDULE", services.$rootScope.loc.ale);

		var self = this;

		$scope.date_init = services.$filter("date")(new Date(time.convertedTime()), "yyyy-MM-dd")
		$scope.hour_init = services.$filter("date")(new Date(time.convertedTime()), "HH:mm:ss")
		$scope.ms_init = 0;
		$scope.enviarFull = false;

		$scope.sendAttack = function(){

			$scope.army = {
					'officers': {}
			}
			for (officerName in $scope.officers) {
				if ($scope.officers.hasOwnProperty(officerName)) {
					if ($scope.officers[officerName].checked === true) {
						$scope.army.officers[officerName] = true;
					}
				}
			}

			var durationInSeconds = unreadableSeconds($scope.properties.duration);
			if ($scope.enviarFull){
				durationInSeconds = 0;
			}
			if ($scope.armyEmpty && !$scope.enviarFull){
				notify("unity_select");
			} else {
				var get_data = document.querySelector("#input-date").value;
				var get_time = document.querySelector("#input-time").value;
				var get_ms = document.querySelector("#input-ms").value;
				if (get_time.length <= 5){
					get_time = get_time + ":00"; 
				}
				if (get_data != undefined && get_time != undefined){
					$scope.milisegundos_duracao = durationInSeconds * 1000;
					$scope.tempo_escolhido = new Date(get_data + " " + get_time + "." + get_ms).getTime();
					if ($scope.tempo_escolhido > time.convertedTime() + $scope.milisegundos_duracao){
						services.AttackService.sendCommandAttack($scope);
						$scope.closeWindow();
					} else {
						notify("date_error");
					}       
				} else {
					return;
				}
			}
		}

		if (!$scope.$$phase) {
			$scope.$apply();
		}

		return $scope;
	}
})