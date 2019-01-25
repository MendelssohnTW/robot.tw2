define("robotTW2/services/DefenseService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/conf",
	"helper/time",
	"conf/unitTypes",
	"robotTW2/time",
	"robotTW2/calibrate_time",
	], function(
			robotTW2,
			version,
			conf,
			helper,
			unitTypes,
			time,
			calibrate_time
	){
	return (function DefenseService(
			$rootScope,
			providers,
			$timeout,
			socketService,
			modelDataService,
			overviewService,
			loadController,
			ready,
			commandQueue,
			requestFn
	) {

		var isRunning = !1
		, isPaused = !1
		, isInitialized = !1
		, t = undefined
		, oldCommand
		, d = {}
		, scope = $rootScope.$new()
		, interval_reload = undefined
		, listener_verify = undefined
		, listener_lost = undefined
		, listener_conquered = undefined
		, promise_verify = undefined
		, queue_verifiy = []
		, that = this
		, loadVillage = function(cmd, callback){
			var g = 20;
			var x = cmd.targetX || cmd.target_x;
			var y = cmd.targetY || cmd.target_y;
			var id = cmd.id || cmd.command_id;
			loadIsRunning = !1
			var lista_aldeiasY = [];
			var lista_aldeias = [];
			var lista_barbaras = [];
			return socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:(x - g), y:(y - g), width: 2 * g, height: 2 * g}, function(data){
				lista_barbaras = [];
				lista_aldeias = [];
				lista_aldeiasY = [];
				if (data != undefined && data.villages != undefined && data.villages.length > 0){
					var listaVil = angular.copy(data.villages);
					var p = 0;
					for (j = 0; j < listaVil.length; j++){
						if (listaVil[j].affiliation == "own" ){
							lista_aldeias.push(listaVil[j]);
							p++;
						}
					}
					angular.extend(lista_aldeiasY, lista_aldeias);
					lista_aldeias.sort(function (a, b) {
						if (Math.abs(a.x - x) != Math.abs(b.x - x)) {
							if (Math.abs(a.x - x) < Math.abs(b.x - x)) {
								return 1;
							};
							if (Math.abs(a.x - x) > Math.abs(b.x - x)) {
								return -1;
							};
						} else if (Math.abs(a.y - y) != Math.abs(b.y - y)) {
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

					lista_aldeiasY.sort(function (a, b) {

						if (Math.abs(a.y - y) != Math.abs(b.y - y)) {
							if (Math.abs(a.y - y) < Math.abs(b.y - y)) {
								return 1;
							};
							if (Math.abs(a.y - y) > Math.abs(b.y - y)) {
								return -1;
							};
						} else if (Math.abs(a.x - x) != Math.abs(b.x - x)) {
							if (Math.abs(a.x - x) < Math.abs(b.x - x)) {
								return 1;
							};
							if (Math.abs(a.x - x) > Math.abs(b.x - x)) {
								return -1;
							};
						} else {
							return 0;
						}
					});

				} 
				loadIsRunning = !1
				lista_aldeias && lista_aldeias.length ? lista_aldeias.pop() : null;
				lista_aldeias && lista_aldeias.length ? aldeiaX = lista_aldeias.pop() : aldeiaX = null;

				lista_aldeiasY && lista_aldeiasY.length ? lista_aldeiasY.pop() : null;
				lista_aldeiasY && lista_aldeiasY.length ? aldeiaY = lista_aldeiasY.pop() : aldeiaY = null;

				(aldeiaX ? Math.abs(aldeiaX.x - x) : 0) + 
				(aldeiaX ? Math.abs(aldeiaX.y - y) : 0) <= 
					(aldeiaY ? Math.abs(aldeiaY.x - x) : 0) + 
					(aldeiaY ? Math.abs(aldeiaY.y - y) : 0) ? aldeia = aldeiaX : aldeia = aldeiaY;

				typeof(callback) == "function" ? callback(aldeia, cmd): null;
			});
		}
		, troops_measure = function(command, callback){
			var x1 = command.startX, 
			y1 = command.startY, 
			x2 = command.targetX, 
			y2 = command.targetY,
			seconds_duration = helper.unreadableSeconds(helper.readableMilliseconds((command.completedAt - command.startedAt), null, true))
			if (y1 % 2)
				x1 += .5;
			if (y2 % 2)
				x2 += .5;
			var dy = y1 - y2,
			dx = x1 - x2;
			var distancia = Math.abs(Math.sqrt(Math.pow(dx, 2) + (Math.pow(dy, 2) * 0.75)));

			var t = modelDataService.getGameData().data.units.map(function(obj, index, array){
				if(obj.name != "knight"){
					return [obj.speed, obj.name]
				}
			}).filter(f=>f!=undefined).map(m => {
				return [m[0], m[1], Math.abs((seconds_duration / 60) - Math.round(m[0] * distancia))];
			}).sort((a, b) => {
				return a[2] - b[2];
			});

			var units_ret = [];
			angular.extend(units_ret, t);
			var unitType = units_ret.shift()[1]; 

			switch (unitType) {
			case "light_cavalry":
				callback(unitTypes.LIGHT_CAVALRY, unitType);
				break;
			case "heavy_cavalry":
				callback(unitTypes.HEAVY_CAVALRY, unitType);
				break;
			case "axe":
				callback(unitTypes.AXE, unitType);
				break;
			case "sword":
				callback(unitTypes.SWORD, unitType);
				break;
			case "ram":
				callback(unitTypes.RAM, unitType);
				break;
			case "snob":
				callback(unitTypes.SNOB, unitType);
				break;
			case "trebuchet":
				callback(unitTypes.TREBUCHET, unitType);
				break;
			default : 
				callback(true, "");
			}
		}
		, troops_analyze = function(list_snob, list_trebuchet, list_others, list_preserv_others, callback){
			var sortearSnob = function(list){
				list.sort(function (a, b) {
					return a.completedAt - b.completedAt;
				});
				return list
			}
			, sortear = function(list){
				list.sort(function (a, b) {
					return b.completedAt - a.completedAt;
				});
				return list
			}
			, reduzirSnob = function(list){
				var g = [];
				var t = 0;
				list.length ? list.reduce(function(prevVal, elem, index, array) {
					var b = t == 0 ? prevVal.completedAt : t;
					if(b - elem.completedAt <= conf.TIME_SNIPER_POST + conf.TIME_SNIPER_ANT) {
						t = prevVal.completedAt;
						g.push(elem)
						return elem;
					} else {
						t = 0;
						return elem
					}
				})
				: null;
				return g;
			}
			, reduzir = function(listP){
				var g = [];
				var t = 0;
				var list_withSnob = {};

				function next_a(listH){
					var l = 0;
					function next_Snob(listB){
						var cmWithSnob = listB.find(f => f.nob == true);
						if(cmWithSnob){
							var indexSnob = listB.indexOf(cmWithSnob);
							list_withSnob[l] = listB.splice(indexSnob, listB.length);
							var listC = [];
							angular.merge(listC, list_withSnob[l])
							if(listB.length){
								l++;
								next_Snob(listC);
							} else {
								l = 0;
								return;
							}
						}
					}

					next_Snob(listH);
				}

				listP.length ? next_a(listP) : null;

				listP.length 
				? listP.reduce(function(prevVal, elem, index, array) {
					var b = t == 0 ? prevVal.completedAt : t;
					if(b - elem.completedAt <= conf.TIME_SNIPER_POST + conf.TIME_SNIPER_ANT && !elem.nob) {
						t = prevVal.completedAt;
						g.push(elem)
						return elem;
					} else {
						t = 0;
						return elem
					}
				})
				: null

				Object.keys(list_withSnob).map(function(key){
					var listJ = list_withSnob[key]; 
					listJ.length 
					? listJ.reduce(function(prevVal, elem, index, array) {
						var b = t == 0 ? prevVal.completedAt : t;
						if(b - elem.completedAt <= conf.TIME_SNIPER_POST + conf.TIME_SNIPER_ANT) {
							t = prevVal.completedAt;
							g.push(elem)
							return elem;
						} else {
							t = 0;
							return elem
						}
					})
					: null
				})
				return g;
			}
			, removerItens =  function(list, g){
				g.forEach(function(cm){
					list = list.filter(function(elem, index, array){
						return elem.id != cm.id
					})
				})
				g.forEach(function(cm){
					var cg = list.find(function(elem, index, array){
						return elem.id != cm.id
					})
					cg ? angular.merge(cg, {"nob":true}): null
				})
				return list;
			}
			, estab = function(list){
				list = sortear(list);
				var g = [];
				angular.extend(g, list);
				g = reduzir(g);
				list = removerItens(list, g);
				return list
			}
			, estabSnob = function(list){
				list = sortearSnob(list)
				var g = [];
				angular.extend(g, list);
				g = reduzirSnob(g);
				list = removerItens(list, g);
				list.forEach(function(cg){
					cg ? angular.merge(cg, {"nob":true}): null
				})
				return list
			};

			list_others = removerItens(list_others, list_preserv_others);
			list_others = removerItens(list_others, list_snob);
			list_others = removerItens(list_others, list_trebuchet);

			list_snob = estabSnob(list_snob);
			list_trebuchet = estabSnob(list_trebuchet);

			list_others = list_others.concat(list_preserv_others)
			list_others = list_others.concat(list_snob)
			list_others = list_others.concat(list_trebuchet)
			list_others = estab(list_others);

			function ct(){
				if(list_others.length){
					var cm = list_others.shift()
					loadVillage(cm, function(aldeia, cmt){
						if(aldeia){
							var timeSniperPost = conf.TIME_SNIPER_POST_SNOB;
							if(!cmt.nob) {
								timeSniperPost = $rootScope.data_defense.time_sniper_post;	
							} else {
								timeSniperPost = $rootScope.data_defense.time_sniper_post_snob;
							}
							var params = {
									start_village		: cmt.targetVillageId,
									target_village		: aldeia.id,
									target_name			: aldeia.name,
									target_x			: aldeia.x,
									target_y			: aldeia.y,
									type				: "support",
									data_escolhida		: time.convertMStoUTC(cmt.completedAt),
									time_sniper_ant		: $rootScope.data_defense.time_sniper_ant,
									time_sniper_post	: timeSniperPost,
									preserv				: false,
									id_command 			: cmt.id
							}
							addDefense(params);
						}
						ct();
					});
				} else {
					callback()
				}
			}
			ct()
		}
		, getAtaques = function(){
			return new Promise(function(resolve){
				t = $timeout(resolve , 480000);

				var lt = []

				Object.keys(scope.commands).map(function(key){
					if(scope.commands[key].params.preserv){
						lt.push(scope.commands[key].params)
					} else {
						delete scope.commands[key];
						console.log("removeCommandDefense getAtaques")
						removeCommandDefense(key)
					}
				})

				var vls = modelDataService.getSelectedCharacter().getVillageList(); 
				function gt(){
					if (vls.length){
						var id = vls.shift().data.villageId;
						var list_snob = [];
						var list_trebuchet = [];
						var list_calvary = [];
						var list_infatary = [];
						var list_ram = [];
						var list_others = [];
						var list_preserv_others = [];

						lt.forEach(function(cmd){
							if(cmd.start_village == id){
								list_preserv_others.push(cmd.params)
							}
						})
						lt = [];

						var cmds = modelDataService.getSelectedCharacter().getVillage(id).getCommandListModel();
						var comandos_incoming = cmds.incoming;
						comandos_incoming.sort(function (a, b) {
							return b.completedAt - a.completedAt;
						})
						comandos_incoming.forEach(function(cmd){
							if (cmd.actionType == "attack" && cmd.isCommand && !cmd.returning){
								troops_measure(cmd, function(push , unitType){
									if(push){
										list_others.push(cmd);
										switch (unitType) {
										case "light_cavalry":
											list_calvary.push(cmd);
											break;
										case "heavy_cavalry":
											list_calvary.push(cmd);
											break;
										case "axe":
											list_infatary.push(cmd);
											break;
										case "sword":
											list_infatary.push(cmd);
											break;
										case "ram":
											list_ram.push(cmd);
											break;
										case "snob":
											list_snob.push(cmd);
											break;
										case "trebuchet":
											list_trebuchet.push(cmd);
											break;
										}
									}
								})
							}
						});
						list_snob.length ? list_snob.sort(function (a, b) {return b.completedAt - a.completedAt;}) : null;
						list_trebuchet.length ? list_trebuchet.sort(function (a, b) {return b.completedAt - a.completedAt;}) : null;
						list_others.length ? list_others.sort(function (a, b) {return b.completedAt - a.completedAt;}) : null;
						list_snob.length || list_trebuchet.length || list_others.length ? troops_analyze(list_snob, list_trebuchet, list_others, list_preserv_others,  gt) : gt();
					} else {
//						upDateTbodySupport();
						$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)
						resolve()
					}
				}
				gt()
			})
		}
		, verificarAtaques = function (){
			var renew = false;
			if(!isRunning){return}
			if(!promise_verify){
				promise_verify = getAtaques().then(function(){
					$timeout(function(){
						promise_verify = undefined;
						if(renew) {
							renew = false;
							verificarAtaques()
						}
					}, 5 * 60000)
				})
			} else {
				renew = true;
			}
		}
		, sendCancel = function(params){
			console.log("comando sendCancel")
			var timer_delay = params.timer_delay,
			id = params.id_command;
			console.log("timer_delay " + timer_delay)
			return $timeout(function () {
				console.log("executando comando sendCancel")
				console.log("removeCommandDefense sendCancel")
				removeCommandDefense(id)
				socketService.emit(providers.routeProvider.COMMAND_CANCEL, {
					command_id: id
				})
			}, timer_delay);
		}
		, units_to_send = function(params){
			var lista = [],
			units = {};
			var village = modelDataService.getSelectedCharacter().getVillage(params.start_village);
			if (village && village.unitInfo != undefined){
				var unitInfo = village.unitInfo.units;
				for(obj in unitInfo){
					if (unitInfo.hasOwnProperty(obj)){
						if (unitInfo[obj].available > 0){
							var campo = {[obj]: unitInfo[obj].available};
							units[Object.keys(campo)[0]] = 
								Object.keys(campo).map(function(key) {return campo[key]})[0];
							lista.push(units);
						}
					}
				}
				params.units = units;
//				scope.params[params.id_command] = params;
			};
			if (lista.length > 0 || !params.enviarFull) {
				commandQueue.bind(params.id_command, resendDefense, null, params, function(fns){
					scope.commands[params.id_command] = {
							"timeout" 	: fns.fn.apply(this, [fns.params]),
							"params"	: params
					}
				})
			} else {
				console.log("removeCommandDefense units_to_send")
				removeCommandDefense(params.id_command)
			}
		}
		, sendDefense = function(params){
			return $timeout(units_to_send.bind(null, params), params.timer_delay - conf.TIME_DELAY_UPDATE);
		}
//		, listener_command_returned = function($event, data){
//		if(!$event.currentScope){return}
//		var cmds = Object.keys($event.currentScope.commands).map(function(param){
//		if($event.currentScope.commands[param].id_command == data.command_id) {
//		return $event.currentScope.commands[param]	
//		} else {
//		return undefined
//		}
//		}).filter(f => f != undefined)
//		var cmd = undefined;
//		if(cmds.length){
//		cmd = cmds.pop();
//		}
//		}
		, listener_command_cancel = function($event, data){
			if(!$event.currentScope){return}
			if(data.direction == "backward" && data.type == "support"){
				console.log("listener support backward - command_cancel")
				var cmds = Object.keys($event.currentScope.commands).map(function(param){
					if($event.currentScope.commands[param].params.start_village == data.home.id
							&& $event.currentScope.commands[param].params.target_village == data.target.id
							&& $event.currentScope.commands[param].params.id_command == data.command_id
					) {
						return $event.currentScope.commands[param].params	
					} else {
						return undefined
					}
				}).filter(f => f != undefined)
				var cmd = undefined;
				if(cmds.length){
					cmd = cmds.pop();
//					!scope.listener_returned ? scope.listener_returned = scope.$on(providers.eventTypeProvider.COMMAND_RETURNED, listener_command_returned) : null;
				}
			}
		}
		, listener_command_sent = function($event, data){
			if(!$event.currentScope){return}
			if(data.direction == "forward" && data.type == "support"){
				var cmds = Object.keys($event.currentScope.commands).map(function(param){
					//verificar a origem e alvo do comando
					if($event.currentScope.commands[param].params.start_village == data.home.id 
							&& $event.currentScope.commands[param].params.target_village == data.target.id
					) {
						return $event.currentScope.commands[param].params
					} else {
						return undefined
					}
				}).filter(f => f != undefined)

				cmds.sort(function(a,b){return b.data_escolhida - a.data_escolhida})

				var cmd = undefined; 
				if(cmds.length){
					console.log(cmds[0])
					cmd = cmds.pop();
					var expires = cmd.data_escolhida - (data.time_start * 1000) + cmd.time_sniper_post - $rootScope.data_main.time_correction_command
					, timer_delay = expires / 2
					, params = {
						"timer_delay" 	: timer_delay,
						"id_command" 	: data.id
					}
					if(timer_delay >= 0){
						commandQueue.bind(data.id, sendCancel, null, params, function(fns){
							scope.commands[params.id_command] = {
									"timeout" 	: fns.fn.apply(this, [fns.params]),
									"params"	: params
							}

						})
					}

					console.log("removeCommandDefense listener_command_sent")
					removeCommandDefense(cmd.id_command);

					$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)
				}
			}
		}
		, send = function(params){
			socketService.emit(providers.routeProvider.SEND_CUSTOM_ARMY, {
				start_village		: params.start_village,
				target_village		: params.target_village,
				type				: params.type,
				units				: params.units,
				icon				: 0,
				officers			: params.officers,
				catapult_target		: params.catapult_target
			});

		}
		, resendDefense = function(params){
			var expires_send = params.data_escolhida - params.time_sniper_ant - $rootScope.data_main.time_correction_command
			, timer_delay_send = expires_send - time.convertedTime();

			if(timer_delay_send < 0){
				console.log("removeCommandDefense resendDefense")
				removeCommandDefense(params.id_command)
				return 
			}
			return $timeout(send.bind(null, params), timer_delay_send);
		}
		, addDefense = function(params){
			
			if(!params){return}
			!(typeof(scope.listener_sent) == "function") ? scope.listener_sent = scope.$on(providers.eventTypeProvider.COMMAND_SENT, listener_command_sent) : null;
			!(typeof(scope.listener_cancel) == "function") ? scope.listener_cancel = scope.$on(providers.eventTypeProvider.COMMAND_CANCELLED, listener_command_cancel) : null;

			var id_command = (Math.round(time.convertedTime() + params.data_escolhida).toString());
			if(params.id_command){
				id_command = params.id_command
			}

			console.log("addDefense " + id_command)
			var expires = params.data_escolhida - params.time_sniper_ant - $rootScope.data_main.time_correction_command
			, timer_delay = expires - time.convertedTime();

			if(timer_delay >= 0){
				angular.extend(params, {
					"timer_delay" : timer_delay,
					"id_command": id_command
				})

				commandQueue.bind(params.id_command, sendDefense, null, params, function(fns){
					scope.commands[params.id_command] = {
							"timeout" 	: fns.fn.apply(this, [fns.params]),
							"params"	: params
					}
				})
			}
		}
		, list_timeout = {}
		, addDefenseSelector = function(command, i){
			var opts = ["icon-26x26-dot-red", "icon-26x26-dot-green"];

			var isSelected = command.command_id && requestFn.get(command.command_id, true);
			var isMark = false;
			if (isSelected != undefined){
				isMark = true;
			} else {
				isMark = false;
			}
			$($(".content.incoming td.column-time_completed")[i]).prepend('<div style="float: right;"><input id="sniper_ant" class="sniper_ant" type="number" style="width: 40px; color: white;" step="1" min="5" max"600"><input id="sniper_post" class="sniper_post" type="number" style="width: 40px; color: white;"  step="1" min="1" max"600"></div><div class="' + opts[(isMark) ? 1 : 0] + ' indicatorSelected"></div>');
			if (($(".sniper_ant")[i]) != undefined){
				($(".sniper_ant")[i]).value = isSelected != undefined && isSelected.params != undefined ? isSelected.params.time_sniper_ant / 1000 : $rootScope.data_defense.time_sniper_ant / 1000;
			}
			if (($(".sniper_post")[i]) != undefined){
				($(".sniper_post")[i]).value = isSelected != undefined && isSelected.params != undefined ? isSelected.params.time_sniper_post / 1000 : $rootScope.data_defense.time_sniper_post / 1000;
			}
			$(".indicatorSelected").css("float", "right");
			$($(".indicatorSelected")[i]).click(function () {
				if ($($(".indicatorSelected")[i]).attr("class")[0].split(' ').some(s => s === 'icon-26x26-dot-red')) {
					$(this).removeClass("icon-26x26-dot-red").addClass("icon-26x26-dot-green");
					var sniper_ant;
					var sniper_post;
					($(".sniper_ant")[i]).value < conf.MIN_TIME_SNIPE_ANT ? sniper_ant = conf.MIN_TIME_SNIPE_ANT : ($(".sniper_ant")[i]).value > conf.MAX_TIME_SNIPE_ANT ? sniper_ant = conf.MAX_TIME_SNIPE_ANT : sniper_ant = ($(".sniper_ant")[i]).value; 
					($(".sniper_post")[i]).value < conf.MIN_TIME_SNIPE_POST ? sniper_post = conf.MIN_TIME_SNIPE_POST : ($(".sniper_post")[i]).value > conf.MAX_TIME_SNIPE_POST ? sniper_post = conf.MAX_TIME_SNIPE_POST : sniper_post = ($(".sniper_post")[i]).value;
					var r;
					list_timeout[i] = $timeout(function(){
						r = undefined;
						$(this).removeClass("icon-26x26-dot-green").addClass("icon-26x26-dot-red");
					}, conf.loading_timeout);
					r = loadVillage(command, function(aldeia, cmt){
						$timeout.cancel(list_timeout[i]);	
						if(aldeia){
							var params = {
									start_village		: cmt.target_village_id,
									target_village		: aldeia.id,
									target_name			: aldeia.name,
									target_x			: aldeia.x,
									target_y			: aldeia.y,
									type				: "support",
									data_escolhida		: time.convertMStoUTC(cmt.model.completedAt),
									time_sniper_ant		: sniper_ant * 1000,
									time_sniper_post	: sniper_post * 1000,
									preserv				: true,
									id_command			: cmt.command_id
							}
							addDefense(params);
						}
					})
				} else {
					$(this).removeClass("icon-26x26-dot-green").addClass("icon-26x26-dot-red");
					console.log("removeCommandDefense addDefenseSelector")
					removeCommandDefense(command.command_id)
				}
			});
		}
		, returnCommand = function(){
			overviewService.formatCommand = oldCommand;
		}
		, reformatCommand = function() {
			if(!isRunning){return}
			var OverviewController;
			oldCommand = overviewService.formatCommand;
			overviewService.supportFormatCommand = overviewService.formatCommand;
			var iCount = 0;
			var t = 0;
			var f = undefined;
			var queue_f = [];

			overviewService.formatCommand = function (command) {
				overviewService.supportFormatCommand(command);
				$timeout(function(){
					!OverviewController ? OverviewController = robotTW2.loadController("OverviewController") : OverviewController;
					if (OverviewController && OverviewController.activeTab == OverviewController.TABS.INCOMING){
						addDefenseSelector(command, iCount);
						iCount++
						if ($('span.type').length <= iCount) 
							iCount = 0;
					}
				}, 150)
			};
		}
		, removeCommandDefense = function(id_command){
			console.log("removendo comando " + id_command)
			if(scope.commands[id_command] && typeof(scope.commands[id_command].timeout) == "object"){
				if(scope.commands[id_command].timeout.$$state.status == 0){
					$timeout.cancel(scope.commands[id_command].timeout)	
				}
				delete scope.commands[id_command];
			}

			commandQueue.unbind(id_command)
		}
		, removeAll = function(){
			commandQueue.unbindAll("support")
			scope.commands = {};
			$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)
		}
		, init = function(){
			isInitialized = !0
			start();
		}
		, handlerVerify = function(){
			if(!listener_verify){
				listener_verify = $rootScope.$on(providers.eventTypeProvider.COMMAND_INCOMING, _ => {
					if(!isRunning){return}
					promise_verify = undefined;
					$timeout.cancel(t);
					$timeout(verificarAtaques , 10000);
				});
			}
		}
		, start = function(){
			if(isRunning){return}
			ready(function(){
				calibrate_time()
				isRunning = !0;
				reformatCommand();
//				w.reload();
				if(!listener_lost){
					listener_lost = $rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, $timeout(verificarAtaques , 60000));
				}
				if(!listener_conquered){
					listener_conquered = $rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, $timeout(verificarAtaques , 60000));
				}
				handlerVerify();
				verificarAtaques();
			}, ["all_villages_ready"])
		}
		, stop = function(){
			isRunning = !1;
			commandQueue.unbindAll("support");
			promise_verify = undefined
			queue_verifiy = [];
			$timeout.cancel(t);
			t = undefined;
			typeof(listener_verify) == "function" ? listener_verify(): null;
			typeof(listener_lost) == "function" ? listener_lost(): null;
			typeof(listener_conquered) == "function" ? listener_conquered(): null;
			listener_verify = undefined;
			listener_lost = undefined;
			listener_conquered = undefined;

			if(scope.listener_sent && typeof(scope.listener_sent) == "function") {
				scope.listener_sent();
				delete scope.listener_sent;
			}

			if(scope.listener_cancel && typeof(scope.listener_cancel) == "function") {
				scope.listener_cancel();
				delete scope.listener_cancel;
			}

//			if(scope.listener_timeout && typeof(scope.listener_timeout) == "function") {
//			scope.listener_timeout();
//			delete scope.listener_timeout;
//			}

//			if(scope.listener_returned && typeof(scope.listener_returned) == "function") {
//			scope.listener_returned();
//			delete scope.listener_returned;
//			}

			returnCommand();
		}

		angular.extend(scope, {
			listener_sent 		: {},
			listener_cancel 	: {},
//			listener_timeout 	: {},
//			listener_returned 	: {},
			params 				: {},
			commands			: {}
		})

		return	{
			init				: init,
			start				: start,
			stop 				: stop,
			calibrate_time		: calibrate_time,
			get_commands		: function (){
				return Object.keys(scope.commands).map(function(key){
					return scope.commands[key].params;
				});
			},
			removeCommandDefense: removeCommandDefense,
			removeAll			: removeAll,
			isRunning			: function () {
				return isRunning
			},
			isPaused			: function () {
				return isPaused
			},
			isInitialized		: function () {
				return isInitialized
			},
			version				: version.defense,
			name				: "defense",
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.providers,
			robotTW2.services.$timeout,
			robotTW2.services.socketService,
			robotTW2.services.modelDataService,
			robotTW2.services.overviewService,
			robotTW2.loadController,
			robotTW2.ready,
			robotTW2.commandQueue,
			robotTW2.requestFn
	)
})