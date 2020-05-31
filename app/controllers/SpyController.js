define("robotTW2/controllers/SpyController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/time",
	"robotTW2/databases/data_spy",
	"robotTW2/databases/data_villages",
	"robotTW2/autocomplete",
	"robotTW2/notify",
	"helper/math",
	"conf/conf",
	"robotTW2/services/ProvinceService",
	"robotTW2/unreadableSeconds"
], function (
	services,
	providers,
	helper,
	time,
	data_spy,
	data_villages,
	autocomplete,
	notify,
	math,
	conf_conf,
	provinceService,
	unreadableSeconds
) {
		return function SpyController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
			$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
			$scope.SELECT = services.$filter("i18n")("SELECT", services.$rootScope.loc.ale);
			$scope.SEARCH_MAP = services.$filter('i18n')('SEARCH_MAP', services.$rootScope.loc.ale);
			$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

			$scope.date_init = services.$filter("date")(new Date(time.convertedTime()), "yyyy-MM-dd")
			$scope.hour_init = services.$filter("date")(new Date(time.convertedTime()), "HH:mm:ss")
			$scope.ms_init = 0;
			$scope.data_spy = data_spy
			$scope.text_version = $scope.version + " " + data_spy.version;
			$scope.send_scope = {};
			$scope.villages_for_sent = {};
			$scope.local_out_villages = [];
			$scope.download = false;
			$scope.select_all_province = false;
			$scope.select_all_village = true;
			$scope.item = {}
			$scope.item.type = undefined
			$scope.text_put = $scope.text_data_target
			$scope.text_put_province = $scope.text_target_village
			$scope.province_name = "";

			var in_update = undefined
				, key_control = false
				, update = function () {
					!in_update ? in_update = services.$timeout(function () {
						$scope.comandos = Object.keys($scope.data_spy.commands).map(function (elem, index, array) {
							$scope.local_out_villages.push(
								{
									"id": $scope.data_spy.commands[elem].target_village,
									"label": $scope.data_spy.commands[elem].target_name + " (" + $scope.data_spy.commands[elem].target_x + "|" + $scope.data_spy.commands[elem].target_y + ")",
									"x": $scope.data_spy.commands[elem].target_x,
									"y": $scope.data_spy.commands[elem].target_y
								});
							if (!$scope.$$phase) { $scope.$apply() }
							return $scope.data_spy.commands[elem]
						});
						$scope.comandos.sort(function (a, b) { return (a.data_escolhida - time.convertedTime() - a.duration) - (b.data_escolhida - time.convertedTime() - b.duration) })
						if (document.getElementById("input-hour-interval")) {
							document.getElementById("input-hour-interval").value = helper.readableMilliseconds($scope.data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds($scope.data_spy.interval) : helper.readableMilliseconds($scope.data_spy.interval);
						}
						$scope.recalcScrollbar();
						in_update = undefined;
						if (!$scope.$$phase) { $scope.$apply() }
					}, 1200) : null
				}
				, updateValues = function (callback) {
					let durationInSeconds = $scope.send_scope.distance / services.modelDataService.getWorldConfig().getSpeed() * services.modelDataService.getGameData().getBaseData().spy_speed * 60
					let get_data = document.querySelector("#input-date").value;
					let get_time = document.querySelector("#input-time").value;
					let get_ms = document.querySelector("#input-ms").value;
					if (get_time.length <= 5) {
						get_time = get_time + ":00";
					}
					if (!$scope.data_option) { return }
					if ($scope.data_option.selectedOption.value != "village") {
						$scope.send_scope.milisegundos_duracao = 0;
						$scope.send_scope.tempo_escolhido = Math.max(new Date(get_data + " " + get_time + "." + get_ms).getTime(), time.convertedTime() + 15000)
					} else {
						if (get_data != undefined && get_time != undefined) {
							$scope.send_scope.milisegundos_duracao = durationInSeconds * 1000;
							$scope.send_scope.tempo_escolhido = Math.max(new Date(get_data + " " + get_time + "." + get_ms).getTime(), time.convertedTime() + $scope.send_scope.milisegundos_duracao + 15000)
							$scope.date_init = services.$filter("date")(new Date($scope.send_scope.tempo_escolhido), "yyyy-MM-dd")
							$scope.hour_init = services.$filter("date")(new Date($scope.send_scope.tempo_escolhido), "HH:mm:ss")
						}
					}
					$scope.send_scope.type = $scope.data_type.selectedOption.value; //type
					$scope.send_scope.startId = $scope.data_select.selectedOption.id
					$scope.send_scope.targetId = $scope.item.id
					$scope.send_scope.targetVillage = $scope.item.name
					$scope.send_scope.targetX = $scope.item.x
					$scope.send_scope.targetY = $scope.item.y
					$scope.send_scope.qtd = $scope.data_qtd.selectedOption //qtd
					$scope.recalcScrollbar()
					if (typeof (callback) == "function") {
						callback()
					}

				}
				, updateTarget = function () {
					if ($scope.item.type == "character") {
						$scope.download = true;
						getProfile($scope.item.id, function (data) {
							angular.extend($scope.item, data)
							switch ($scope.data_option.selectedOption.value) {
								case "province_member":
									provinceService.getProvinceForPlayer($scope.item, function (provinces) {
										$scope.local_data_province = provinces;
										$scope.local_data_province.sort(function (a, b) { return a.name.localeCompare(b.name) })
										$scope.data_province = services.MainService.getSelects($scope.local_data_province)
										$scope.download = false;
									})
									break;
								case "all_member":
									$scope.download = false;
									$scope.villages_for_sent = data.villages;
									break;
							}
						})
					} else if ($scope.item.type == "village") {
						switch ($scope.data_option.selectedOption.value) {
							case "village":
								$scope.send_scope.distance = math.actualDistance(
									{
										'x': $scope.data_select.selectedOption.x,
										'y': $scope.data_select.selectedOption.y
									},
									{
										'x': $scope.item.x,
										'y': $scope.item.y
									}
								);
								break;
							case "province_enemy":
								provinceService.getProvinceForVillageForEnemy($scope.item, function (data) {
									$scope.villages_for_sent = data.villages
									$scope.province_name = data.name
								})
								break;
							case "province_barbarian":
								provinceService.getProvinceForVillageForBarbarian($scope.item, function (data) {
									$scope.villages_for_sent = data.villages
									$scope.province_name = data.name
								})
								break;
							case "province_neutral":
								provinceService.getProvinceForVillageForNeutral($scope.item, function (data) {
									$scope.villages_for_sent = data.villages
									$scope.province_name = data.name
								})
								break;
						}
					}

					update_select()
					updateValues()
				}
				, updateEnter = function (item, element) {
					$scope.item = item
					if (item.displayedName) {
						element.firstElementChild.value = item.displayedName
					} else {
						element.firstElementChild.value = item.name
					}
					if ($scope.item.type == "character") {
						$scope.data_option = services.MainService.getSelects([
							{
								"name": services.$filter("i18n")("all_member", services.$rootScope.loc.ale, "spy"),
								"value": "all_member"
							},
							{
								"name": services.$filter("i18n")("province_member", services.$rootScope.loc.ale, "spy"),
								"value": "province_member"
							}
						]
						)
					} else if ($scope.item.type == "village" && services.modelDataService.getSelectedCharacter().getTribeRelations()) {
						$scope.data_option = services.MainService.getSelects([
							{
								"name": services.$filter("i18n")("village", services.$rootScope.loc.ale, "spy"),
								"value": "village"
							},
							{
								"name": services.$filter("i18n")("province_enemy", services.$rootScope.loc.ale, "spy"),
								"value": "province_enemy"

							},
							{
								"name": services.$filter("i18n")("province_barbarian", services.$rootScope.loc.ale, "spy"),
								"value": "province_barbarian"

							},
							{
								"name": services.$filter("i18n")("province_neutral", services.$rootScope.loc.ale, "spy"),
								"value": "province_neutral"
							}
						]
						)
					} else if ($scope.item.type == "village" && !services.modelDataService.getSelectedCharacter().getTribeRelations()) {
						$scope.data_option = services.MainService.getSelects([
							{
								"name": services.$filter("i18n")("village", services.$rootScope.loc.ale, "spy"),
								"value": "village"
							},
							{
								"name": services.$filter("i18n")("province_barbarian", services.$rootScope.loc.ale, "spy"),
								"value": "province_barbarian"

							},
							{
								"name": services.$filter("i18n")("province_neutral", services.$rootScope.loc.ale, "spy"),
								"value": "province_neutral"
							}
						]
						)
					}
					updateTarget()
					if (!$scope.$$phase) { $scope.$apply() }
				}
				, getProfile = function (character_id, callbackgetProfile) {
					services.socketService.emit(providers.routeProvider.CHAR_GET_PROFILE, {
						'character_id': character_id
					}, function (data) {
						callbackgetProfile(data)
					});
				}
				, checkGroup = function (village_id) {
					let groups = services.modelDataService.getGroupList().getVillageGroups(village_id)
					return !!groups.find(f => f.name == "no farm")
				}
				, checkFilter = function (village) {
					if (!checkGroup(village.village_id)) {
						return village
					}
				}
				, sendAttackSpyPlayer = function (opt) {
					if (!$scope.item && !opt) { return }
					if ($scope.villages_for_sent.length) {

						$scope.villages_for_sent = $scope.villages_for_sent.filter(checkFilter)

						var list_proc = [];
						var villages = services.modelDataService.getSelectedCharacter().getVillages();
						Object.keys($scope.villages_for_sent).map(function (elem) {
							let target = $scope.villages_for_sent[elem]
								, list_dist_vills = Object.keys(villages).map(function (vill) {
									let village = villages[vill]
										, preceptory = village.getBuildingData().getDataForBuilding("preceptory")
										, order = undefined
										, sabotage = false;
									if (preceptory)
										order = preceptory.selectedOrder;

									if (order && order == "thieves")
										sabotage = true;

									return {
										"id": village.getId(),
										"dist": math.actualDistance(
											{
												'x': village.getX(),
												'y': village.getY()
											},
											{
												'x': target.village_x,
												'y': target.village_y
											}
										),
										"sabotage": sabotage
									}
								}).filter(f => f != undefined).sort(function (a, b) { return a.dist - b.dist })

							list_dist_vills = list_dist_vills.map(function (etm) {
								let td = list_proc.find(f => f.id == etm.id);
								if ($scope.data_type.selectedOption.value == "sabotage" && dist_vill.sabotage || $scope.data_type.selectedOption.value != "sabotage") {
									if (!td) {
										return etm;
									} else {
										if (td.spies < etm.spies) {
											etm.spies = etm.spies - td.spies
											return etm
										}
									}
								}
							}).filter(f => f != undefined).sort(function (a, b) { return a.dist - b.dist })

							if (!list_dist_vills) return;
							let dist_vill
								, count = 0;

							function next(dist_vill) {
								count++;
								let vt = Math.max($scope.send_scope.tempo_escolhido, time.convertedTime())
								$scope.send_scope.tempo_escolhido = vt + 2000;
								$scope.send_scope.startId = dist_vill.id
								$scope.send_scope.type = $scope.data_type.selectedOption.value; //type
								$scope.send_scope.targetId = target.village_id
								$scope.send_scope.targetVillage = target.village_name
								$scope.send_scope.targetX = target.village_x
								$scope.send_scope.targetY = target.village_y
								$scope.send_scope.qtd = 1//$scope.data_qtd.selectedOption //qtd

								services.SpyService.sendCommandAttackSpy($scope.send_scope);
								let vill_local = $scope.local_data_villages.find(f => f.id == dist_vill.id)
								if (vill_local) {
									vill_local.spies--
								}
								if (vill_local.spies > 0) {
									list_dist_vills.unshift(dist_vill)
								} else {
									list_proc.push({
										"id": dist_vill.id,
										"spies": count
									})
									count = 0;
								}
							}

							let qtc = []
							for (t = 0; t < $scope.data_qtd.selectedOption; t++) {
								qtc.push(t)
							}

							function fnext(dist_vill) {
								if ($scope.local_data_villages.find(f => f.id == dist_vill.id) && $scope.local_data_villages.find(f => f.id == dist_vill.id).spies > 0) {
									next(dist_vill)
									if (qtc.length && list_dist_vills.length) {
										qtc.shift()
										fnext(list_dist_vills.shift())
									} else {
										update();
									}
								} else {
									if (list_dist_vills.length) {
										fnext(list_dist_vills.shift())
									}
								}
							}
							if (qtc.length && list_dist_vills.length) {
								qtc.shift()
								fnext(list_dist_vills.shift())
							} else {
								update();
							}
						})

						//				$scope.send_scope = {}
						$scope.recalcScrollbar();
					} else {
						notify("villages_error");
					}
				}
				, update_select = function () {
					$scope.date_init = services.$filter("date")(new Date(time.convertedTime()), "yyyy-MM-dd")
					$scope.hour_init = services.$filter("date")(new Date(time.convertedTime()), "HH:mm:ss")

					if ($scope.data_option && $scope.data_option.selectedOption == "village") {
						var village = services.modelDataService.getSelectedCharacter().getVillage($scope.data_select.selectedOption.id)
						services.villageService.setSelectedVillage($scope.data_select.selectedOption.id)
						let preceptory = village.getBuildingData().getDataForBuilding("preceptory")
							, order = undefined;
						if (preceptory)
							order = village.getBuildingData().getDataForBuilding("preceptory").selectedOrder;
						let qtd_spy = village.getScoutingInfo().getNumAvailableSpies()
							, lts = [];
						for (let i = 0; i < qtd_spy; i++) {
							lts.push(i + 1)
						}
						$scope.data_qtd = services.MainService.getSelects(lts)
						$scope.data_type = services.MainService.getSelects([
							{
								"name": services.$filter("i18n")("units", services.$rootScope.loc.ale, "spy"),
								"value": "units"
							},
							{
								"name": services.$filter("i18n")("buildings", services.$rootScope.loc.ale, "spy"),
								"value": "buildings"

							}]
						)

						if (order && order == "thieves") {
							$scope.data_type.push(
								{
									"name": services.$filter("i18n")("sabotage", services.$rootScope.loc.ale, "spy"),
									"value": "sabotage"
								}
							)
						}

					} else {
						$scope.data_qtd = services.MainService.getSelects([1, 2, 3, 4, 5])
						$scope.data_type = services.MainService.getSelects([
							{
								"name": services.$filter("i18n")("units", services.$rootScope.loc.ale, "spy"),
								"value": "units"
							},
							{
								"name": services.$filter("i18n")("buildings", services.$rootScope.loc.ale, "spy"),
								"value": "buildings"

							},
							{
								"name": services.$filter("i18n")("sabotage", services.$rootScope.loc.ale, "spy"),
								"value": "sabotage"
							}]
						)
					}
					updateValues();
				}

			$scope.isRunning = services.SpyService.isRunning();

			$scope.local_data_villages = services.VillService.getLocalVillages("spy", "label");
			$scope.local_data_province = []

			$scope.village_selected = $scope.local_data_villages[Object.keys($scope.local_data_villages)[0]]

			$scope.autoCompleteKey = function (event) {
				let obj_autocomplete = {
					'type': ['character', 'village'],
					'placeholder': $scope.SEARCH_MAP,
					'onEnter': updateEnter,
					'exclude': null,
					"inputValueReadOnly": "",
					"keepSelected": false
				}

				let object_scope = {
					"element": document.querySelector("#autocomplete_spy"),
					"id": "autocomplete_spy",
					"autoComplete": obj_autocomplete
				}
				autocomplete(object_scope, event, $scope.inputValueSpy);
			}

			$scope.getLabelStart = function (param) {
				let vid = param.start_village;
				if (!vid) { return }
				return $scope.local_data_villages.find(f => f.id == vid).label
			}

			$scope.getLabelTarget = function (param) {
				let vid = param.target_village;
				if (!vid || !$scope.local_out_villages.find(f => f.id == vid)) { return }
				return $scope.local_out_villages.find(f => f.id == vid).label
			}

			$scope.getClass = function (type) {
				var className = "";
				switch (type) {
					case "units":
						className = "icon-34x34-units";
						break;
					default:
						className = "icon-34x34-village";
						break;
				}
				return className
			}

			$scope.getHoraSend = function (param) {
				return services.$filter("date")(new Date(param.data_escolhida - param.duration), "HH:mm:ss.sss");
			}

			$scope.getDataSend = function (param) {
				return services.$filter("date")(new Date(param.data_escolhida - param.duration), "dd/MM/yyyy");
			}

			$scope.getHoraAlvo = function (param) {
				return services.$filter("date")(new Date(param.data_escolhida), "HH:mm:ss.sss");
			}

			$scope.getDataAlvo = function (param) {
				return services.$filter("date")(new Date(param.data_escolhida), "dd/MM/yyyy");
			}

			$scope.getTimeRestSend = function (param) {
				var difTime = param.data_escolhida - time.convertedTime() - param.duration;
				return helper.readableMilliseconds(difTime)
			}

			$scope.getTimeRest = function () {
				return $scope.data_spy.complete > time.convertedTime() ? helper.readableMilliseconds($scope.data_spy.complete - time.convertedTime()) : 0;
			}

			$scope.clear_spy = function () {
				services.SpyService.removeAll();
			}

			$scope.menu = function () {
				services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
			}

			$scope.removeCommand = services.SpyService.removeCommandAttackSpy;

			$scope.blur = function () {
				var t = document.querySelector("#input-hour-interval").value;
				if (t.length <= 5) {
					t = t + ":00"
				}
				$scope.data_spy.interval = unreadableSeconds(t) * 1000;
			}
			$scope.jumpToVillage = function (vid) {
				if (!vid) { return }
				var village = services.modelDataService.getSelectedCharacter().getVillage(vid)
				if (!village) { return }
				services.$rootScope.$broadcast(providers.eventTypeProvider.MAP_SELECT_VILLAGE, village.getId());
				services.mapService.jumpToVillage(village.getX(), village.getY());
				$scope.closeWindow();
			}

			$scope.jumpOutVillage = function (vid) {
				if (!vid) { return }
				let v = $scope.local_out_villages.find(f => f.id == vid);
				if (!v) { return }
				services.$rootScope.$broadcast(providers.eventTypeProvider.MAP_SELECT_VILLAGE, vid);
				services.mapService.jumpToVillage(v.x, v.y);
				$scope.closeWindow();
			}

			$scope.sendAttackSpy = function () {
				if (!$scope.item) { return }
				updateValues(function () {
					if ($scope.data_option.selectedOption.value == "village") {
						services.SpyService.sendCommandAttackSpy($scope.send_scope);
					} else {
						sendAttackSpyPlayer(true)
					}
				})
				//			$scope.send_scope = {}
			}

			$scope.$on(providers.eventTypeProvider.CHANGE_COMMANDS, function () {
				if (!key_control) {
					key_control = true
					services.$timeout(function () {
						key_control = false
						update();
					}, 5000)
				}
			})

			$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE, function ($event, data) {
				if (!data || data.name != "SPY") { return }
				/*
				document.getElementById("input-hour-interval").value = helper.readableMilliseconds($scope.data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds($scope.data_spy.interval) : helper.readableMilliseconds($scope.data_spy.interval);
				*/
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			})

			$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
				if (!data || data.name != "SPY") { return }
				$scope.isRunning = services.SpyService.isRunning();
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			})

			$scope.$watch("data_logs.spy", function () {
				$scope.recalcScrollbar();
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			}, true)

			$scope.$watch("data_spy", function () {
				//			if(!$scope.data_spy){return}
				//			$scope.data_spy.set();
			}, true)

			$scope.$watch("data_province.selectedOption", function () {
				if (!$scope.data_province) { return }
				$scope.villages_for_sent = $scope.data_province.selectedOption.villages;
			}, true)

			$scope.$watch("data_select.selectedOption", function () {
				if (!$scope.data_select) { return }
				updateTarget()
			}, true)

			$scope.$on("$destroy", function () {
				$scope.data_spy.set();
			});

			$scope.$watch("data_option.selectedOption", function () {
				if (!$scope.data_option) { return }
				updateTarget()
			}, true);

			$scope.data_type = services.MainService.getSelects([
				{
					"name": services.$filter("i18n")("units", services.$rootScope.loc.ale, "spy"),
					"value": "units"
				},
				{
					"name": services.$filter("i18n")("buildings", services.$rootScope.loc.ale, "spy"),
					"value": "buildings"

				}]
			)

			$scope.$on(providers.eventTypeProvider.VILLAGE_SELECTED_CHANGED, function () {
				$scope.data_select.selectedOption = $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId())
			});

			$scope.data_select = services.MainService.getSelects($scope.local_data_villages, $scope.local_data_villages.find(f => f.id == services.modelDataService.getSelectedCharacter().getSelectedVillage().getId()), "id")
			$scope.data_qtd = services.MainService.getSelects([1, 2, 3, 4, 5])

			update();
			$scope.setCollapse();

			return $scope;
		}
	})

