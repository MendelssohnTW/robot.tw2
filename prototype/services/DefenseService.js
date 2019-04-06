define("robotTW2/CommandDefense", [
	], function(){
	return {}
})

define("robotTW2/services/DefenseService", [
	"robotTW2",
	"robotTW2/conf",
	"helper/time",
	"conf/conf",
	"conf/unitTypes",
	"robotTW2/time",
	"robotTW2/databases/data_defense",
	"robotTW2/databases/data_villages",
	"robotTW2/CommandDefense",
	"robotTW2/calibrate_time"
	], function(
			robotTW2,
			conf,
			helper,
			conf_conf,
			unitTypes,
			time,
			data_defense,
			data_villages,
			commandDefense,
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
		, timeout = undefined
		, oldCommand
		, d = {}
		, resend = false
		, interval_reload = undefined
		, listener_verify = undefined
		, listener_lost = undefined
		, listener_sent = undefined
		, listener_cancel = undefined
		, listener_received = undefined
		, listener_conquered = undefined
		, promise_verify = undefined
		, villages = modelDataService.getSelectedCharacter().getVillageList()
		, that = this
		, promise = undefined
		, loadVillage = function(cmd){
			this.cmd = cmd;
			return new Promise(function(res, rej){
				loadIsRunning = !1
				let g = 20
				, x = this.cmd.targetX || this.cmd.target_x
				, y = this.cmd.targetY || this.cmd.target_y
				, id = this.cmd.id || this.cmd.command_id
				, lista_aldeiasY = []
				, lista_aldeias = []
				, lista_barbaras = []
				angular.extend(lista_aldeiasY, villages);
				villages.sort(function (a, b) {
					if (Math.abs(a.getX() - x) != Math.abs(b.getX() - x)) {
						if (Math.abs(a.getX() - x) < Math.abs(b.getX() - x)) {
							return -1;
						};
						if (Math.abs(a.getX() - x) > Math.abs(b.getX() - x)) {
							return 1;
						};
					} else if (Math.abs(a.getY() - y) != Math.abs(b.getY() - y)) {
						if (Math.abs(a.getY() - y) < Math.abs(b.getY() - y)) {
							return -1;
						};
						if (Math.abs(a.getY() - y) > Math.abs(b.getY() - y)) {
							return 1;
						};
					} else {
						return 0;
					}
				});
				
				let aldeiaX = villages[1]

				lista_aldeiasY.sort(function (a, b) {

					if (Math.abs(a.getY() - y) != Math.abs(b.getY() - y)) {
						if (Math.abs(a.getY() - y) < Math.abs(b.getY() - y)) {
							return -1;
						};
						if (Math.abs(a.getY() - y) > Math.abs(b.getY() - y)) {
							return 1;
						};
					} else if (Math.abs(a.getX() - x) != Math.abs(b.getX() - x)) {
						if (Math.abs(a.getX() - x) < Math.abs(b.getX() - x)) {
							return -1;
						};
						if (Math.abs(a.getX() - x) > Math.abs(b.getX() - x)) {
							return 1;
						};
					} else {
						return 0;
					}
				});
				
				let aldeiaY = lista_aldeiasY[1]
				, aldeia

				(aldeiaX ? Math.abs(aldeiaX.getX() - x) : 0) + 
				(aldeiaX ? Math.abs(aldeiaX.getY() - y) : 0) <= 
					(aldeiaY ? Math.abs(aldeiaY.getX() - x) : 0) + 
					(aldeiaY ? Math.abs(aldeiaY.getY() - y) : 0) ? aldeia = aldeiaX : aldeia = aldeiaY;

				aldeia ? res(aldeia) : rej()
			});
		}
		, troops_measure = function(command, callback){
			var x1 = command.startX, 
			y1 = command.startY, 
			x2 = command.targetX, 
			y2 = command.targetY,
			seconds_duration = (command.completedAt - command.startedAt) / 1000;
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

			if(data_defense.list_defense[unitType]){
				switch (unitType) {
				case "snob":
					callback(unitTypes.SNOB, unitType);
					break;
				case "trebuchet":
					callback(unitTypes.TREBUCHET, unitType);
					break;
				default : 
					callback(true, "");
				}
			} else {
				callback(false, "");
			}
		}
		, troops_analyze = function(id, lt){
			return new Promise(function(resolve){
				var list_snob = []
				, list_trebuchet = []
				, list_others = []
				, list_preserv_others = []
				, reduzirSnob = function(list){
					var g = [];
					var t = 0;
					if(list.length){
						let loyalty = modelDataService.getSelectedCharacter().getVillage(list[0].targetVillageId).getLoyalty();
						let limit = Math.trunc(Math.trunc(loyalty) / data_defense.loyalt)
						let count = 0;
						if(loyalty > data_defense.loyalt){
							list.reduce(function(prevVal, elem, index, array) {
								count++;
								var b = t == 0 ? prevVal.completedAt : t;
								if(elem.completedAt - b <= conf.TIME_SNIPER_POST + conf.TIME_SNIPER_ANT || limit <= count) {
									t = prevVal.completedAt;
									g.push(elem)
									return elem;
								} else {
									t = 0;
									return elem
								}
							})
						}
					}
					return g;
				}
				, reduzir = function(list){
					var g = [];
					list.length ? list.reduce(function(prevVal, elem, index, array) {
						if(prevVal.completedAt - elem.completedAt <= conf.TIME_SNIPER_POST + conf.TIME_SNIPER_ANT && !elem.nob) {
							g.push(elem)
							return elem;
						} else {
							return elem
						}
					})
					: null
					return g
				}
				, removerItens =  function(list, g){
					g.forEach(function(cm){
						list = list.filter(function(elem, index, array){
							return elem.id != cm.id
						})
					})
					return list;
				}
				, estab = function(list){
					list = list.sort(function (a, b) {return b.completedAt - a.completedAt})
					var g = [];
					angular.extend(g, list);
					g = reduzir(g);
					list = removerItens(list, g);
					return list
				}
				, estabSnob = function(list){
					if(!list.length){return []}
					list = list.sort(function (a, b) {return a.completedAt - b.completedAt})
					var g = [];
					angular.extend(g, list);
					g = reduzirSnob(g);
					list = removerItens(list, g);
					return list
				}
				, ct = function (cmd, opt){
					return new Promise(function(resolve_f){
						return loadVillage(cmd).then(function(aldeia){
							var timeSniperPost = data_defense.time_sniper_post;
							if(opt) {
								timeSniperPost = data_defense.time_sniper_post_snob || conf.TIME_SNIPER_POST_SNOB;
							}
							var params = {
									start_village		: cmd.targetVillageId,
									target_village		: aldeia.getId(),
									target_name			: aldeia.getName(),
									target_x			: aldeia.getX(),
									target_y			: aldeia.getY(),
									type				: "support",
									data_escolhida		: time.convertMStoUTC(cmd.completedAt),
									time_sniper_ant		: data_defense.time_sniper_ant,
									time_sniper_post	: timeSniperPost,
									preserv				: false,
									id_command 			: cmd.id
							}
							addDefense(params);
							resolve_f()
						})
					})
				}
				, fg = function fg(list, opt){
					var promise_queue = []
					return new Promise(function(res){
						function f(cm){
							if(!promise){
								promise = ct(cm, opt).then(function (){
									promise = undefined
									if(promise_queue.length){
										f(promise_queue.shift())
									} else {
										res();
									}
								})
							} else {
								promise_queue.push(cm)
							}
						}

						if(!list.length){
							res();
						} else {
							list.forEach(function(cm){
								f(cm)
							})
						}
					})
				}


				list_preserv_others = lt.filter(cmd => cmd.params.start_village == id)

				if(!modelDataService.getSelectedCharacter().getVillage(id)){
					resolve();
					return
				}
				var cmds = modelDataService.getSelectedCharacter().getVillage(id).getCommandListModel()
				, comandos_incoming = cmds.incoming;
				comandos_incoming.sort(function (a, b) {
					return b.completedAt - a.completedAt;
				})

				comandos_incoming = comandos_incoming.filter(cmd=>cmd.actionType == "attack" && cmd.isCommand && !cmd.returning)

				var limit = data_defense.limit_commands_defense || conf.LIMIT_COMMANDS_DEFENSE;
				var length_incomming = comandos_incoming.length; 

				if(!length_incomming){resolve(); return}

				if(length_incomming > limit){
					comandos_incoming.splice(0, limit);
				}

				comandos_incoming.forEach(function(cmd){
					troops_measure(cmd, function(push , unitType){
						if(push){
							switch (unitType) {
							case "snob":
								data_villages.villages[id].sniper_defense = true
								data_villages.villages[id].sniper_attack = true
								list_snob.push(cmd);
								break;
							case "trebuchet":
								data_villages.villages[id].sniper_defense = true
								data_villages.villages[id].sniper_attack = true
								list_trebuchet.push(cmd);
								break;
							default:
								list_others.push(cmd);
							}
							data_villages.set();
						}
					})
				});

				list_snob.sort(function (a, b) {return b.completedAt - a.completedAt;})
				list_trebuchet.sort(function (a, b) {return b.completedAt - a.completedAt;})
				list_others.sort(function (a, b) {return b.completedAt - a.completedAt;})

				list_others = removerItens(list_others, list_preserv_others);

				list_snob = estabSnob(list_snob);
				list_trebuchet = estab(list_trebuchet);
				list_others = estab(list_others);

				fg(list_others).then(function(){
					fg(list_snob, true).then(function(){
						fg(list_trebuchet, true).then(function(){
							resolve()	
						})
					})
				})
			})
		}
		, getAtaques = function(){
			return new Promise(function(resolve){

				clear();

				var lt = []

				Object.keys(commandDefense).map(function(key){
					if(commandDefense[key].params.preserv && data_villages.villages[commandDefense[key].start_village].defense_activate){
						lt.push(commandDefense[key].params)
					} else {
						delete commandDefense[key];
						removeCommandDefense(key)
					}
				})

				var villages = modelDataService.getSelectedCharacter().getVillages();

				var vls = Object.keys(villages).map(function(villageId){
					let vill_attacked = modelDataService.getGroupList().getVillageGroups(villageId).some(f=>f.id==-5)
					if(data_villages.villages[villageId].defense_activate && vill_attacked){
						return villageId
					}
				}).filter(f=>f!=undefined)

				function gt(){
					if (vls.length){
						var id = vls.shift();
						troops_analyze(id, lt).then(gt) 
					} else {
						$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)
						resolve()
					}
				}
				gt()
			})
		}
		, verificarAtaques = function (){
			var promise_verify_queue = false
			if(!isRunning){return}
			if(!promise_verify){
				promise_verify = getAtaques().then(function(){
					promise_verify = undefined;
					if(promise_verify_queue) {
						promise_verify_queue = false;
						verificarAtaques()
					}
				})
			} else {
				promise_verify_queue = true
			}
		}
		, sendCancel = function(params){
			var timer_delay = params.timer_delay + robotTW2.databases.data_main.time_correction_command,
			id = params.id_command;
			return $timeout(function () {
				removeCommandDefense(id)
				console.log("sendCancel " + id + " " + new Date(time.convertedTime()))
				socketService.emit(providers.routeProvider.COMMAND_CANCEL, {
					command_id: id
				})
			}, timer_delay);
		}
		, units_to_send = function(params){

			let units = {}
			, list_units = modelDataService.getSelectedCharacter().getVillage(params.start_village).getUnitInfo().getUnits();

			if(!list_units){
				removeCommandDefense(params.id_command)
				return
			}

			if(data_villages.villages[params.start_village].sniper_defense || params.nob){
				Object.keys(list_units).map(
						function(f){
							if(conf.UNITS_DEFENSE.includes(f) && list_units[f].available > 0){
								units[f] = list_units[f].available;
							}
						}
				)
			}
			if(data_villages.villages[params.start_village].sniper_attack || params.nob){
				Object.keys(list_units).map(
						function(f){
							if(conf.UNITS_ATTACK.includes(f) && list_units[f].available > 0){
								units[f] = list_units[f].available;
								return
							}
						}
				)
			}

			if([data_villages.villages[params.start_village].sniper_defense, data_villages.villages[params.start_village].sniper_attack].every(f=>f==false)){
				removeCommandDefense(params.id_command)
				return
			}

			params.units = units;

			if(!Object.keys(units).length){
				removeCommandDefense(params.id_command)
				return
			}

			commandQueue.bind(params.id_command, resendDefense, null, params, function(fns){
				commandDefense[params.id_command] = {
						"timeout" 	: fns.fn.apply(this, [fns.params]),
						"params"	: params
				}
			})
		}
		, sendDefense = function(params){
			return $timeout(units_to_send.bind(null, params), params.timer_delay);
		}
		, listener_command_cancel = function($event, data){
			if(!$event.currentScope){
				return
			}
			if(data.direction == "backward" && data.type == "support"){
				var cmds = Object.keys(commandDefense).map(function(param){
					if(commandDefense[param].params.start_village == data.home.id
							&& commandDefense[param].params.target_village == data.target.id
							&& commandDefense[param].params.id_command == data.command_id
					) {
						return commandDefense[param].params	
					} else {
						return undefined
					}
				}).filter(f => f != undefined)
				var cmd = undefined;
				if(cmds.length){
					cmd = cmds.pop();
				}
			}
		}
		, listener_command_sent = function($event, data){
			if(!$event.currentScope){
				return
			}
			if(data.direction == "forward" && data.type == "support"){
				var cmds = Object.keys(commandDefense).map(function(param){
					//verificar a origem e alvo do comando
					if(commandDefense[param].params.start_village == data.home.id 
							&& commandDefense[param].params.target_village == data.target.id
					) {
						return commandDefense[param].params
					} else {
						return undefined
					}
				}).filter(f => f != undefined)

				if(cmds.length){
					cmds.sort(function(a,b){return b.data_escolhida - a.data_escolhida})
					var cmd = cmds.pop()
					, expires = (cmd.data_escolhida - time.convertMStoUTC(data.time_start * 1000) + cmd.time_sniper_post) / 2
					, params = {
						"timer_delay" 	: expires,
						"id_command" 	: data.id
					}
					if(expires >= 0){
						$rootScope.$broadcast("command_sent_received", params)
						console.log("Enviado sendCancel " + JSON.stringify(params))
						commandQueue.bind(data.id, sendCancel, null, params, function(fns){
							commandDefense[params.id_command] = {
									"timeout" 	: fns.fn.apply(this, [fns.params]),
									"params"	: params
							}

						})
					} else {
						console.log("send cancel timer_delay < 0 " + JSON.stringify(params))
					}

					$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)

				} else {
					console.log("não encontrou o comando para sendCancel")
				}
			}
		}
		, send = function(params){
			resend = false;
			var r = {};

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
			var expires_send = params.data_escolhida - params.time_sniper_ant
			, timer_delay_send = expires_send - time.convertedTime() + robotTW2.databases.data_main.time_correction_command

			if(timer_delay_send <= 0){
				removeCommandDefense(params.id_command)
				return 
			}
			resend = true;
			return $timeout(send.bind(null, params), timer_delay_send);
		}
		, addDefense = function(params){

			if(!params){return}
			!(typeof(listener_sent) == "function") ? listener_sent = $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, listener_command_sent) : null;
			!(typeof(listener_cancel) == "function") ? listener_cancel = $rootScope.$on(providers.eventTypeProvider.COMMAND_CANCELLED, listener_command_cancel) : null;

			var id_command = (Math.round(time.convertedTime() + params.data_escolhida).toString());
			if(params.id_command){
				id_command = params.id_command
			}

			var expires = params.data_escolhida - params.time_sniper_ant
			, timer_delay = expires - time.convertedTime()

			if(timer_delay >= 0){
				angular.extend(params, {
					"timer_delay" : timer_delay - conf.TIME_DELAY_UPDATE,
					"id_command": id_command
				})

				commandQueue.bind(params.id_command, sendDefense, null, params, function(fns){
					commandDefense[params.id_command] = {
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
				($(".sniper_ant")[i]).value = isSelected != undefined && isSelected.params != undefined ? isSelected.params.time_sniper_ant / 1000 : data_defense.time_sniper_ant / 1000;
			}
			if (($(".sniper_post")[i]) != undefined){
				($(".sniper_post")[i]).value = isSelected != undefined && isSelected.params != undefined ? isSelected.params.time_sniper_post / 1000 : data_defense.time_sniper_post / 1000;
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

					r = loadVillage(command).then(function(aldeia){
						$timeout.cancel(list_timeout[i]);	
						var params = {
								start_village		: command.target_village_id,
								target_village		: aldeia.id,
								target_name			: aldeia.name,
								target_x			: aldeia.x,
								target_y			: aldeia.y,
								type				: "support",
								data_escolhida		: time.convertMStoUTC(command.model.completedAt),
								time_sniper_ant		: sniper_ant * 1000,
								time_sniper_post	: sniper_post * 1000,
								preserv				: true,
								id_command			: command.command_id
						}
						addDefense(params);
					}, function(){
						console.log("parametros das aldeias não encontrado")
					})

				} else {
					$(this).removeClass("icon-26x26-dot-green").addClass("icon-26x26-dot-red");
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
					if(!OverviewController){
						OverviewController = robotTW2.loadController("OverviewController")
					} else if(iCount < 1){
						OverviewController = robotTW2.loadController("OverviewController")
					}
					if (OverviewController && OverviewController.activeTab == OverviewController.TABS.INCOMING){
						addDefenseSelector(command, iCount);
						iCount++
						if ($('span.type').length <= iCount) 
							iCount = 0;
					}
				}, 100)
			};
		}
		, removeCommandDefense = function(id_command){
			if(commandDefense[id_command] && typeof(commandDefense[id_command].timeout) == "object"){
				if(commandDefense[id_command].timeout.$$state.status == 0){
					$timeout.cancel(commandDefense[id_command].timeout)	
				}
				delete commandDefense[id_command];
			}

			commandQueue.unbind(id_command)
		}
		, removeAll = function(){
			commandQueue.unbindAll("support")
			commandDefense = {};
			$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)
		}
		, init = function(){
			isInitialized = !0
			start();
		}
		, handlerVerify = function(){
			verificarAtaques();
			if(!listener_verify){
				listener_verify = $rootScope.$on(providers.eventTypeProvider.COMMAND_INCOMING, _ => {
					if(!isRunning){return}
					promise_verify = undefined;

//					promise.$$state.status === 0 // pending
//					promise.$$state.status === 1 // resolved
//					promise.$$state.status === 2 // rejected

					if(!timeout || !timeout.$$state || timeout.$$state.status != 0){
						timeout = $timeout(verificarAtaques, 5 * 60 * 1000);
					}
				});
			}
		}
		, start = function(opt){
			if(isRunning){return}
			if(opt && isRunning && resend){
				$timeout(function(){start(true)}, 10000)
				return;
			}
			ready(function(){
				commandDefense = {};
				isRunning = !0;
				reformatCommand();
				if(robotTW2.databases.data_main.auto_calibrate){
					calibrate_time()
				}
				if(!listener_lost){
					listener_lost = $rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, $timeout(verificarAtaques , 60000));
				}
				if(!listener_conquered){
					listener_conquered = $rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, $timeout(verificarAtaques , 60000));
				}
				handlerVerify();
			}, ["all_villages_ready"])
		}
		, clear = function(){
			Object.keys(commandDefense).map(function(cmd){
				if(commandDefense[cmd].timeout){
					if(commandDefense[cmd].timeout.$$state || commandDefense[cmd].timeout.$$state.status == 0){
						$timeout.cancel(commandDefense[cmd].timeout);
					}
				}
			})
			commandDefense = {};
			promise_verify = undefined
			$timeout.cancel(timeout);
			timeout = undefined;
		}
		, stop = function(){
			if(!resend){
				isRunning = !1;
				commandQueue.unbindAll("support");
				clear();
				typeof(listener_verify) == "function" ? listener_verify(): null;
				typeof(listener_lost) == "function" ? listener_lost(): null;
				typeof(listener_conquered) == "function" ? listener_conquered(): null;
				typeof(listener_received) == "function" ? listener_received(): null;
				listener_verify = undefined;
				listener_lost = undefined;
				listener_conquered = undefined;
				listener_received = undefined;

				if(listener_sent && typeof(listener_sent) == "function") {
					listener_sent();
					delete listener_sent;
				}

				if(listener_cancel && typeof(listener_cancel) == "function") {
					listener_cancel();
					delete listener_cancel;
				}

				returnCommand();
			} else {
				$timeout(stop, 30000)
			}
		}

		return	{
			init				: init,
			start				: start,
			stop 				: stop,
			get_commands		: function (){
				return Object.keys(commandDefense).map(function(key){
					return commandDefense[key].params;
				});
			},
			getAllcommands		: function (){
				return commandDefense;
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
			version				: conf.VERSION.DEFENSE,
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
