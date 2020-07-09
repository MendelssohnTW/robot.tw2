define("robotTW2/controllers/AttackCompletionController", [
	"robotTW2/services",
	"robotTW2/unreadableSeconds",
	"robotTW2/readableSeconds",
	"helper/recruiting",
	"helper/time",
	"robotTW2/time",
	"robotTW2/notify",
	"robotTW2/databases/data_attack"
], function (
	services,
	unreadableSeconds,
	readableSeconds,
	recruitingHelper,
	helperTime,
	time,
	notify,
	data_attack
) {
		return function AttackCompletionController($scope) {

			var self = this
				, inner_wrapper = document.querySelector(".inner-wrapper")
				, node_base = document.querySelector("[unit-operate-sliders]")
				, duration = 0

			if (!node_base) {
				return $scope;
			}

			inner_wrapper.setAttribute("style", "width: 930px");
			node_base.setAttribute("style", "display: inline-flex; position: relative; padding-bottom: 80px;width:100%;");

			function addSliderStyle() {
				var slider_set = document.querySelectorAll("[unit-operate-sliders] .unit-operate-slider .box-slider");
				var index = 0, length = slider_set.length;
				for (; index < length; index++) {
					slider_set[index].classList.add('set_slider_style');
				}
			}
			addSliderStyle()

			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.SCHEDULE = services.$filter("i18n")("SCHEDULE", services.$rootScope.loc.ale);

			$scope.date_init = services.$filter("date")(new Date(time.convertedTime()), "yyyy-MM-dd")
			$scope.hour_init = services.$filter("date")(new Date(time.convertedTime()), "HH:mm:ss")
			$scope.ms_init = 0;
			$scope.opt_units = {}
			$scope.army = {
				'officers': {},
				'units': {}
			}
			if (!$scope.itemOrder) { return }
			$scope.itemOrder.forEach(function (unit_type) {
				!$scope.opt_units[unit_type] ? $scope.opt_units[unit_type] = {} : $scope.opt_units[unit_type];
				$scope.opt_units[unit_type]["value"] = 0;
				$scope.opt_units[unit_type]["own"] = $scope.selectedVillage.getUnitInfo().getUnitsByType(unit_type).own;
			})

			if (data_attack.last_village == services.modelDataService.getSelectedVillage().getId()) {
				if (data_attack.opt_units && data_attack.unit_key_opt) {
					$scope.opt_units = data_attack.opt_units;
				}

				if (data_attack.officers_control && Object.keys(data_attack.officers_control).length) {
					$scope.officers = data_attack.officers_control
				}

				if (data_attack.unit_control && Object.keys(data_attack.unit_control).length && !data_attack.unit_key_opt) {
					Object.keys(data_attack.unit_control).map(function (elem) {
						if ($scope.availableUnits[elem] > 0) {
							$scope.rangeSlider[elem].value = data_attack.unit_control[elem]
						}
					})
				}
			}

			if (data_attack.date_control && data_attack.date_control > new Date(time.convertedTime())) {
				let dt_control = data_attack.date_control + 250
				$scope.date_init = services.$filter("date")(dt_control, "yyyy-MM-dd")
				$scope.hour_init = services.$filter("date")(dt_control, "HH:mm:ss")
				$scope.ms_init = new Date(dt_control).getMilliseconds()
			}

			$scope.enviarFull = false;
			$scope.armyEmpty = true;
			$scope.unitsEmpty = true;

			$scope.getClass = function (unit_type) {
				if (!unit_type) {
					return
				}
				return "icon-44x44 icon-44x44-unit-" + unit_type;
			}

			$scope.sendAttack = function () {

				if (!$scope.unitsEmpty && $scope.armyEmpty && !$scope.enviarFull) {
					data_attack["unit_key_opt"] = true;
					data_attack["opt_units"] = $scope.opt_units;
					let obj_units = {}
					Object.keys($scope.opt_units).map(function (key) {
						return $scope.opt_units[key].value > 0 ? obj_units[key] = parseInt($scope.opt_units[key].value) : undefined
					})
					$scope.unitsToSend = obj_units
				} else {
					data_attack["unit_key_opt"] = false;
				}

				$scope.army.officers = {}

				for (officerName in $scope.officers) {
					if ($scope.officers.hasOwnProperty(officerName)) {
						if ($scope.officers[officerName].checked === true) {
							$scope.army.officers[officerName] = true;
						}
					}
				}

				if ($scope.enviarFull) {
					$scope.durationInSeconds = 0;
				} else if (!$scope.unitsEmpty) {
					$scope.durationInSeconds = unreadableSeconds(duration);
				} else {
					$scope.durationInSeconds = unreadableSeconds($scope.properties.duration);
				}
				if ($scope.unitsEmpty && !$scope.enviarFull && $scope.armyEmpty) {
					notify("unity_select");
				} else {
					var get_data = document.querySelector("#input-date").value;
					var get_time = document.querySelector("#input-time").value;
					var get_ms = document.querySelector("#input-ms").value;
					if (get_time.length <= 5) {
						get_time = get_time + ":00";
					}
					if (get_data != undefined && get_time != undefined) {
						$scope.milisegundos_duracao = $scope.durationInSeconds * 1000;
						$scope.tempo_escolhido = new Date(get_data + " " + get_time + "." + get_ms).getTime();
						data_attack["date_control"] = $scope.tempo_escolhido
						data_attack["unit_control"] = $scope.unitsToSend;
						data_attack["officers_control"] = $scope.officers;
						data_attack["last_village"] = services.modelDataService.getSelectedVillage().getId()
						data_attack.set()
						if ($scope.tempo_escolhido > time.convertedTime() + $scope.milisegundos_duracao) {
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

			$scope.$watch("enviarFull", function () {
				if (!$scope.enviarFull) {
					return
				}
				Object.values($scope.rangeSlider).map(function (elem) {
					return elem.value = 0;
				})
				Object.keys($scope.opt_units).map(function (key) {
					return $scope.opt_units[key]["value"] = 0
				})
			}, true)

			var updateArrival = function () {
				let date = helperTime.gameDate(),
					dateWithoutOfficers = helperTime.gameDate(),
					haveUnitsToSend = !recruitingHelper.unitsIsZero($scope.unitsToSend);

				if ($scope.durationInSeconds !== null && $scope.durationInSeconds !== Infinity) {
					date.setSeconds(date.getSeconds() + $scope.durationInSeconds);
					dateWithoutOfficers.setSeconds(dateWithoutOfficers.getSeconds() + $scope.durationInSecondsWithoutOfficers);

					$scope.arrivalIn = services.$filter('readableDateFilter')(date.getTime(), services.$rootScope.loc.ale, services.$rootScope.GAME_TIMEZONE, services.$rootScope.GAME_TIME_OFFSET, 'mediumTime');
					$scope.arrivalInWithoutOfficers = services.$filter('readableDateFilter')(dateWithoutOfficers.getTime(), services.$rootScope.loc.ale, services.$rootScope.GAME_TIMEZONE, services.$rootScope.GAME_TIME_OFFSET, 'mediumTime');
				} else {
					$scope.arrivalIn = readableSeconds($scope.tempo_escolhido || 0);
				}
				$scope.nightModeActiveOnArrival = haveUnitsToSend && !$scope.target.data.barbarianVillage && services.modelDataService.getWorldConfig().checkNightModeGameTime(date.getTime());

			}

			$scope.$watch("rangeSlider", function () {
				$scope.armyEmpty = !Object.values($scope.rangeSlider).some(f => f.value > 0)
				if (!$scope.armyEmpty) {
					Object.keys($scope.opt_units).map(function (key) {
						return $scope.opt_units[key]["value"] = 0
					})
					helperTime.timer.remove(updateArrival);
				}
			}, true)

			$scope.$watch("opt_units", function () {
				$scope.army.units = {}
				$scope.unitsEmpty = !Object.values($scope.opt_units).some(f => f.value > 0)
				if ($scope.unitsEmpty) {
					helperTime.timer.remove(updateArrival);
				} else if ($scope.unitsEmpty && $scope.armyEmpty) {
					$scope.arrivalIn = readableSeconds($scope.tempo_escolhido || 0);
					$scope.arrivalInWithoutOfficers = readableSeconds($scope.tempo_escolhido || 0);
					$scope.properties.duration = readableSeconds(0);
					$scope.properties.durationWithoutOfficers = readableSeconds(0);
					$scope.officerChangesDuration = ($scope.properties.duration < $scope.properties.durationWithoutOfficers);
				} else {
					Object.values($scope.rangeSlider).map(function (elem) {
						return elem.value = 0;
					})

					helperTime.timer.add(updateArrival);

					Object.keys($scope.opt_units).map(function (key) {
						if ($scope.opt_units[key]["value"] > 0) {
							if ($scope.opt_units[key]["value"] > $scope.opt_units[key]["own"]) {
								$scope.opt_units[key]["value"] = $scope.opt_units[key]["own"]
							}
							$scope.army.units[key] = parseInt($scope.opt_units[key]["value"])
						}
					})

					$scope.properties = services.armyService.calculateArmy($scope.army, {
						'barbarian': $scope.target.data.barbarianVillage,
						'ownTribe': ($scope.target.data.affiliation === "own") || ($scope.target.data.affiliation === "tribe")
					}, $scope.activeTab);
					$scope.propertiesWithoutOfficers = services.armyService.calculateArmy($scope.army, {
						'barbarian': $scope.target.data.barbarianVillage,
						'ownTribe': ($scope.target.data.affiliation === "own") || ($scope.target.data.affiliation === "tribe"),
						'officers': false
					}, $scope.activeTab);

					$scope.durationInSeconds = services.armyService.getTravelTimeForDistance($scope.army, $scope.properties.travelTime, $scope.distance, $scope.activeTab, true);
					$scope.durationInSecondsWithoutOfficers = services.armyService.getTravelTimeForDistance($scope.army, $scope.propertiesWithoutOfficers.travelTime, $scope.distance, $scope.activeTab);

					duration = $scope.properties.duration = readableSeconds($scope.durationInSeconds);
					durationWithoutOfficers = $scope.properties.durationWithoutOfficers = readableSeconds($scope.durationInSecondsWithoutOfficers);
					$scope.officerChangesDuration = ($scope.properties.duration < $scope.properties.durationWithoutOfficers);

					//$scope.$on(eventTypeProvider.VILLAGE_COMPUTED_RESOURCES_CHANGED,	onVillageComputedResourcesChanged);
				}
			}, true)

			$scope.$on("$destroy", function () {
				data_attack.set();
				helperTime.timer.remove(updateArrival);
			});

			if (!$scope.$$phase) {
				$scope.$apply();
			}

			return $scope;
		}
	})