define("robotTW2/controllers/FarmController", [
	"helper/time",
	"robotTW2/services",
	"robotTW2/providers",
	], function(
			helper,
			services,
			providers
	){
	return function FarmController($rootScope, $scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.START = services.$filter("i18n")("START", $rootScope.loc.ale);
		$scope.STOP = services.$filter("i18n")("STOP", $rootScope.loc.ale);
		$scope.PAUSE = services.$filter("i18n")("PAUSE", $rootScope.loc.ale);
		$scope.RESUME = services.$filter("i18n")("RESUME", $rootScope.loc.ale);
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

			services.FarmService.isRunning() && services.FarmService.isPaused() ? $scope.status = "paused" : services.FarmService.isRunning() && (typeof(services.FarmService.isPaused) == "function" && !services.FarmService.isPaused()) ? $scope.status = "running" : $scope.status = "stopped";

//			$scope.data_farm = data_farm;
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		}

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
				services.FarmService.start();
				$scope.isRunning = services.FarmService.isRunning();
			});
		}
		$scope.stop_farm = function () {
			services.FarmService.stop();
		}
		$scope.pause_farm = function () {
			services.FarmService.pause();
			$scope.paused = !0;
		}
		$scope.resume_farm = function () {
			services.FarmService.resume();
			$scope.paused = !1;
		}

		$scope.setPreset = function (preset) {
			$scope.presetSelected = preset;
			if (!$scope.$$phase) $scope.$apply();
		}
		
		$scope.setVillage = function (village) {
			$scope.villageSelected = village;
			if (!$scope.$$phase) $scope.$apply();
		}

		$scope.blurPreset = function () {
			$scope.presetSelected.journey_time = $("#journey_time").val()
		}
		
		var addQuadrant = function(pos){
			$scope.villageSelected.quadrants.push(pos)
			$scope.villageSelected.quadrants.sort(function(a,b){return a-b})
			if (!$scope.$$phase) $scope.$apply();
		}

		var remQuadrant = function(pos){
			$scope.villageSelected.quadrants = $scope.villageSelected.quadrants.filter(f => f != pos);
			if (!$scope.$$phase) $scope.$apply();
		}

		$scope.setQuadrant = function (pos) {
			if($scope.villageSelected.quadrants.includes(pos)){
				remQuadrant(pos)
			} else {
				addQuadrant(pos)
			}
		}

		$scope.getQuadrant = function (pos) {
			return $scope.villageSelected.quadrants.includes(pos)
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
		$scope.villageSelected = $rootScope.data_villages.villages[Object.keys($rootScope.data_villages.villages)[0]]

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