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
		, listener_sent = []
		, listener_cancel = []
		, listener_timeout = []
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
			var unitType = units_ret.shift()[0][1];

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
		, troops_analyze = function(list_snob, list_trebuchet, list_others, callback){
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

			list_others = removerItens(list_others, list_snob);
			list_others = removerItens(list_others, list_trebuchet);

			list_snob = estabSnob(list_snob);
			list_trebuchet = estabSnob(list_trebuchet);

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
									no_target			: false,
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
		, verificarAtaques = function (){
			if(!isRunning){return}
			var v = function(){
				return new Promise(function(resolve){
					t = $timeout(resolve , 480000);
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
							list_snob.length || list_trebuchet.length || list_others.length ? troops_analyze(list_snob, list_trebuchet, list_others, gt) : gt();
						} else {
//							upDateTbodySupport();
							$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)
						}
					}
					gt()
				})
			}

			function f (){
				if(!promise_verify){
					promise_verify = v().then(function(){
						promise_verify = undefined;
						f()
					})
				}
			}
			f()
		}
		, sendCancel = function(params){
			var timer_delay = params.timer_delay,
			id = params.id_command;

			return $timeout(function () {
				socketService.emit(providers.routeProvider.COMMAND_CANCEL, {
					command_id: id
				}, function(data){
					//remove listeners de cancelamento e timeout
					if(typeof(listener_cancel[data.command_id]) == "function"){
						listener_cancel[id]()
						listener_cancel[id] = undefined;
						delete listener_cancel[id]
					}
					if(typeof(listener_timeout[data.command_id]) == "function"){
						$timeout.cancel(c[data.listener_timeout]);
						delete listener_timeout[id]
					}
					return;
				})
			}, timer_delay);
		}
		, clearListener = function(listener){
			if(typeof(listener == "object")){
				if(listener.$$timeoutId != undefined && listener.$$timeoutId > 0){
					$timeout.cancel(listener_timeout);
				}
			} else if(typeof(listener == "function")){
				listener()
				listener = undefined;
				delete listener
			}
		}
		, sendDefense = function(params){
			var id_command = params.id_command
			, timer_delay = params.timer_delay
			, d = {}
			, command_returned = function($event, data){
				if(!data)return
				var id_command = data.command_id;
				//remove listener de retorno
				clearListener(listener_returned[id_command])
			}
			, command_cancelled = function($event, data){
				if(!data)return
				var id_command = data.command_id;
				//remove listeners de cancelamento e timeout
				clearListener(listener_cancel[id_command])
				clearListener(listener_timeout[id_command])
				//cria listener de retorno
				listener_returned[id_command] = $rootScope.$on(providers.eventTypeProvider.COMMAND_RETURNED, command_returned);
			}
			, command_sent = function($event, data){
				if(params.start_village == data.origin.id){
					function e() {
						return $rootScope.$on(providers.eventTypeProvider.COMMAND_CANCELLED, command_cancelled);
					}
					var id_command = data.command_id;
					//cria listener para comando cancelado
					listener_cancel[id_command] = e;
					clearListener(listener_sent[id_command]);
					commandQueue.unbind(id_command)
					var expires = params.data_escolhida + params.time_sniper_post;
					var timer_delay = ((expires - time.convertedTime()) / 2) - $rootScope.data_main.time_correction_command;

					var par = {
							"timer_delay" : timer_delay,
							"id_command" : id_command
					}
					commandQueue.bind(id_command, sendCancel, par)

					if(timer_delay > 0){
						//envia o comando de cancelamento
						commandQueue.trigger(id_command, par)
						//cria listener de erro timeout
						listener_timeout[id_command] = function(){
							return $timeout(function () {
								clearListener(listener_cancel[id_command]);
								clearListener(listener_timeout[id_command]);
							}, timer_delay + 5000);
						}
					} else {
						//cancela comando se tempo de cancelamento expirou
						commandQueue.unbind(id_command)
					}
				}
			}

			return $timeout(function () {
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
				};

				if (lista.length > 0) {
					//Envia o comando
					resendDefense(params)
				} else {
					//se não tem unidades cancela o comando
					commandQueue.unbind(id_command)
				}
				$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS)

			}, timer_delay - conf.TIME_DELAY_UPDATE);

			return
		}
		, resendDefense = function(params){
			var id_command = params.id_command;
			var expires_send = params.data_escolhida - params.time_sniper_ant;
			var timer_delay_send = expires_send - time.convertedTime() - $rootScope.data_main.time_correction_command;
			if(timer_delay_send >= 0){
				function e(){
					return $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, command_sent)
				}

				return $timeout(function () {
					//cria listener para o comando se enviado
					listener_sent[id_command] = {
							listener : e, 
							time 		: params.data_escolhida - params.time_sniper_ant
					}
					socketService.emit(providers.routeProvider.SEND_CUSTOM_ARMY, {
						start_village: params.start_village,
						target_village: params.target_village,
						type: params.type,
						units: params.units,
						icon: 0,
						officers: params.officers,
						catapult_target: params.catapult_target
					});
				}, timer_delay_send);
			} else {
				//cancela comando se o tempo de envio expirou
				commandQueue.unbind(id_command)
				return null
			}
		}
		, addDefense = function(params){
//			if(params && id_command){
//			var t = {
//			id_command: id_command
//			}
//			angular.merge(params, t);
//			var cmd = {
//			id_command: id_command,
//			params: params
//			}
//			var expires = params.data_escolhida - params.time_sniper_ant;
//			var timer_delay = expires - time.convertedTime() - $rootScope.data_main.time_correction_command;

//			if(timeoutIdDefense[id_command]) {
//			$timeout.cancel(timeoutIdDefense[id_command]);
//			delete timeoutIdDefense[id_command];
//			}
//			if(timer_delay > -2000){
//			timer_delay < 0 ? timer_delay = 0 : timer_delay;
//			timeoutIdDefense[id_command] = sendDefense(timer_delay, params, id_command, params.enviarFull);
//			!commandQueue.find(f => f.id_command == cmd.id_command) ? commandQueue.push(cmd) : null;
//			} else {
//			commandQueue = commandQueue.filter(f => f.id_command != cmd.id_command);
//			console.log("Comando de defesa  (addsupport) da aldeia " + modelDataService.getSelectedCharacter().getVillage(params.start_village).data.name + " não enviado as " + new Date(time.convertedTime()) + " com tempo do servidor, devido vencimento de limite de delay");
//			}
//			}

			if(!params){return}
			var id_command = (Math.round(time.convertedTime() / 1e9)).toString() + params.data_escolhida.toString();
			if(params.id_command){
				id_command = params.id_command
			}

			var expires = params.data_escolhida - params.time_sniper_ant;
			var timer_delay = expires - time.convertedTime() - $rootScope.data_main.time_correction_command;

			angular.extend(params, {
				"timer_delay" : timer_delay,
				"id_command": id_command
			})

			//Cria o timeout para envio do comando
			commandQueue.bind(id_command, sendDefense, null, params)

			if(timer_delay >= 0){
				commandQueue.trigger(id_command, params)
			}
		}
