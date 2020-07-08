define("robotTW2/controllers/FarmController", [
	"robotTW2",
	"helper/time",
	"robotTW2/time",
	"robotTW2/conf",
	"robotTW2/services",
	"robotTW2/providers",
	"conf/conf",
	"robotTW2/calculateTravelTime",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_presets",
	"robotTW2/databases/data_farm",
	"robotTW2/databases/data_log_farm",
	"helper/format",
	"robotTW2/autocomplete",
	"robotTW2/unreadableSeconds"
], function (
	robotTW2,
	helper,
	time,
	conf,
	services,
	providers,
	conf_conf,
	calculateTravelTime,
	data_villages,
	data_presets,
	data_farm,
	data_log_farm,
	formatHelper,
	autocomplete,
	unreadableSeconds
) {
		return function FarmController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.START = services.$filter("i18n")("START", services.$rootScope.loc.ale);
			$scope.STOP = services.$filter("i18n")("STOP", services.$rootScope.loc.ale);
			$scope.CREATE = services.$filter("i18n")("CREATE", services.$rootScope.loc.ale);
			$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
			$scope.REMOVE = services.$filter("i18n")("REMOVE", services.$rootScope.loc.ale);
			$scope.ADD = services.$filter("i18n")("ADD", services.$rootScope.loc.ale);
			$scope.SELECT = services.$filter("i18n")("SELECT", services.$rootScope.loc.ale);
			$scope.SEARCH_MAP = services.$filter('i18n')('SEARCH_MAP', services.$rootScope.loc.ale);
			$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

			$scope.update_all_presets = false;
			$scope.local_data_villages = [];
			$scope.data_villages = data_villages;
			$scope.data_presets = data_presets;
			$scope.data_farm = data_farm;
			$scope.data_log_farm = data_log_farm;
			$scope.logs = $scope.data_log_farm.logs;

			var self = this
				, TABS = {
					"TAB1": services.$filter("i18n")("settings", services.$rootScope.loc.ale, "farm"),
					"TAB2": services.$filter("i18n")("situational", services.$rootScope.loc.ale, "farm"),
					"TAB3": services.$filter("i18n")("text_presets", services.$rootScope.loc.ale, "farm"),
					"TAB4": services.$filter("i18n")("exceptions", services.$rootScope.loc.ale, "farm"),
					"TAB5": services.$filter("i18n")("log", services.$rootScope.loc.ale, "farm"),
				}
				, TAB_ORDER = [TABS.TAB1, TABS.TAB2, TABS.TAB3, TABS.TAB4, TABS.TAB5]
				/*, TAB_ORDER = Object.keys(TABS).map(function(elem){
					return TABS[elem]
				}).sort(function(a,b){return a.localeCompare(b)})*/ // Coloca a sequência das TABS pela ordem alfabética
				//, TAB_ORDER = [ TABS.TAB1, TABS.TAB2, TABS.TAB3, TABS.TAB4, TABS.TAB5] // Ou pode ser usado desta forma
				, presetId
				, key_control = false
				, r_farm_time
				, time_rest
				, loads_p = angular.copy(services.presetListService.getPresets())
				, presets_load = Object.keys(loads_p).map(function (key) { return angular.copy(loads_p[key]) })
				, presetListModel = services.modelDataService.getPresetList()
				, presetIds = []
				, rallyPointSpeedBonusVsBarbarians = services.modelDataService.getWorldConfig().getRallyPointSpeedBonusVsBarbarians()
				, getVillage = function getVillage(vid) {
					if (!vid) { return }
					return angular.copy(services.modelDataService.getSelectedCharacter().getVillage(vid))
				}
				, initTab = function initTab() {
					if (!$scope.activeTab) {
						setActiveTab($scope.requestedTab);
					}
				}
				, setActiveTab = function setActiveTab(tab) {
					$scope.activeTab = tab;
					$scope.activeTabName = Object.keys(TABS).map(function (tb) {
						return TABS[tb] == tab ? tb.toLowerCase() : undefined
					}).filter(f => f != undefined)[0];
					$scope.requestedTab = null;
					$scope.recalcScrollbar();
				}
				, update = function update() {
					if (!$scope.data_farm.infinite) {
						if (!$scope.data_farm.farm_time_start || $scope.data_farm.farm_time_start < time.convertedTime()) {
							$scope.data_farm.farm_time_start = time.convertedTime();
						}
						if (!$scope.data_farm.farm_time_stop || $scope.data_farm.farm_time_stop < $scope.data_farm.farm_time_start) {
							$scope.data_farm.farm_time_stop = $scope.data_farm.farm_time_start + 86400000;
						}
					}
					services.FarmService.isRunning() && services.FarmService.isPaused() ? $scope.status = "paused" : services.FarmService.isRunning() && (typeof (services.FarmService.isPaused) == "function" && !services.FarmService.isPaused()) ? $scope.status = "running" : $scope.status = "stopped";
					if (!$scope.$$phase) { $scope.$apply(); }
				}
				, get_dist = function get_dist(villageId, journey_time, units) {
					var village = services.modelDataService.getSelectedCharacter().getVillage(villageId)
						, units = units
						, army = {
							'officers': {},
							"units": units
						}
						, travelTime = calculateTravelTime(army, village, "attack", {
							'barbarian': true
						})

					return Math.trunc((journey_time / 1000 / travelTime) / 2) || 0;
				}
				, get_time = function get_time(villageId, bb, units) {
					var village = modelDataService.getVillage(village_id)
						, distance = math.actualDistance(village.getPosition(), {
							'x': bb.x,
							'y': bb.y
						})
						, army = {
							'officers': {},
							"units": units
						}
						, travelTime = calculateTravelTime(army, village, "attack", {
							'barbarian': true
						})

					return armyService.getTravelTimeForDistance(army, travelTime, distance, "attack") * 1000
				}
				, send_pst = undefined
				, send_pst_queue = []
				, assignPresets = function assignPresets(id, callback, list_ids) {
					var pst_ids = []
					list_ids ? pst_ids = list_ids : pst_ids = presetIds;
					if (!send_pst) {
						send_pst = new Promise(function (res, rej) {
							var timeout_preset = services.$timeout(function () {
								if (callback && typeof (callback) == "function") {
									res()
								}
							}, conf_conf.LOADING_TIMEOUT)
							services.socketService.emit(providers.routeProvider.ASSIGN_PRESETS, {
								'village_id': id,
								'preset_ids': pst_ids
							}, function (data) {
								services.$timeout.cancel(timeout_preset)
								timeout_preset = undefined
								res(data)
							});
						}).then(function (data) {
							send_pst = undefined
							if (callback && typeof (callback) == "function") {
								callback(data)
							}
							if (send_pst_queue.length) {
								let pst_q = send_pst_queue.shift()
								assignPresets(pst_q[0], pst_q[1], pst_q[2])
							} else {
								triggerUpdate()
							}
						}, function () {
							send_pst = undefined
							if (callback && typeof (callback) == "function") {
								callback(data)
							}
							if (send_pst_queue.length) {
								let pst_q = send_pst_queue.shift()
								assignPresets(pst_q[0], pst_q[1], pst_q[2])
							} else {
								triggerUpdate()
							}
						})
					} else {
						send_pst_queue.push([id, callback, pst_ids])
					}

				}
				, triggerUpdate = function triggerUpdate() {
					data_presets.getAssignedPresets();

					loads_p = angular.copy(services.presetListService.getPresets());
					presets_load = Object.keys(loads_p).map(function (key) { return angular.copy(loads_p[key]) });

					presetIds = [];
					$scope.data.presets = presets_load
					for (key in $scope.data.presets) {
						if ($scope.data.presets.hasOwnProperty(key)) {
							angular.extend($scope.data.presets[key], $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.presets[key].id])
						}
					}
					$scope.data.selectedOption = $scope.data.presets.find(f => f.id == $scope.data_presets.villages[$scope.village_selected.id].assigned_presets[0])
					presetIds = Object.values($scope.data_presets.villages[$scope.village_selected.id].assigned_presets).map(function (elem) { return elem })
					if (!key_control) {
						key_control = true;
						services.$timeout(function () {
							key_control = false;
							blurPreset()
						}, 1500)
					}
				}
				, updateBlur = function updateBlur() {
					switch ($scope.toggle_option) {
						case "check_one":
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_journey_distance = get_dist($scope.village_selected.id, $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_journey_time, loads_p[$scope.data.selectedOption.id].units)
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].min_journey_distance = get_dist($scope.village_selected.id, $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].min_journey_time, loads_p[$scope.data.selectedOption.id].units) || 0
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].min_points_farm = $scope.data.selectedOption.min_points_farm < conf.MIN_POINTS_FARM ? conf.MIN_POINTS_FARM : $scope.data.selectedOption.min_points_farm
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_points_farm = $scope.data.selectedOption.max_points_farm
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].max_commands_farm = $scope.data.selectedOption.max_commands_farm
							$scope.data_presets.set();
							break;
						case "check_all":
							Object.keys($scope.data_presets.villages[$scope.village_selected.id].presets).map(function (elem) {
								$scope.data_presets.villages[$scope.village_selected.id].presets[elem].max_journey_distance = get_dist($scope.village_selected.id, $scope.data_presets.villages[$scope.village_selected.id].presets[elem].max_journey_time, loads_p[elem].units)
								$scope.data_presets.villages[$scope.village_selected.id].presets[elem].min_journey_distance = get_dist($scope.village_selected.id, $scope.data_presets.villages[$scope.village_selected.id].presets[elem].min_journey_time, loads_p[elem].units) || 0
								$scope.data_presets.villages[$scope.village_selected.id].presets[elem].min_points_farm = $scope.data.selectedOption.min_points_farm < conf.MIN_POINTS_FARM ? conf.MIN_POINTS_FARM : $scope.data.selectedOption.min_points_farm
								$scope.data_presets.villages[$scope.village_selected.id].presets[elem].max_points_farm = $scope.data.selectedOption.max_points_farm
								$scope.data_presets.villages[$scope.village_selected.id].presets[elem].max_commands_farm = $scope.data.selectedOption.max_commands_farm
							})
							$scope.data_presets.set();
							break;
						case "check_all_villages":
							Object.keys($scope.data_villages.villages).map(function (village) {
								Object.keys($scope.data_presets.villages[village].presets).map(function (elem) {
									$scope.data_presets.villages[village].presets[elem].max_journey_distance = get_dist(village, $scope.data_presets.villages[village].presets[elem].max_journey_time, loads_p[elem].units)
									$scope.data_presets.villages[village].presets[elem].min_journey_distance = get_dist(village, $scope.data_presets.villages[village].presets[elem].min_journey_time, loads_p[elem].units) || 0
									$scope.data_presets.villages[village].presets[elem].min_points_farm = $scope.data.selectedOption.min_points_farm < conf.MIN_POINTS_FARM ? conf.MIN_POINTS_FARM : $scope.data.selectedOption.min_points_farm
									$scope.data_presets.villages[village].presets[elem].max_points_farm = $scope.data.selectedOption.max_points_farm
									$scope.data_presets.villages[village].presets[elem].max_commands_farm = $scope.data.selectedOption.max_commands_farm
								})
							})
							$scope.data_presets.set();
							break;
					}
					triggerUpdate();
				}
				, blurPreset = function blurPreset() {
					if (!$scope.data.selectedOption || !document.getElementById("max_journey_time") || !document.getElementById("min_journey_time")) { return }
					var tmMax = "00:00:00"
						, tmMin = "00:00:00";
					if (Object.keys($scope.data.selectedOption).length) {
						tmMax = helper.readableMilliseconds($scope.data.selectedOption.max_journey_time);
						if (tmMax.length == 7) {
							tmMax = "0" + tmMax;
						}
						tmMin = helper.readableMilliseconds($scope.data.selectedOption.min_journey_time);
						if (tmMin.length == 7) {
							tmMin = "0" + tmMin;
						}
					}
					document.getElementById("max_journey_time").value = tmMax;
					document.getElementById("min_journey_time").value = tmMin;
					if (!$scope.$$phase) { $scope.$apply(); }
				}
				, addQuadrant = function addQuadrant(pos) {
					if (!$scope.village_selected || !$scope.data.selectedOption) { return }

					switch ($scope.toggle_option) {
						case "check_one":
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.push(pos)
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.sort(function (a, b) { return a - b })
							break;
						case "check_all":
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.push(pos)
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.sort(function (a, b) { return a - b })
							Object.keys($scope.data_presets.villages[$scope.village_selected.id].presets).map(function (elem) {
								$scope.data_presets.villages[$scope.village_selected.id].presets[elem].quadrants = $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants;
							})
							break;
						case "check_all_villages":
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.push(pos)
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.sort(function (a, b) { return a - b })
							Object.keys($scope.data_villages.villages).map(function (village) {
								Object.keys($scope.data_presets.villages[village].presets).map(function (elem) {
									$scope.data_presets.villages[village].presets[elem].quadrants = $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants;
								})
							})
							break;
					}
					if (!$scope.$$phase) { $scope.$apply(); }
				}
				, remQuadrant = function remQuadrant(pos) {
					if (!$scope.village_selected || !$scope.data.selectedOption || !$scope.data_presets.villages[$scope.village_selected.id].presets || !$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id]) { return }

					switch ($scope.toggle_option) {
						case "check_one":
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants = $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.filter(f => f != pos);
							break;
						case "check_all":
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants = $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.filter(f => f != pos);
							Object.keys($scope.data_presets.villages[$scope.village_selected.id].presets).map(function (elem) {
								$scope.data_presets.villages[$scope.village_selected.id].presets[elem].quadrants = $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants
							})
							break;
						case "check_all_villages":
							$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants = $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.filter(f => f != pos);
							Object.keys($scope.data_villages.villages).map(function (village) {
								Object.keys($scope.data_presets.villages[village].presets).map(function (elem) {
									$scope.data_presets.villages[village].presets[elem].quadrants = $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants;
								})
							})
							break;
					}
					if (!$scope.$$phase) { $scope.$apply(); }
				}
				, update_all = function update_all() {
					$scope.data_select.selectedOption = $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId())
					triggerUpdate();
				}

				, getDetailsExceptions = function getDetailsExceptions(opt) {
					if (!$scope.data_farm.list_exceptions) { return }
					var my_village_id = services.modelDataService.getSelectedVillage().getId();
					$scope.data_exception = []
					$scope.data_farm.list_exceptions.forEach(function (vid) {
						services.socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
							'village_id': vid,
							'my_village_id': my_village_id,
							'num_reports': 5
						}, function (data) {
							if (!$scope.data_exception.find(f => f.village_id == data.village_id)) {
								$scope.data_exception.push(
									{
										village_id: data.village_id,
										village_name: data.village_name,
										village_x: data.village_x,
										village_y: data.village_y,
										label: formatHelper.villageNameWithCoordinates(data)
									}
								)
							}
							$scope.pagination.count = $scope.data_exception.length;
							$scope.loadCommands()
						})
					})
				}
				, getFarmTime = function getFarmTime() {
					var tm = helper.readableMilliseconds($scope.data_farm.farm_time);
					if (tm.length == 7) {
						tm = "0" + tm;
					}
					return tm;
				}
				, last_data_select_filter_selectedOption = undefined
				, last_data_select_preset_selectedOption = undefined
				, update_filter = function () {
					if ($scope.activeTab == TABS.TAB5 && $scope.logs) {

						$scope.data_log_list_filter = $scope.data_log_farm.logs.filter(function (elem, index, array) {
							return array.findIndex(f => f.origin_id && f.origin_id === elem.origin_id) === index;
						});
						$scope.data_log_list_preset = $scope.data_log_farm.logs.filter(function (elem, index, array) {
							return array.findIndex(f => f.origin_id && f.text === elem.text) === index;
						});
						$scope.data_log_list_filter.unshift({ "origin": services.$filter("i18n")("select_all", services.$rootScope.loc.ale, "farm") })
						$scope.data_select_filter = services.MainService.getSelects($scope.data_log_list_filter, last_data_select_filter_selectedOption ? last_data_select_filter_selectedOption : null, "origin")
						$scope.data_log_list_preset.unshift({ "text": services.$filter("i18n")("select_all", services.$rootScope.loc.ale, "farm") })
						$scope.data_select_preset = services.MainService.getSelects($scope.data_log_list_preset, last_data_select_preset_selectedOption ? last_data_select_preset_selectedOption : null, "text")
						if (!$scope.$$phase) { $scope.$apply() }
					}
				}
				, upt_logs = function () {
					if ($scope.activeTab == TABS.TAB5 && $scope.data_select_preset && $scope.data_select_filter) {
						$scope.logs = data_log_farm.logs.filter(function (elem, index, array) {
							if ($scope.data_select_preset.selectedOption.text === services.$filter("i18n")("select_all", services.$rootScope.loc.ale, "farm")) {
								if ($scope.data_select_filter.selectedOption.origin === services.$filter("i18n")("select_all", services.$rootScope.loc.ale, "farm")) {
									return true
								} else {
									return elem.origin_id === $scope.data_select_filter.selectedOption.origin_id;
								}
							} else {
								if ($scope.data_select_filter.selectedOption.origin === services.$filter("i18n")("select_all", services.$rootScope.loc.ale, "farm")) {
									return elem.text === $scope.data_select_preset.selectedOption.text;
								} else {
									return elem.origin_id === $scope.data_select_filter.selectedOption.origin_id && elem.text === $scope.data_select_preset.selectedOption.text;
								}
							}
						}).sort(function (a, b) { return b.date - a.date })
						$scope.loadCommandsLogs()
						if (!$scope.$$phase) { $scope.$apply() }
					}
				}

			$scope.set_farm_time = function () {
				r_farm_time = document.querySelector("#farm_time").value
				if (r_farm_time.length <= 5) {
					r_farm_time = r_farm_time + ":00"
				}
				$scope.data_farm.farm_time = unreadableSeconds(r_farm_time) * 1000;
				if ($scope.data_farm.farm_time < 900000) {
					$scope.data_farm.farm_time = 900000
					$scope.t_farm_time = getFarmTime();
					document.querySelector("#farm_time").value = $scope.t_farm_time
				}
				blur();
			}

			$scope.getStatus = function () {
				if ($scope.status == "running") {
					if (time_rest <= 0) {
						return $scope.text_execute;
					} else {
						return $scope.text_wait;
					}
				}
				return $scope.text_stop;
			}

			$scope.getTimeRest = function () {
				time_rest = $scope.data_farm.complete > time.convertedTime() ? helper.readableMilliseconds($scope.data_farm.complete - time.convertedTime()) : 0;
				return time_rest;
			}

			$scope.loadCommands = function loadCommands(page, limit, offset) {
				if ($scope.activeTab == TABS.TAB4) {
					limit ? $scope.pagination.limit = limit : limit;
					offset ? $scope.pagination.offset = offset : offset;
					page ? $scope.pagination.page = page : page;

					$scope.visibleExceptions = $scope.data_exception.slice($scope.pagination.offset, $scope.pagination.offset + $scope.pagination.limit)
					if (!$scope.$$phase) { $scope.$apply(); }
					$scope.recalcScrollbar()
				}
			}

			$scope.loadCommandsLogs = function loadCommandsLogs(page, limit, offset) {
				if ($scope.activeTab == TABS.TAB5) {
					limit ? $scope.pagination.limit = limit : limit;
					offset ? $scope.pagination.offset = offset : offset;
					page ? $scope.pagination.page = page : page;
					$scope.logs.sort(function (a, b) { return b.date - a.date })
					$scope.visibleLogs = $scope.logs.slice($scope.pagination.offset, $scope.pagination.offset + $scope.pagination.limit)
					if (!$scope.$$phase) { $scope.$apply(); }
					$scope.recalcScrollbar()
				}
			}

			$scope.centerOnPosition = services.mapService.centerOnPosition;

			$scope.toggleInfinite = function () {
				if ($scope.data_farm.infinite) {
					$scope.data_farm.infinite = false
				} else {
					$scope.data_farm.infinite = true
				}
				$scope.set_farm_time();
			}

			$scope.toggleAttacked = function () {
				if ($scope.data_farm.attacked) {
					$scope.data_farm.attacked = false
				} else {
					$scope.data_farm.attacked = true
				}
			}

			//		$scope.toggleDefenseProg = function(){
			//			if($scope.data_farm.defense_prog){
			//				$scope.data_farm.defense_prog = false
			//			} else {
			//				$scope.data_farm.defense_prog = true
			//			}
			//		}

			$scope.toggleAttackProg = function () {
				if ($scope.data_farm.attack_prog) {
					$scope.data_farm.attack_prog = false
				} else {
					$scope.data_farm.attack_prog = true
				}
			}

			$scope.toggleUnitDirection = function () {
				if ($scope.data_farm.unit_direction) {
					$scope.data_farm.unit_direction = false
				} else {
					$scope.data_farm.unit_direction = true
				}
			}

			$scope.toggleSpeedDirection = function () {
				if ($scope.data_farm.speed_direction) {
					$scope.data_farm.speed_direction = false
				} else {
					$scope.data_farm.speed_direction = true
				}
			}

			$scope.toggleCicleDistinct = function () {
				if ($scope.data_farm.cicle_distinct) {
					$scope.data_farm.cicle_distinct = false
				} else {
					$scope.data_farm.cicle_distinct = true
				}
			}

			$scope.toggleOption = function (option) {
				$scope.toggle_option = option;
				if (!$scope.$$phase) { $scope.$apply(); }
			}

			$scope.blur = function (callback) {
				if (!$scope.data_farm.infinite) {
					$scope.inicio_de_farm = document.querySelector("#inicio_de_farm").value
					$scope.termino_de_farm = document.querySelector("#termino_de_farm").value
					$scope.data_termino_de_farm = document.querySelector("#data_termino_de_farm").value
					$scope.data_inicio_de_farm = document.querySelector("#data_inicio_de_farm").value

					var tempo_escolhido_inicio = new Date($scope.data_inicio_de_farm + " " + $scope.inicio_de_farm).getTime();
					var tempo_escolhido_termino = new Date($scope.data_termino_de_farm + " " + $scope.termino_de_farm).getTime();

					if (tempo_escolhido_inicio > tempo_escolhido_termino || !tempo_escolhido_termino) {
						tempo_escolhido_termino = new Date(tempo_escolhido_inicio + 2 * 86400000)
						$scope.termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "HH:mm:ss");
						$scope.data_termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "yyyy-MM-dd");
					}

					document.getElementById("data_termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "yyyy-MM-dd");
					document.getElementById("data_inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "yyyy-MM-dd");
					document.getElementById("termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "HH:mm:ss");
					document.getElementById("inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "HH:mm:ss");

					if (unreadableSeconds(r_farm_time) * 1000 == 0) {
						$scope.data_farm.infinite = true
					}

					$scope.data_farm.farm_time = unreadableSeconds(r_farm_time) * 1000
					$scope.data_farm.farm_time_start = tempo_escolhido_inicio
					$scope.data_farm.farm_time_stop = tempo_escolhido_termino
				}

				update()

				if (callback != undefined && typeof (callback) == "function") {
					callback()
				}
			}

			/*
			 * Presets
			 */

			$scope.assignPreset = function assignPreset(presetId) {
				//let presetId = $scope.data.selectedOptionOut.id;
				!presetIds.find(f => f == presetId) ? presetIds.push(parseInt(presetId, 10)) : presetIds;
				assignPresets($scope.village_selected.id);
			}

			$scope.assignAllPreset = function assignAllPreset() {
				$scope.data.presets.forEach(function (preset) {
					!presetIds.find(f => f == preset.id) ? presetIds.push(preset.id) : presetIds;
				});
				assignPresets($scope.village_selected.id);
			}

			$scope.assignAllPresetAllVillages = function assignAllPresetAllVillages() {
				$scope.data.presets.forEach(function (preset) {
					!presetIds.find(f => f == preset.id) ? presetIds.push(preset.id) : presetIds;
				});

				$scope.local_data_villages.forEach(function (vill) {
					assignPresets(vill.id, null, presetIds);
				})
			}

			$scope.unassignPreset = function unassignPreset(presetId) {
				//presetIds.splice(presetIds.indexOf(presetId), 1);
				presetIds = presetIds.filter(f => f != presetId)
				assignPresets($scope.village_selected.id);
			}

			$scope.unassignAllPreset = function unassignAllPreset() {
				presetIds = []
				assignPresets($scope.village_selected.id);
			}

			$scope.unassignAllPresetAllVillages = function unassignAllPresetAllVillages() {
				presetIds = []
				$scope.local_data_villages.forEach(function (vill) {
					assignPresets(vill.id, null, presetIds);
				})
			}

			$scope.createPresets = function createPresets() {
				function create_preset(preset, id) {

					let units = {};
					let officers = {};
					services.modelDataService.getGameData().getOrderedUnitNames().forEach(function (unitName) {
						units[unitName] = 0;
					});

					services.modelDataService.getGameData().getOrderedOfficerNames().forEach(function (officerName) {
						officers[officerName] = false;
					});

					let qtd = Object.values(preset)[0];
					let unit = Object.keys(preset)[0];
					units[unit] = qtd;
					let trad_unit = services.$filter("i18n")(unit, services.$rootScope.loc.ale, "units")
						, d_preset = {
							"catapult_target": null,
							"icon": parseInt("0c0b0c", 16),
							"name": $scope.name_preset + " " + trad_unit,
							"officers": officers,
							"units": units,
							"village_id": id
						}
					services.socketService.emit(providers.routeProvider.SAVE_NEW_PRESET, d_preset);
				}

				function df(opt) {

					//				if(!opt){
					//				if(!services.modelDataService.getPresetList().isLoadedValue){
					//				services.socketService.emit(providers.routeProvider.GET_PRESETS, {}, function(){
					//				return df(true)
					//				});
					//				} else {
					//				return df(true)
					//				}
					//				return
					//				}

					let list_presets = [
						{ "spear": $scope.qtd_preset },
						{ "sword": $scope.qtd_preset },
						{ "archer": $scope.qtd_preset },
						{ "axe": $scope.qtd_preset },
						{ "light_cavalry": $scope.qtd_preset },
						{ "mounted_archer": $scope.qtd_preset },
						{ "heavy_cavalry": $scope.qtd_preset }
					]

					let psts_load = angular.copy(services.presetListService.getPresets())

					let pri_vill = services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id)
					for (var preset in list_presets) {
						if (list_presets.hasOwnProperty(preset)) {
							if (psts_load == undefined || Object.values(psts_load).length == 0 || !Object.values(psts_load).map(function (elem) {
								return elem.name
							}).find(f => f == $scope.name_preset + " " + services.$filter("i18n")(Object.keys(list_presets[preset])[0], services.$rootScope.loc.ale, "units"))) {
								create_preset(list_presets[preset], pri_vill.getId())
							}
						}
					}
				}
				$scope.name_preset = document.querySelector("#name_preset").value
				$scope.qtd_preset = parseInt(document.querySelector("#qtd_preset").value)
				if (!$scope.$$phase) { $scope.$apply() }
				df()
			}

			$scope.blurMaxJourney = function () {
				var r = document.querySelector("#max_journey_time").value
				if (r.length <= 5) {
					r = r + ":00"
				}
				let v_d = $scope.data_presets.villages[$scope.village_selected.id]
					, vill_d = v_d.presets[$scope.data.selectedOption.id]
				switch ($scope.toggle_option) {
					case "check_one":
						vill_d.max_journey_time = unreadableSeconds(r) * 1000
						vill_d.max_journey_distance = get_dist(services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id).data.villageId, vill_d.max_journey_time, loads_p[$scope.data.selectedOption.id].units)
						break;
					case "check_all":
						Object.keys(v_d.presets).map(function (elem) {
							v_d.presets[elem].max_journey_time = unreadableSeconds(r) * 1000
							v_d.presets[elem].max_journey_distance = get_dist(services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id).data.villageId, v_d.presets[elem].max_journey_time, loads_p[$scope.data.selectedOption.id].units)
						})
						break;
					case "check_all_villages":
						Object.keys($scope.data_villages.villages).map(function (village) {
							Object.keys($scope.data_presets.villages[village].presets).map(function (elem) {
								$scope.data_presets.villages[village].presets[elem].max_journey_time = unreadableSeconds(r) * 1000
								$scope.data_presets.villages[village].presets[elem].max_journey_distance = get_dist(village, $scope.data_presets.villages[village].presets[elem].max_journey_time, loads_p[elem].units)
							})
						})
						break;
				}
				updateBlur()
			}

			$scope.blurMinJourney = function () {
				var r = document.querySelector("#min_journey_time").value
				if (r.length <= 5) {
					r = r + ":00"
				}
				let v_d = $scope.data_presets.villages[$scope.village_selected.id]
					, vill_d = v_d.presets[$scope.data.selectedOption.id]
				switch ($scope.toggle_option) {
					case "check_one":
						vill_d.min_journey_time = unreadableSeconds(r) * 1000
						vill_d.min_journey_distance = get_dist(services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id).data.villageId, vill_d.min_journey_time, loads_p[$scope.data.selectedOption.id].units)
						break;
					case "check_all":
						Object.keys(v_d.presets).map(function (elem) {
							v_d.presets[elem].min_journey_time = unreadableSeconds(r) * 1000
							v_d.presets[elem].min_journey_distance = get_dist(services.modelDataService.getSelectedCharacter().getVillage($scope.village_selected.id).data.villageId, v_d.presets[elem].min_journey_time, loads_p[$scope.data.selectedOption.id].units)
						})
						break;
					case "check_all_villages":
						Object.keys($scope.data_villages.villages).map(function (village) {
							Object.keys($scope.data_presets.villages[village].presets).map(function (elem) {
								$scope.data_presets.villages[village].presets[elem].min_journey_time = unreadableSeconds(r) * 1000
								$scope.data_presets.villages[village].presets[elem].min_journey_distance = get_dist(village, $scope.data_presets.villages[village].presets[elem].min_journey_time, loads_p[elem].units)
							})
						})
						break;
				}
				updateBlur()
			}

			$scope.updateBlur = updateBlur;

			$scope.shouldShow = function (item) {
				if (!$scope.data_presets.villages[$scope.village_selected.id].assigned_presets) { return false }
				return $scope.data_presets.villages[$scope.village_selected.id].assigned_presets.find(f => f == item.id);

			}

			$scope.shouldntShow = function (item) {
				if (!$scope.data_presets.villages[$scope.village_selected.id].assigned_presets) { return true }
				return !$scope.data_presets.villages[$scope.village_selected.id].assigned_presets.find(f => f == item.id);
			}

			/*
			 * Exceptions
			 */

			$scope.deleteException = function (id_village) {
				if ($scope.data_farm.list_exceptions.find(f => f == id_village)) {
					$scope.data_farm.list_exceptions = $scope.data_farm.list_exceptions.filter(f => f != id_village)
				}
			}

			$scope.addException = function () {
				let id_village = $scope.item.id;
				if (!$scope.data_farm.list_exceptions.find(f => f == id_village)) {
					$scope.data_farm.list_exceptions.push(id_village)
				}
			}

			$scope.start_farm = function () {
				$scope.blur(function () {
					services.FarmService.start();
					$scope.isRunning = services.FarmService.isRunning();
				});
			}

			$scope.stop_farm = function () {
				services.FarmService.stop();
			}

			$scope.menu = function () {
				services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
			}

			/*
			 * Quadrants
			 */

			$scope.setQuadrant = function (pos) {
				if (!$scope.village_selected || !$scope.data.selectedOption || !$scope.data_presets.villages[$scope.village_selected.id].presets || !$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id]) { return }

				if ($scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.includes(pos)) {
					remQuadrant(pos)
				} else {
					addQuadrant(pos)
				}
			}

			$scope.getQuadrant = function (pos) {
				if (!$scope.village_selected || !$scope.data.selectedOption || !$scope.data_presets.villages[$scope.village_selected.id].presets || !$scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id]) { return }
				return $scope.data_presets.villages[$scope.village_selected.id].presets[$scope.data.selectedOption.id].quadrants.includes(pos)
			}

			$scope.autoCompleteKey = function (event) {
				let obj_autocomplete = {
					'type': 'village',
					'placeholder': $scope.SEARCH_MAP,
					'onEnter': function (item, element) { //Filtra somente as aldeias bárbaras - aldeias sem owner_id representam aldeias bárbaras
						$scope.item = item
						//						element[0].firstElementChild.value = item.displayedName
						element.firstElementChild.value = item.displayedName
						if (!$scope.$$phase) { $scope.$apply() }
					},
					'exclude': function (elem) {
						return elem.owner_id == undefined
					},
					"inputValueReadOnly": "",
					"keepSelected": false
				}

				let object_scope = {
					"inputValue": event.srcElement.value,
					"element": document.querySelector("#autocomplete_farm"),
					"id": "autocomplete_farm",
					"autoComplete": obj_autocomplete
				}
				autocomplete(object_scope, event);
			}

			$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
				if (!data || data.name != "FARM") { return }
				update();
			})

			$scope.$watch("data_log_farm.logs", function () {
				upt_logs()
				update_filter()
			}, true)

			$scope.$watch("data.selectedOption", function () {
				if (!$scope.data.selectedOption) { return }
				blurPreset()
			}, true)

			$scope.$watch("data_select.selectedOption", function () {
				if (!$scope.data_select) { return }
				$scope.village_selected = $scope.data_select.selectedOption;
				services.villageService.setSelectedVillage($scope.data_select.selectedOption.id)
				triggerUpdate();
			}, true)

			$scope.$watch("data_select_filter.selectedOption", function () {
				if (!$scope.data_select_filter && $scope.activeTab != TABS.TAB5) { return }
				last_data_select_filter_selectedOption = $scope.data_select_filter.selectedOption
				upt_logs()
			}, true)

			$scope.$watch("data_select_preset.selectedOption", function () {
				if (!$scope.data_select_preset && $scope.activeTab != TABS.TAB5) { return }
				last_data_select_preset_selectedOption = $scope.data_select_preset.selectedOption
				upt_logs()
			}, true)

			$scope.$watch("data_farm.list_exceptions", function () {
				getDetailsExceptions();
			}, true)

			$scope.$on("$destroy", function () {
				$scope.data_villages.set();
				$scope.data_farm.set();
				$scope.data_presets.set();
			});

			$scope.$on(providers.eventTypeProvider.VILLAGE_SELECTED_CHANGED, update_all);
			$scope.$on(providers.eventTypeProvider.ARMY_PRESET_ASSIGNED, triggerUpdate);
			$scope.$on(providers.eventTypeProvider.ARMY_PRESET_SAVED, triggerUpdate);

			$scope.local_data_villages = services.VillService.getLocalVillages("farm", "label");

			$scope.village_selected = $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId())
			$scope.text_version = $scope.version + " " + $scope.data_farm.version;
			$scope.toggle_option = "check_one";
			$scope.item = {}
			$scope.date_ref = new Date(0);
			$scope.tmMax = "0";
			$scope.tmMin = "0";
			$scope.isRunning = services.FarmService.isRunning();
			$scope.isPaused = services.FarmService.isPaused();
			$scope.t_farm_time = getFarmTime();
			$scope.data = {
				'presets': presets_load,
				'hotkeys': services.storageService.getItem(services.presetService.getStorageKey()),
				"selectedOption": {},
				"selectedOptionOut": {}
			}

			$scope.data_select = services.MainService.getSelects($scope.local_data_villages, $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId()), "id")

			$scope.data_exception = []
			/*
			$scope.getUnits = function(unit, id){
				return $scope.data.presets.find(f=>f.id==id).units[unit]
			}	
			 */
			$scope.name_preset = "*Farm";
			$scope.qtd_preset = Math.min.apply(null, [(Math.max.apply(null, [Math.trunc(($scope.local_data_villages.length / 10) * 10), 10])), 200]);

			$scope.userSetActiveTab = function (tab) {
				setActiveTab(tab);
				if (tab == TABS.TAB1) { //Atualiza os dados das predefinições ao carregar a TAB
					triggerUpdate()
				} else if (tab == TABS.TAB4) {
					angular.extend($scope.pagination, {
						'count': $scope.data_exception.length,
						'loader': $scope.loadCommands
					})
					$scope.loadCommands()
					if (!$scope.$$phase) { $scope.$apply(); }
				} else if (tab == TABS.TAB5) {
					update_filter()
					angular.extend($scope.pagination, {
						'count': $scope.logs.length,
						'loader': $scope.loadCommandsLogs
					})
					$scope.loadCommandsLogs()
					if (!$scope.$$phase) { $scope.$apply(); }
				}
			}

			$scope.requestedTab = TABS.TAB1; // Seleciona a primeira aba ativa
			$scope.TABS = TABS;
			$scope.TAB_ORDER = TAB_ORDER;

			$scope.visibleExceptions = []
			$scope.visibleLogs = []

			$scope.page = 0;
			$scope.columns = {
				"name": "Coluna 1",
				"priority": 1
			};
			$scope.SORT_BLACKLIST = ["officers"];
			$scope.pagination = {
				'limit': services.storageService.getPaginationLimit() || 25,
				'limits': [25, 50, 75, 100],
				'offset': 0
			};

			$scope.sorting = {
				'column': "Coluna 1",
				'reverse': false
			};

			$scope.openInfo = function (selectedVillageId) {
				var tmpScope = services.$rootScope.$new();
				services.linkService.linkTo(parseInt(selectedVillageId, 10), "village", tmpScope, null, null);
			}
			$scope.jumpToVillage = function (vid) {
				if (!vid) { return }
				var village = services.modelDataService.getSelectedCharacter().getVillage(vid)
				if (!village) { return }
				let x = village.data.x
				let y = village.data.y
				services.$rootScope.$broadcast(providers.eventTypeProvider.MAP_SELECT_VILLAGE, village.getId());
				services.mapService.jumpToVillage(x, y);
				$scope.closeWindow();
			}

			Object.values($scope.data_presets.villages).forEach(function (vill) {
				Object.values(vill.presets).forEach(function (preset) {
					if (preset.min_points_farm < conf.MIN_POINTS_FARM) {
						preset.min_points_farm = conf.MIN_POINTS_FARM
					}
				})
			})

			update()

			initTab()

			$scope.setCollapse();

			return $scope;
		}
	})
