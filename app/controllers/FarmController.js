define("robotTW2/controllers/FarmController", [
	"robotTW2",
	"helper/time",
	"robotTW2/services",
	], function(
			robotTW2,
			helper,
			services
	){
	return function FarmController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		var self = this;

		
		var update = function () {

//			var dataAtual = services.$filter("date")(new Date(helper.gameTime()), "yyyy-MM-dd");
			var getMillisecondsJourneyTime = helper.readableMilliseconds($rootScope.data_farm.journey_time);
			var getMillisecondsFarmTime = helper.readableMilliseconds($rootScope.data_farm.farm_time);

			if($rootScope.data_farm.farm_time_start < helper.gameTime()) {
				$rootScope.data_farm.farm_time_start = helper.gameTime();
			}

			if($rootScope.data_farm.farm_time_stop < $rootScope.data_farm.farm_time_start) {
				$rootScope.data_farm.farm_time_start
				$rootScope.data_farm.farm_time_stop = helper.gameTime();
			}

			robotTW2.services.FarmService.isRunning() && robotTW2.services.FarmService.isPaused() ? $scope.status = "paused" : robotTW2.services.FarmService.isRunning() && (typeof(robotTW2.services.FarmService.isPaused) == "function" && !robotTW2.services.FarmService.isPaused()) ? $scope.status = "running" : $scope.status = "stopped";

//			$scope.data_farm = data_farm;
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		}
//		$scope.extensions = data_main.getExtensions();
//		$scope.isRunning = robotTW2.services.FarmService.isRunning();
//		$scope.paused = robotTW2.services.FarmService.isPaused();
//		var villages = services.modelDataService.getSelectedCharacter().getVillages()
//		for (v in villages) {
//		data_farm.list_ativate[v] == undefined ? data_farm.list_ativate[v] = true : null;
//		}

//		for (v in $scope.data.list_ativate) {
//		!villages[v] ? delete $scope.data.list_ativate[v] : null
//		}

//		data_farm.setFarm($scope.data);


		$scope.blur = function (callback) {
			$scope.journey_time = $("#journey_time").val()
			$scope.farm_time = $("#farm_time").val()
			$scope.inicio_de_farm = $("#inicio_de_farm").val()
			$scope.termino_de_farm = $("#termino_de_farm").val()
			$scope.data_termino_de_farm = $("#data_termino_de_farm").val()
			$scope.data_inicio_de_farm = $("#data_inicio_de_farm").val()

			if($scope.journey_time.length <= 5) {
				$scope.journey_time = $scope.journey_time + ":00"
			}

			if($scope.farm_time.length <= 5) {
				$scope.farm_time = $scope.farm_time + ":00"
			}

			var tempo_escolhido_inicio = new Date($scope.data_inicio_de_farm + " " + $scope.inicio_de_farm).getTime();
			var tempo_escolhido_termino = new Date($scope.data_termino_de_farm + " " + $scope.termino_de_farm).getTime();

			if(tempo_escolhido_inicio > tempo_escolhido_termino) {
				tempo_escolhido_termino = new Date(tempo_escolhido_termino + 86400000)
				$scope.termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "HH:mm:ss");
				$scope.data_termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "yyyy-MM-dd");
			}


			document.getElementById("data_termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "yyyy-MM-dd");
			document.getElementById("data_inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "yyyy-MM-dd");
			document.getElementById("termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "HH:mm:ss");
			document.getElementById("inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "HH:mm:ss");

			$rootScope.data_farm.journey_time = helper.unreadableSeconds($scope.journey_time) * 1000
			$rootScope.data_farm.farm_time = helper.unreadableSeconds($scope.farm_time) * 1000
			$rootScope.data_farm.farm_time_start = tempo_escolhido_inicio
			$rootScope.data_farm.farm_time_stop = tempo_escolhido_termino

			update()

			if(callback != undefined && typeof(callback) == "function") {
				callback()
			}
		}


		$scope.$watchCollection("village.farm_activate", function () {
			//data_villages.setListAtivate(c, true)
		})

		$scope.deleteException = function (id_village) {
			$rootScope.data_farm.list_exceptions = $rootScope.data_farm.list_exceptions.filter(f => f != id_village) 
			if (!$rootScope.$$phase) $rootScope.$apply();
		}

		$scope.getVillage = function (id) {
			var village = services.modelDataService.getSelectedCharacter().getVillage(id);
			if(!village) {return null}
			return village.getName() + " - (" + village.getX() + "|" + village.getY() + ")"
		}

		var my_village_id = services.modelDataService.getSelectedVillage().getId();

		function getDetailsExceptions() {
			$scope.list_exceptions = {};
			$rootScope.data_farm.list_exceptions.forEach(function (vid) {
				services.socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
					'village_id'	: vid,
					'my_village_id'	: my_village_id,
					'num_reports'	: 5
				}, function (data) {
					$scope.list_exceptions[data.village_id] = {
							village_name : data.village_name,
							village_x : data.village_x,
							village_y : data.village_y
					}
					if (!$rootScope.$$phase) $rootScope.$apply();
				})
			})
		}

		getDetailsExceptions();

		$scope.start_farm = function () {
			$scope.blur(function () {
				robotTW2.services.FarmService.start();
				$scope.isRunning = robotTW2.services.FarmService.isRunning();
			});
		}
		$scope.stop_farm = function () {
			robotTW2.services.FarmService.stop();
		}
		$scope.pause_farm = function () {
			robotTW2.services.FarmService.pause();
			$scope.paused = !0;
		}
		$scope.resume_farm = function () {
			robotTW2.services.FarmService.resume();
			$scope.paused = !1;
		}

		$scope.setPreset = function (preset) {
			$scope.presetSelected = preset;
			if (!$rootScope.$$phase) $rootScope.$apply();
		}

		$scope.blurPreset = function () {
			$scope.presetSelected.journey_time = $("#journey_time").val()
		}
        
        $scope.date_ref = new Date(0);
        
        $scope.getFarmTime = function () {
            var tm = helper.readableMilliseconds($rootScope.data_farm.farm_time);
            if(tm.length == 7) {
                tm = "0" + tm;
            }
            return tm;
        }
        
        $scope.getPresetSelectedJourneyTime = function () {
            var tm = helper.readableMilliseconds($scope.presetSelected.journey_time);
            if(tm.length == 7) {
                tm = "0" + tm;
            }
            return tm;
        }

		$scope.presetSelected = $rootScope.data_farm.presets[Object.keys($rootScope.data_farm.presets)[0]]

		$rootScope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
			if(!data) {return} 
			update();
		})

//		$(".win-foot .btn-orange").forEach(function (d) {
//		d.setAttribute("style", "min-width:80px")
//		})
		update()

		return $scope;
	}
})