define("robotTW2/farm", [
	"robotTW2/ready",
	"robotTW2/data_farm",
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/conf",
	], function(
			ready,
			data_farm,
			services,
			providers,
			helper,
			conf
	){
	var isInitialized = !1
	, isRunning = !1
	, isPaused = !1
	, interval_init = null
	, data = data_farm.getFarm()
	, timeoutIdFarm = {}
	, listener_report = undefined
	, req = 0
	, rdy = 0
	, s = {}
	, p = 0
	, comandos_preset = []
	, setupGrid = function (len) {
		var i, t = 0,
		arr;

		for (i = 0, arr = []; i < len; i++) {
			arr[i] = null;
		}
		return arr.concat().map(function(elem) {
			return arr.concat();
		});
	}
	, addExcept = function(id){
		data = data_farm.getFarm();
		var exceptions = data.LIST_EXCEPTIONS;
		!exceptions.find(f => f == id) ? exceptions.push(id) : null;
		data.LIST_EXCEPTIONS = exceptions;
		data_farm.setFarm(data);
	}
	, removeExcept = function(id){
		data = data_farm.getFarm();
		var exceptions = data.LIST_EXCEPTIONS;
		exceptions ? exceptions = exceptions.filter(f => f != id) : null;
		data.LIST_EXCEPTIONS = exceptions;
		data_farm.setFarm(data);
	}
	, addFarmSelector = function(){
		services.$timeout(function(){
			try {
				var BattleReportController = angular.element(document.querySelector('[ng-controller="BattleReportController"]')).scope();
				if(BattleReportController){
					var elemento_pai = $("section.report").find(".tbl-result")
					var button_exist = angular.element(document.querySelector('#check-button'));
					if (!(button_exist != undefined && button_exist.length > 0)){        
						var elemento_div = document.createElement("div");
						var elemento_div_dot = document.createElement("span");
						elemento_div.appendChild(elemento_div_dot);
						elemento_div_dot.setAttribute("id", "check-button");
						elemento_div.className = "icon-26x26-dot-bg";
						elemento_div_dot.className = "icon-26x26-dot-red";
						elemento_pai.append(elemento_div);
					}

					BattleReportController.$watch('reportData', function() {
						data = data_farm.getFarm();
						var exceptions = data.LIST_EXCEPTIONS;
						exceptions.find(f => f == BattleReportController.reportData.defVillageId) ? $("#check-button").removeClass("icon-26x26-dot-red").addClass("icon-26x26-dot-green") : $("#check-button").removeClass("icon-26x26-dot-green").addClass("icon-26x26-dot-red");;
						$("#check-button").click(function () {
							if ($("#check-button").attr("class")[0] === 'icon-26x26-dot-green') {
								$(this).removeClass("icon-26x26-dot-green").addClass("icon-26x26-dot-red");
								removeExcept(BattleReportController.reportData.defVillageId);
							} else {
								$(this).removeClass("icon-26x26-dot-red").addClass("icon-26x26-dot-green");
								addExcept(BattleReportController.reportData.defVillageId);
							}
						});
					});
				}
			}				

			catch (err){
				return
			}

		}, 1000);
	}
	, loadMap = function (x, y, dist){
		var coordX = x - dist;
		var coordY = y - dist;
		var ciclos = 0;

		Math.trunc(dist / conf. MAP_CHUNCK_LEN) / (dist / conf. MAP_CHUNCK_LEN) < 1 ? ciclos = Math.trunc(dist / conf. MAP_CHUNCK_LEN) + 1 : ciclos = Math.trunc(dist / conf. MAP_CHUNCK_LEN);

		var t_ciclo = 0;
		if (ciclos % 2 < 1){
			t_ciclo = ciclos + 1;
		} else {
			t_ciclo = ciclos;
		}

		var map_chunk_size = Math.round(dist * 2 / t_ciclo);

		var grid = setupGrid(t_ciclo);
		for (var i = 0; i < t_ciclo; i++){
			for (var j = 0; j < t_ciclo; j++){
				grid[i][j] = {"x":coordX + (map_chunk_size * i), "y":coordY + (map_chunk_size * j), "dist": map_chunk_size};
				grid[i][j].villages = [];
			};
		};
		return {
			grid: grid
		};
	}
	, sendCmd = function(preset, lista_barbaras, callback){
		var countCmd = 0;
		data = data_farm.getFarm()
		var listaBarbaras = data.LIST_BB
		var village = services.modelDataService.getSelectedCharacter().getVillage(preset.villageId);
		var aldeia_units = angular.copy(village.unitInfo.units);
		var preset_units = preset.preset_units;
		lista_barbaras.forEach(function(barbara){
			var interval_timeout_ciclo_command_farm = 1000 + (Math.random() * 1000 / 2);
			if(units_analyze(preset_units, aldeia_units)){
				req++;
				s[p.toString() + "id" + preset.villageId] = services.$timeout(function(){
					rdy++;
					services.socketService.emit(providers.routeProvider.SEND_PRESET, {
						start_village: preset.villageId,
						target_village: barbara,
						army_preset_id: preset.preset_id,
						type: "attack"
					});
					if(req == rdy){
						Object.keys(s).map(function(key) {
							services.$timeout.cancel(s[key]);
						});
						s = {};
						req = 0;
						rdy = 0;
					}

				}, interval_timeout_ciclo_command_farm * countCmd);

				listaBarbaras.push(barbara);
				countCmd++;
				p++;
				var unit = 0;
				var rest = [];
				for (unit_preset in preset_units){
					if (preset_units.hasOwnProperty(unit_preset)){
						if(preset_units[unit_preset] > 0){
							if (verif_Exist(unit_preset, aldeia_units)){
								if(aldeia_units[unit_preset].available >= preset_units[unit_preset]){
									unit = aldeia_units[unit_preset].available - preset_units[unit_preset];
									rest = aldeia_units;
									rest[unit_preset].available = unit;
								} else {
									rest = aldeia_units;
									rest[unit_preset].available = 0;
								}
							}
						}
					}
				}
				aldeia_units = rest;
			} else {
				for (var i in listaBarbaras){
					if (listaBarbaras.hasOwnProperty(i))    {
						if (listaBarbaras[i] == barbara){
							listaBarbaras.splice(i, 1);
						} 
					}
				}
			}

		});
		if(req == rdy){
			Object.keys(s).map(function(key) {
				services.$timeout.cancel(s[key]);
			});
			s = {};
			req = 0;
			rdy = 0;
			p = 0;
		}
		data_farm.addBB(listaBarbaras);
		callback();
	}
	, units_analyze = function(preset_units, aldeia_units){
		var list = [];
		for (unit_preset in preset_units){
			if (preset_units.hasOwnProperty(unit_preset)){
				if(preset_units[unit_preset] > 0){
					if(unit_preset != "snob"){
						if (verif_Exist(unit_preset, aldeia_units)){
							aldeia_units[unit_preset].available >= preset_units[unit_preset] ? list.push(unit_preset): null;
						}
					} else {
						return false;
					}
				}
			}
		}
		return list.length > 0 ? true : false;
	}
	,
	verif_Exist = function (obj_search, lista){
		for(obj in lista){
			if (lista.hasOwnProperty(obj)){
				if (obj_search == obj){
					return lista[obj].available != undefined && lista[obj].available > 0 ?  true : false;
				}
			}
		}
		return false;
	}
	, exec = function (x, y, dist , callback){
		var grid = loadMap(x, y, dist).grid;
		var listaGrid = [];
		var l = Object.keys(grid).length;
		for(tx = 0; tx < l; tx++){
			for(ty = 0; ty < l; ty++){
				listaGrid.push({
					x: grid[tx][ty].x,
					y: grid[tx][ty].y,
					dist: grid[tx][ty].dist
				});
			}
		};
		listaGrid.sort(function (a, b) {
			if (Math.abs(a.x - x) != Math.abs(b.x - x)){
				if (Math.abs(a.x - x) < Math.abs(b.x - x)) {
					return 1;
				};
				if (Math.abs(a.x - x) > Math.abs(b.x - x)) {
					return -1;
				};
			} else if(Math.abs(a.y - y) != Math.abs(b.y - y)){
				if (Math.abs(a.y - y) < Math.abs(b.y - y)) {
					return 1;
				};
				if (Math.abs(a.y - y) > Math.abs(b.y - y)) {
					return -1;
				};
			} else {
				return 0;	
			}

		});
		callback(listaGrid);
	}
	, prox = function(){
		var countProc = 0;
		data = data_farm.getFarm()
		var P = function(){
			var preset = comandos_preset.shift();
			var x = preset.x;
			var y = preset.y;
			var dist = preset.distancia;
			exec(x, y, dist , function(listaGrid){
				var cmds_length = services.modelDataService.getSelectedCharacter().getVillage(preset.villageId).getCommandListModel().data.length;
				var cmds = data.MAX_COMMANDS - cmds_length;

				function st(){
					console.log("Ciclo de farm terminado");
					return;	
				}

				loadVillages(cmds, listaGrid, function(lista_barbaras){
					if (lista_barbaras.length > 0){
						countProc++;
						var delay = 0;
						if (countProc > 10){
							countProc = 0;
							delay = 10000;
						}
						services.$timeout(function(){
							sendCmd(preset, lista_barbaras, function(){
								if (comandos_preset.length > 0){
									console.log("preset length " + comandos_preset.length)
									if(isRunning){
										if(isPaused){
											var listener_resume = $rootScope.$on("resume", function(){
												P()
												listener_resume()
												listener_resume = undefined;
											})
										} else {
											P()
										}
									} else {
										return
									}
								} else {
									st();
									return;
								}
							});
						}, delay)
					} else {
						if (comandos_preset.length > 0){
							console.log("preset length " + comandos_preset.length)
							if(isRunning){
								if(isPaused){
									var listener_resume = $rootScope.$on("resume", function(){
										P()
										listener_resume()
										listener_resume = undefined;
									})
								} else {
									P()
								}
							} else {
								return
							}
						} else {
							st();
							return
						}
					}
				});
			});
		}
		if(isRunning){
			if(isPaused){
				var listener_resume = $rootScope.$on("resume", function(){
					P()
					listener_resume()
					listener_resume = undefined;
				})
			} else {
				P()
			}
		} else {
			return
		}
	}
	, execute_preset = function(preset_list, tempo){
		var calcular_Distancia = function (bonus, unidades){
			function return_min(tempo){
				if (tempo != undefined){
					var ar_tempo = tempo.split(":");
					var hr = parseInt(ar_tempo[0]) || 0;
					var min = parseInt(ar_tempo[1]) || 0;
					var seg = parseInt(ar_tempo[2]) || 0;
					return (hr * 60 + min +  seg / 60);
				} else {
					return 0;
				}
			}
			var list_select = [];
			var lista_atualizada = [];
			var timetable = services.modelDataService.getGameData().data.units.map(function(obj, index, array){
				return [obj.name, obj.speed]
			})
			var distancia = 0;
			for (un in unidades) {
				if (unidades.hasOwnProperty(un)){
					if(unidades[un] > 0){
						for(ch in timetable){
							if (timetable.hasOwnProperty(ch)){
								if (timetable[ch][0] == un){
									list_select.push(timetable[ch]);
								}
							}
						}
					}
				}
			}
			if (list_select.length > 0){
				list_select.sort(function(a, b){return a[1] - b[1]});
				var velocidade_total = list_select.pop()[1];
				distancia = Math.trunc((data_farm.getFarm().TEMPO_DE_PERCURSO / 60 / 1000 / velocidade_total) * (bonus / 100) * 0.75);
			} 
			return distancia;
		}
		, assigned_Villages = function (list_assigned_villages, callback){
			data = data_farm.getFarm()
			var listaBarbaras = data.LIST_BB;

			var rallyPointSpeedBonusVsBarbarians = services.modelDataService.getWorldConfig().getRallyPointSpeedBonusVsBarbarians();
			function n(){
				var preset = list_assigned_villages.shift();
				var village_id = preset.village_id;
				var village = services.modelDataService.getSelectedCharacter().getVillage(village_id);
				if(!village) {
					list_assigned_villages.length > 0 ? n() : callback(comandos_preset);
					return;
				}
				var aldeia_units = angular.copy(village.unitInfo.units);
				var preset_units = preset.units;
				var village_bonus = rallyPointSpeedBonusVsBarbarians[village.getBuildingData() ? village.getBuildingData().getDataForBuilding("rally_point").level :  1] * 100;
				var aldeia_commands = village.getCommandListModel().data;
				aldeia_commands.forEach(function(aldeia){
					!(listaBarbaras.find(f => f === aldeia.targetVillageId)) ? listaBarbaras.push(aldeia.targetVillageId) : null;
				})
				data_farm.addBB(listaBarbaras);
				if(aldeia_commands.length < data.MAX_COMMANDS && data_farm.getFarm().LIST_ATIVATE[village_id] == true){
					if (units_analyze(preset_units, aldeia_units)){
						var comando = {
								villageId: village_id,
								bonus: village_bonus,
								preset_id: preset.preset_id,
								preset_units: preset.units,
								x: village.data.x,
								y: village.data.y,
								distancia: calcular_Distancia(village_bonus, preset_units)
						};
						if (!comandos_preset.find(f => f === comando)){
							comandos_preset.push(comando);
						};
					};
				};
				list_assigned_villages.length > 0 ? n() : callback();
			};
			if(isRunning){
				if(isPaused){
					var listener_resume = $rootScope.$on("resume", function(){
						list_assigned_villages.length > 0 ? n() : callback();
						listener_resume()
						listener_resume = undefined;
					})
				} else {
					list_assigned_villages.length > 0 ? n() : callback();
				}
			} else {
				return
			}
		};

		return services.$timeout(function () {
			var lista_preset = []
			, list_assigned_villages = []
			, preset = {}
			, data = data_farm.getFarm()

			function proc(){
				Object.keys(preset_list).forEach(function(value, key, map){
					var assigned_villages = preset_list[value].assigned_villages;
					assigned_villages.forEach(function(village){
						list_assigned_villages.push(
								{
									village_id : village,
									preset_id : value,
									units: preset_list[value].units,
								}
						);
					});
				});
				assigned_Villages(list_assigned_villages, function(){
					if (comandos_preset.length > 0){
						if(isRunning){
							if(isPaused){
								var listener_resume = $rootScope.$on("resume", function(){
									prox();
									listener_resume()
									listener_resume = undefined;
								})
							} else {
								prox();
							}
						} else {
							return
						}
					}
				});
			}

			data_farm.clearBB();

			if(isRunning){
				if(isPaused){
					var listener_resume = $rootScope.$on("resume", function(){
						proc()
						listener_resume()
						listener_resume = undefined;
					})
				} else {
					proc()
				}
			} else {
				return
			}
		}, tempo);
	}
	, loadVillages = function (cmds, listaGrid, callback){
		var request = 0
		, requestReady = 0
		,
		existRange = function (vill){
			data = data_farm.getFarm();
			if(vill.points >= data.MIN_POINTS && vill.points <= data.MAX_POINTS){
				return true
			} else {
				return false
			}
			return data_farm.getFarm().LIST_EXCEPTIONS.find(f => f === id) ? true : false;
		}
		,
		existException = function (id){
			return data_farm.getFarm().LIST_EXCEPTIONS.find(f => f === id) ? true : false;
		}
		,
		existBarbara = function (id){
			return data_farm.getFarm().LIST_BB.find(f => f === id) ? true : false;
		}
		,
		existLista = function (id, lista_barbaras){
			return lista_barbaras.find(f => f === id) ? true : false;
		}
		,
		T = function (){
			return services.$timeout(function(){
				var reg;
				if (listaGrid.length > 0){
					reg = listaGrid.shift();
					if (reg.dist > 0){
						request++;
						services.socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:(reg.x), y:(reg.y), width: reg.dist, height: reg.dist}, function(data){
							requestReady++;
							var lista_barbaras = [];
							if (data != undefined && data.villages != undefined && data.villages.length > 0){
								var i = Math.round(Math.random() * 10);
								var listaVil = angular.copy(data.villages);
								var xT = reg.x;
								var yT = reg.y;
								var distT = reg.dist / 2;
								var s = xT + distT;
								var r = yT + distT;
								listaVil.sort(function (a, b) {
									if (Math.abs(a.x - s) != Math.abs(b.x - s)){
										if (Math.abs(a.x - s) < Math.abs(b.x - s)) {
											return 1;
										};
										if (Math.abs(a.x - s) > Math.abs(b.x - s)) {
											return -1;
										};
									} else if(Math.abs(a.y - r) != Math.abs(b.y - r)){
										if (Math.abs(a.y - r) < Math.abs(b.y - r)) {
											return 1;
										};
										if (Math.abs(a.y - r) > Math.abs(b.y - r)) {
											return -1;
										};
									} else {
										return 0;	
									}
								});
								var p = 0;
								for (j = 0; j < listaVil.length; j++){
									if (listaVil[j].affiliation == "barbarian" && existRange(listaVil[j]) && !existException(listaVil[j].id) && !existBarbara(listaVil[j].id) && !existLista(listaVil[j].id, lista_barbaras) && p < cmds){
										lista_barbaras.push(listaVil[j].id);
										p++;
									}
								}
							} 
							if (request == requestReady){
								if (listaGrid.length > 0){
									T();
								} else {
									request = 0;
									requestReady = 0;
									callback(lista_barbaras);
								}
							};
						});

					} else {
						callback([]);
					}
				} else {
					callback([]);
				}
			}, 3000)
		}
		if (listaGrid.length > 0){
			T();
		} else {
			request = 0;
			requestReady = 0;
			callback([]);
		}
	}
	, init_preset = function(tempo_de_farm_miliseconds){
		var qtd_ciclo = Math.trunc((data.TERMINO_DE_FARM - data.INICIO_DE_FARM) / tempo_de_farm_miliseconds);
		var preset_list = [];
		var p = 0;
		if (qtd_ciclo > 0 && !isNaN(parseInt(qtd_ciclo))) {
			new Promise(function(resolve, reject){
				services.socketService.emit(providers.routeProvider.GET_PRESETS, {}, function (data_result){
					data_result.presets.forEach(function(preset){
						preset_list[preset.id] = preset;
					});
					resolve(preset_list);
				})
			})
			.then(function(preset_list){
				for (i = 0; i < qtd_ciclo; i++){
					var t = tempo_de_farm_miliseconds * i;
					var tempo = Math.round(t + ((t / 2) * Math.random()));
					timeoutIdFarm[i] = execute_preset(preset_list, tempo)
				}
			}, function(reason) {

			});
		} else {
			Object.keys(timeoutIdFarm).map(function(key) {
				services.$timeout.cancel(timeoutIdFarm[key]);
			});
			timeoutIdFarm = {};
		}
	}
	, initCicle = function(){
		listener_report = $rootScope.$on(providers.eventTypeProvider.REPORT_VIEW, addFarmSelector);
		data = data_farm.getFarm()
		var villages = services.modelDataService.getSelectedCharacter().getVillages()
		for (v in villages) {
			!data.LIST_ATIVATE[v] ? data.LIST_ATIVATE[v] = true : null;
		}
		data_farm.setFarm(data);
		var tempo_de_farm_miliseconds = data.TEMPO_DE_FARM;
		var tempo_limite = (data.TERMINO_DE_FARM - helper.gameTime()) - tempo_de_farm_miliseconds;
		if (tempo_limite > 0){
			var tempo_delay = data.INICIO_DE_FARM - helper.gameTime();
			if (tempo_delay > 0){
				interval_init = services.$timeout(function(){
					$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_SUCCESS, {message: services.$filter("i18n")("wait_init", $rootScope.loc.ale, "farm")})
					init_preset(tempo_de_farm_miliseconds)
				}, tempo_delay);
				return;
			} else {
				data.INICIO_DE_FARM = helper.gameTime();
				data_farm.setFarm(data);
				$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_SUCCESS, {message: services.$filter("i18n")("farm_init", $rootScope.loc.ale, "farm")})
				init_preset(tempo_de_farm_miliseconds)
				return;
			}
		} else {
			isRunning = !1;
			$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: services.$filter("i18n")("farm_no_init", $rootScope.loc.ale, "farm")})
			return;
		}
	}
	, init = function (){
		data_farm.clearBB();
		isInitialized = !0
		start();
	}
	, start = function (){
		if(isRunning){return}
		isRunning = !0
		ready(initCicle, ["all_villages_ready"])
	}
	, stop = function (){
		Object.keys(timeoutIdFarm).map(function(key) {
			services.$timeout.cancel(timeoutIdFarm[key]);
		});
		typeof(listener_report) == "function" ? listener_report(): null;
		listener_report = undefined;
		data_farm.clearBB();
		timeoutIdFarm = {};
		isRunning = !1
	}
	, pause = function (){
		isPaused = !0
	}
	, resume = function (){
		isPaused = !1
		$rootScope.$broadcast("resume")
	}
	return	{
		init			: init,
		start			: start,
		stop 			: stop,
		pause 			: pause,
		resume 			: resume,
		isRunning		: function() {
			return isRunning
		},
		isPaused		: function() {
			return isPaused
		},
		isInitialized	: function(){
			return isInitialized
		},
		version			: "1.0.0",
		name			: "farm"
	}
})
,
define("robotTW2/farm/ui", [
	"robotTW2/farm",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_farm",
	"helper/time",
	"robotTW2/conf"
	], function(
			farm,
			builderWindow,
			services,
			providers,
			data_farm,
			helper,
			conf
	){
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.FARM;
		var templateName = "farm";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
	}
	, injectScope = function(){
		$($window.$data.rootnode).addClass("fullsize");
		var $scope = $window.$data.scope;
		$scope.title = services.$filter("i18n")("title", $rootScope.loc.ale, "farm");
		$scope.farm_running = services.$filter("i18n")("farm_running", $rootScope.loc.ale, "farm");
		$scope.time_max = services.$filter("i18n")("time_max", $rootScope.loc.ale, "farm");
		$scope.init_hour = services.$filter("i18n")("init_hour", $rootScope.loc.ale, "farm");
		$scope.terminate_hour = services.$filter("i18n")("terminate_hour", $rootScope.loc.ale, "farm");
		$scope.time_cicle = services.$filter("i18n")("time_cicle", $rootScope.loc.ale, "farm");
		$scope.init_date = services.$filter("i18n")("init_date", $rootScope.loc.ale, "farm");
		$scope.terminate_date = services.$filter("i18n")("terminate_date", $rootScope.loc.ale, "farm");
		$scope.text_cmd_max = services.$filter("i18n")("text_cmd_max", $rootScope.loc.ale, "farm");
		$scope.text_min_point = services.$filter("i18n")("text_min_point", $rootScope.loc.ale, "farm");
		$scope.text_max_point = services.$filter("i18n")("text_max_point", $rootScope.loc.ale, "farm");
		$scope.exceptions = services.$filter("i18n")("exceptions", $rootScope.loc.ale, "farm");
		$scope.villages_selections = services.$filter("i18n")("villages_selections", $rootScope.loc.ale, "farm");
		$scope.save = services.$filter("i18n")("SAVE", $rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.start = services.$filter("i18n")("START", $rootScope.loc.ale);
		$scope.pause = services.$filter("i18n")("PAUSE", $rootScope.loc.ale);
		$scope.resume = services.$filter("i18n")("RESUME", $rootScope.loc.ale);
		$scope.stop = services.$filter("i18n")("STOP", $rootScope.loc.ale);
		$scope.data = data_farm.getFarm();
		$scope.paused = !1;

		$window.$data.ativate = $scope.data.ATIVATE;
		$scope.isRunning = farm.isRunning();

		var villages = services.modelDataService.getSelectedCharacter().getVillages()
		for (v in villages) {
			$scope.data.LIST_ATIVATE[v] == undefined ? $scope.data.LIST_ATIVATE[v] = true : null;
		}

		for (v in $scope.data.LIST_ATIVATE) {
			!villages[v] ? delete $scope.data.LIST_ATIVATE[v] : null
		}

		data_farm.setFarm($scope.data);

		var dataAtual = services.$filter("date")(new Date(helper.gameTime()), "yyyy-MM-dd");
		var getMilliseconds = helper.readableMilliseconds($scope.data.TEMPO_DE_PERCURSO);
		var getMillisecondsB = helper.readableMilliseconds($scope.data.TEMPO_DE_FARM);

		$scope.tempo_de_percurso = services.$filter("date")(new Date(dataAtual + " " + getMilliseconds), "HH:mm:ss");
		$scope.tempo_de_farm = services.$filter("date")(new Date(dataAtual + " " + getMillisecondsB), "HH:mm:ss");

		if($scope.data.INICIO_DE_FARM < helper.gameTime()) {
			$scope.data.INICIO_DE_FARM = helper.gameTime()
		}

		var inicio_de_farm = new Date(Math.trunc($scope.data.INICIO_DE_FARM / 1000) * 1000);
		var termino_de_farm = new Date(Math.trunc($scope.data.TERMINO_DE_FARM / 1000) * 1000);
		if(inicio_de_farm > termino_de_farm){
			termino_de_farm = new Date(termino_de_farm.getTime() + 86400000)
		}

		$scope.inicio_de_farm = services.$filter("date")(inicio_de_farm, "HH:mm:ss");
		$scope.termino_de_farm = services.$filter("date")(termino_de_farm, "HH:mm:ss");
		$scope.data_termino_de_farm = services.$filter("date")(termino_de_farm, "yyyy-MM-dd");
		$scope.data_inicio_de_farm = services.$filter("date")(inicio_de_farm, "yyyy-MM-dd");

		$scope.blur = function(callback){
			$scope.tempo_de_percurso = $("#tempo_de_percurso").val()
			$scope.tempo_de_farm = $("#tempo_de_farm").val()
			$scope.inicio_de_farm = $("#inicio_de_farm").val()
			$scope.termino_de_farm = $("#termino_de_farm").val()
			$scope.data_termino_de_farm = $("#data_termino_de_farm").val()
			$scope.data_inicio_de_farm = $("#data_inicio_de_farm").val()

			if($scope.tempo_de_percurso.length <= 5){
				$scope.tempo_de_percurso = $scope.tempo_de_percurso + ":00"
			}

			if($scope.tempo_de_farm.length <= 5){
				$scope.tempo_de_farm = $scope.tempo_de_farm + ":00"
			}

			var tempo_escolhido_inicio = new Date($scope.data_inicio_de_farm + " " + $scope.inicio_de_farm).getTime();
			var tempo_escolhido_termino = new Date($scope.data_termino_de_farm + " " + $scope.termino_de_farm).getTime();

			if(tempo_escolhido_inicio > tempo_escolhido_termino){
				tempo_escolhido_termino = new Date(tempo_escolhido_termino + 86400000)
				$scope.termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "HH:mm:ss");
				$scope.data_termino_de_farm = services.$filter("date")(tempo_escolhido_termino, "yyyy-MM-dd");
			}

			document.getElementById("data_termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "yyyy-MM-dd");
			document.getElementById("data_inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "yyyy-MM-dd");
			document.getElementById("termino_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_termino), "HH:mm:ss");
			document.getElementById("inicio_de_farm").value = services.$filter("date")(new Date(tempo_escolhido_inicio), "HH:mm:ss");

			var d = {
					TEMPO_DE_PERCURSO 	: helper.unreadableSeconds($scope.tempo_de_percurso) * 1000,
					TEMPO_DE_FARM 		: helper.unreadableSeconds($scope.tempo_de_farm) * 1000,
					INICIO_DE_FARM 		: tempo_escolhido_inicio,
					TERMINO_DE_FARM 	: tempo_escolhido_termino
			}
			angular.merge($scope.data , d);
			data_farm.setFarm($scope.data);
			$scope.data = data_farm.getFarm();

			if(callback != undefined && typeof(callback) == "function"){
				callback()
			}
		}

		$scope.$watchCollection("data.LIST_ATIVATE", function(){
			data_farm.setFarm($scope.data);
			if (!$rootScope.$$phase) $rootScope.$apply();
		})

		$scope.deleteException = function(id_village){
			$scope.data.LIST_EXCEPTIONS = $scope.data.LIST_EXCEPTIONS.filter(f => f != id_village) 
			data_farm.setFarm($scope.data);
			getExceptions();
			if (!$rootScope.$$phase) $rootScope.$apply();
		}

		$scope.blurConfig = function(){
			data_farm.setFarm($scope.data);
			if (!$rootScope.$$phase) $rootScope.$apply();
		}

		$scope.getVillage = function(id){
			var village = services.modelDataService.getSelectedCharacter().getVillage(id);
			return village.getName() + " - (" + village.getX() + "|" + village.getY() + ")"
		}

		var my_village_id = services.modelDataService.getSelectedVillage().getId();

		function getExceptions(){
			$scope.list_exceptions = {};
			$scope.data.LIST_EXCEPTIONS.forEach(function(vid){
				services.socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
					'village_id'	: vid,
					'my_village_id'	: my_village_id,
					'num_reports'	: 5
				}, function(data) {
					$scope.list_exceptions[data.village_id] = {
							village_name : data.village_name,
							village_x : data.village_x,
							village_y : data.village_y
					}
					if (!$rootScope.$$phase) $rootScope.$apply();
				})
			})
		}

		getExceptions();

		$scope.start_farm = function(){
			$scope.blur(function(){
				farm.start();
				$scope.isRunning = farm.isRunning();
			});
		}
		$scope.stop_farm = function(){
			farm.stop();
			$scope.isRunning = farm.isRunning();
		}
		$scope.pause_farm = function(){
			farm.pause();
			$scope.paused = !0;
		}
		$scope.resume_farm = function(){
			farm.resume();
			$scope.paused = !1;
		}

		if (!$rootScope.$$phase) {
			$rootScope.$apply();
		}

		services.$timeout(function(){
			$window.setCollapse();
			$window.recalcScrollbar();
		}, 500)


	}

	Object.setPrototypeOf(farm, {
		build : function(){
			build(injectScope)
		}
	})

})