//		, removeDefense = function(id_command, db, timeoutId, opt_callback){
//		var comando = null;
//		commandQueue = commandQueue.filter(f => f.id_command != id_command);
//		if (timeoutId[id_command]){
//		$timeout.cancel(timeoutId[id_command]);
//		delete timeoutId[id_command]	
//		}
//		if(commandQueue){
//		typeof(opt_callback) == "function" ? opt_callback() : null;
//		}
//		}
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
					loadVillage(command, function(aldeia, cmt){
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
									no_target			: true,
									id_command			: cmt.command_id
							}
							addDefense(params);
						}
					})
				} else {
					$(this).removeClass("icon-26x26-dot-green").addClass("icon-26x26-dot-red");
					commandQueue.unbind(command.id_command)
//					removeDefense(command.command_id, "comandos_support", timeoutIdDefense, upDateTbodyDefense)
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
					OverviewController = loadController("OverviewController");
					if (OverviewController && OverviewController.activeTab == OverviewController.TABS.INCOMING){
						addDefenseSelector(command, iCount);
						iCount++
						if ($('span.type').length <= iCount) 
							iCount = 0;
					}
				}, 200)
			};
		}
		, init = function(){
			isInitialized = !0
			start();
		}
		, handlerVerify = function(){
			if(!listener_verify){
				listener_verify = $rootScope.$on(providers.eventTypeProvider.COMMAND_INCOMING, _ => {
					if(!isRunning){return}
					$timeout(verificarAtaques , 60000);
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
			returnCommand();
		}

		return	{
			init				: init,
			start				: start,
			stop 				: stop,
			calibrate_time		: calibrate_time,
			removeCommandDefense: function(id_command){
				commandQueue.unbind(id_command)
			},
			removeAll			: function(id_command){
				commandQueue.unbindAll("support")
			},
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