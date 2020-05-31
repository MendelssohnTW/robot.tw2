define("robotTW2/controllers/HeadquarterController", [
	"helper/time",
	"robotTW2/time",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_headquarter",
	"robotTW2/databases/data_buildingorder",
	"robotTW2/databases/data_buildinglimit",
	"robotTW2/databases/data_buildinglist"
], function (
	helper,
	time,
	services,
	providers,
	conf,
	data_villages,
	data_headquarter,
	data_buildingorder,
	data_buildinglimit,
	data_buildinglist
) {
		return function HeadquarterController($scope) {
			$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
			$scope.SAVE = services.$filter("i18n")("SAVE", services.$rootScope.loc.ale);
			$scope.INCLUDE = services.$filter("i18n")("INCLUDE", services.$rootScope.loc.ale);
			$scope.APPLY = services.$filter("i18n")("APPLY", services.$rootScope.loc.ale);
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
			$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
			$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);
			$scope.local_data_villages = [];
			$scope.local_included_villages = []
			$scope.local_data_select = []
			$scope.data_headquarter = data_headquarter
			$scope.data_buildingorder = data_buildingorder
			$scope.data_buildinglimit = data_buildinglimit
			$scope.data_buildinglist = data_buildinglist
			$scope.data_villages = data_villages;
			$scope.text_version = $scope.version + " " + data_headquarter.version;
			$scope.toggle_option = "check_one";
			$scope.status = "stopped";

			var buildingTypes = services.modelDataService.getGameData().getBuildingTypes()
				, buildings = services.modelDataService.getGameData().getBuildings()
				, update_status = function () {
					services.HeadquarterService.isRunning() && services.HeadquarterService.isPaused() ? $scope.status = "paused" : services.HeadquarterService.isRunning() && (typeof (services.HeadquarterService.isPaused) == "function" && !services.HeadquarterService.isPaused()) ? $scope.status = "running" : $scope.status = "stopped";
					if (!$scope.$$phase) { $scope.$apply(); }
				}
				, set_list_obj = function (obj, str, desc) {
					if (!obj) { return }
					let list = []
					Object.keys(obj).map(function (key) {
						list.push({
							"name": key,
							"label": services.$filter("i18n")(key, services.$rootScope.loc.ale, str),
							"value": obj[key],
						})
					})
					if (desc == "name") {
						list.sort(function (a, b) { return a.name.localeCompare(b.name) })
					} else if (desc == true) {
						list.sort(function (a, b) { return a.value - b.value })
					} else {
						list.sort(function (a, b) { return a.value - b.value })
					}
					return list;
				}
				, set_list = function (obj, str) {
					if (!obj) { return }
					let list = []
					Object.keys(obj).map(function (key) {
						list.push({
							"name": Object.keys(obj[key])[0],
							"label": services.$filter("i18n")(Object.keys(obj[key])[0], services.$rootScope.loc.ale, str),
							"value": Object.values(obj[key])[0],
						})
					})
					return list;
				}
				, update_local_data_select = function () {
					if (!$scope.local_data_select || !$scope.local_data_select.length) {
						$scope.local_data_select = []
						Object.keys($scope.data_headquarter.selects).map(
							function (key) {
								$scope.local_data_select.push($scope.data_headquarter.selects[key])
								$scope.local_data_select.sort(function (a, b) { return a.name.localeCompare(b.name) })
								return $scope.local_data_select;
							}
						)
					}
					$scope.data_type = services.MainService.getSelects($scope.local_data_select, $scope.data_select.selectedOption.value.selected, "id")
				}
				, update_data_select = function () {
					$scope.data_select = services.MainService.getSelects($scope.local_data_villages, $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId()), "id")
				}
				, update_select = function () {
					$scope.data_select.selectedOption.value.selected = $scope.data_type.selectedOption
					update_select_limit()
					update_select_order()
					update_select_list()
				}
				, update_select_limit = function () {
					$scope.local_data_select_limit = []
					$scope.local_data_select_limit = set_list_obj($scope.data_buildinglimit.villages[$scope.data_select.selectedOption.id].buildinglimit[$scope.data_select.selectedOption.value.selected.value], "buildings", "name")

				}
				, update_select_order = function () {
					$scope.local_data_select_order = []
					$scope.local_data_select_order = set_list_obj($scope.data_buildingorder.villages[$scope.data_select.selectedOption.id].buildingorder[$scope.data_select.selectedOption.value.selected.value], "buildings")
				}
				, update_select_list = function () {
					$scope.local_data_select_list = []
					$scope.local_data_select_list = set_list($scope.data_buildinglist.villages[$scope.data_select.selectedOption.id].buildinglist[$scope.data_select.selectedOption.value.selected.value], "buildings")
				}

			$scope.getTimeRest = function () {
				return $scope.data_headquarter.complete > time.convertedTime() && services.HeadquarterService.isRunning() ? helper.readableMilliseconds($scope.data_headquarter.complete - time.convertedTime()) : 0;
			}

			$scope.getMax = function (item) {
				if (!item) { return }
				return item.value < services.modelDataService.getGameData().getBuildingDataForBuilding(item.name).max_level ? true : false;
			}

			$scope.getClass = function (key) {
				if (!key) { return }
				return "icon-20x20-building-" + key;
			}

			$scope.toggle_seq = function (seq) {
				if ($scope.data_select.selectedOption.value.seq_type) {
					$scope.data_select.selectedOption.value.seq_type = seq
				}
			}

			$scope.toggleOption = function (option) {
				if ($scope.toggle_option) {
					$scope.toggle_option = option
				}
			}

			$scope.start_headquarter = function () {
				services.HeadquarterService.start();
				update_status()
			}

			$scope.stop_headquarter = function () {
				services.HeadquarterService.stop();
				$scope.data_headquarter.complete = 0
				update_status()
			}

			$scope.pause_headquarter = function () {
				services.HeadquarterService.pause();
				$scope.paused = !0;
			}

			$scope.resume_headquarter = function () {
				services.HeadquarterService.resume();
				$scope.paused = !1;
			}

			$scope.restore_headquarter = function () {
				$scope.data_headquarter.interval = conf.INTERVAL.HEADQUARTER
				Object.values($scope.data_villages.villages).forEach(function (village) {
					angular.merge(village, {
						headquarter_activate: true,
						buildingorder: $scope.data_headquarter.buildingorder,
						buildinglimit: $scope.data_headquarter.buildinglimit,
						buildinglist: $scope.data_headquarter.buildinglist
					})
				})
				$scope.data_villages.set();
				if (!$scope.$$phase) $scope.$apply();
			}

			$scope.include_village = function () {
				if ($scope.local_included_villages.find(f => f.id != $scope.data_select.selectedOption["id"])) {
					$scope.local_included_villages.push({
						"name": $scope.data_select.selectedOption["name"],
						"label": $scope.data_select.selectedOption["label"],
						"id": $scope.data_select.selectedOption["id"],
					})
				}
			}

			$scope.exclude_village = function (id) {
				$scope.local_included_villages = $scope.local_included_villages.filter(f => f.id != id)
			}

			$scope.save_village = function () {
				Object.keys($scope.data_villages.villages).forEach(function (obj_village) {
					$scope.data_buildinglimit.villages[obj_village].buildinglimit = $scope.data_buildinglimit.villages[$scope.data_select.selectedOption.id].buildinglimit
					$scope.data_buildingorder.villages[obj_village].buildingorder = $scope.data_buildingorder.villages[$scope.data_select.selectedOption.id].buildingorder
					$scope.data_buildinglist.villages[obj_village].buildinglist = $scope.data_buildinglist.villages[$scope.data_select.selectedOption.id].buildinglist

					angular.merge($scope.data_villages.villages[obj_village], {
						selected: $scope.data_select.selectedOption.value.selected
					})
				})
				$scope.data_buildinglimit.set();
				$scope.data_buildingorder.set();
				$scope.data_buildinglist.set();
				$scope.data_villages.set();
			}

			$scope.apply_village = function () {
				Object.values($scope.local_included_villages).forEach(function (obj) {
					let village = $scope.data_villages.villages[obj.id]
					$scope.data_buildinglimit.villages[obj.id].buildinglimit = $scope.data_buildinglimit.villages[$scope.data_select.selectedOption.id].buildinglimit
					$scope.data_buildingorder.villages[obj.id].buildingorder = $scope.data_buildingorder.villages[$scope.data_select.selectedOption.id].buildingorder
					$scope.data_buildinglist.villages[obj.id].buildinglist = $scope.data_buildinglist.villages[$scope.data_select.selectedOption.id].buildinglist
				})
				$scope.data_buildinglimit.set();
				$scope.data_buildingorder.set();
				$scope.data_buildinglist.set();
				$scope.data_villages.set();
			}

			$scope.upselectlist = function (item, index) {

				let ant = $scope.local_data_select_list[index]
				let post = $scope.local_data_select_list[index - 1]

				$scope.local_data_select_list[index] = post
				$scope.local_data_select_list[index - 1] = ant

				$scope.data_buildinglist.villages[$scope.data_select.selectedOption.id].buildinglist[$scope.data_type.selectedOption.value][index] = { [post.name]: post.value }
				$scope.data_buildinglist.villages[$scope.data_select.selectedOption.id].buildinglist[$scope.data_type.selectedOption.value][index - 1] = { [ant.name]: ant.value }
				//			update_select_list();
			}

			$scope.downselectlist = function (item, index) {
				let ant = $scope.local_data_select_list[index]
				let post = $scope.local_data_select_list[index + 1]

				$scope.local_data_select_list[index] = post
				$scope.local_data_select_list[index + 1] = ant

				$scope.data_buildinglist.villages[$scope.data_select.selectedOption.id].buildinglist[$scope.data_type.selectedOption.value][index] = { [post.name]: post.value }
				$scope.data_buildinglist.villages[$scope.data_select.selectedOption.id].buildinglist[$scope.data_type.selectedOption.value][index + 1] = { [ant.name]: ant.value }
				//			update_select_list();
			}

			$scope.upselectorder = function (item) {
				var ant = $scope.local_data_select_order.find(f => f.value == item.value - 1)
				$scope.data_buildingorder.villages[$scope.data_select.selectedOption.id].buildingorder[$scope.data_type.selectedOption.value][item.name] -= 1
				$scope.data_buildingorder.villages[$scope.data_select.selectedOption.id].buildingorder[$scope.data_type.selectedOption.value][ant.name] += 1
				update_select_order();
			}

			$scope.downselectorder = function (item) {
				var prox = $scope.local_data_select_order.find(f => f.value == item.value + 1)
				$scope.data_buildingorder.villages[$scope.data_select.selectedOption.id].buildingorder[$scope.data_type.selectedOption.value][item.name] += 1
				$scope.data_buildingorder.villages[$scope.data_select.selectedOption.id].buildingorder[$scope.data_type.selectedOption.value][prox.name] -= 1
				update_select_order();
			}

			$scope.upselectlevel = function (key) {
				var max_level = services.modelDataService.getGameData().getBuildingDataForBuilding(key).max_level;
				if ($scope.data_buildinglimit.villages[$scope.data_select.selectedOption.id].buildinglimit[$scope.data_type.selectedOption.value][key] < max_level) {
					$scope.data_buildinglimit.villages[$scope.data_select.selectedOption.id].buildinglimit[$scope.data_type.selectedOption.value][key] += 1
					$scope.local_data_select_limit.find(f => f.name == key).value = $scope.data_buildinglimit.villages[$scope.data_select.selectedOption.id].buildinglimit[$scope.data_type.selectedOption.value][key]
					update_select_limit();
				}
			}

			$scope.downselectlevel = function (key) {
				if ($scope.data_buildinglimit.villages[$scope.data_select.selectedOption.id].buildinglimit[$scope.data_type.selectedOption.value][key] > 0) {
					$scope.data_buildinglimit.villages[$scope.data_select.selectedOption.id].buildinglimit[$scope.data_type.selectedOption.value][key] -= 1
					$scope.local_data_select_limit.find(f => f.name == key).value = $scope.data_buildinglimit.villages[$scope.data_select.selectedOption.id].buildinglimit[$scope.data_type.selectedOption.value][key]
					update_select_limit();
				}
			}

			$scope.$watch("data_logs.headquarter", function () {
				$scope.recalcScrollbar();
				if (!$scope.$$phase) { $scope.$apply() }
			}, true)

			$scope.$watch("data_select.selectedOption", function () {
				if (!$scope.data_select) { return }
				update_local_data_select()
				services.villageService.setSelectedVillage($scope.data_select.selectedOption.id)
				update_select()
			}, true)


			$scope.$watch("data_type.selectedOption", function () {
				if (!$scope.data_type) { return }
				update_select()
			}, true)

			$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
				if (!data || data.name != "HEADQUARTER") { return }
				update_status();
			})

			$scope.menu = function () {
				services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
			}

			update_status();

			$scope.$on("$destroy", function () {
				$scope.data_buildinglimit.set();
				$scope.data_buildingorder.set();
				$scope.data_buildinglist.set();
				$scope.data_villages.set();
				$scope.data_headquarter.set();
			});

			$scope.$on(providers.eventTypeProvider.VILLAGE_SELECTED_CHANGED, update_data_select);

			$scope.local_data_villages = services.VillService.getLocalVillages("headquarter", "label");
			update_data_select()
			//		update_local_data_select()

			return $scope;
		}
	})