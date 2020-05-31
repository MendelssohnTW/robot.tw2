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
	"robotTW2/databases/data_log",
	"robotTW2/CommandDefense",
	"robotTW2/calibrate_time",
	"helper/format"
	], function(
			robotTW2,
			conf,
			helper,
			conf_conf,
			unitTypes,
			time,
			data_defense,
			data_villages,
			data_log,
			commandDefense,
			calibrate_time,
			formatHelper
	){
	return (function DefenseService(
			$rootScope,
			$filter,
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
		, promise_command_cancel = undefined
		, queue_command_cancel = []
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
						if(loyalty < data_defense.loyalt){
							return list
						}
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
//									data_escolhida		: time.convertMStoUTC(cmd.time_completed * 1000),
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
					comandos_incoming = comandos_incoming.splice(0, limit);
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
			return new Promise(function(resolve, reject){

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
					let vill_attacked = modelDataService.getGroupList().getVillageGroups(villageId).some(f=>f.id==-5||f.id==-8)
					if(data_villages.villages[villageId].defense_activate && vill_attacked){
						return villageId
					}
				}).filter(f=>f!=undefined)

				function gt(){
					if (vls.length){
						var id = vls.shift();
						troops_analyze(id, lt).then(gt) 
					} else {
						resolve()
					}
				}
				gt()
			})
		}
		, verificarAtaques = function (){
			var promise_verify_queue = false
			timeout = undefined
			if(!isRunning){return}
			if(!promise_verify){
				promise_verify = getAtaques().then(function(){
					promise_verify = undefined;
					data_villages.set();
					$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)
					if(promise_verify_queue) {
						promise_verify_queue = false;
						verificarAtaques()
					}
				}, function(){
					promise_verify = undefined;
					data_villages.set();
					$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)
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
			return $timeout(function () {
				data_log.defense.push(
						{
							"text": "Sniper send cancel " + params.id_command,
							"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
							"target": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.target_village).data),
							"date": time.convertedTime()
						}
				)
				socketService.emit(providers.routeProvider.COMMAND_CANCEL, {
					command_id: params.id_command
				})
				removeCommandDefense(params.id_command)
			}, params.timer_delay - modelDataService.getSelectedCharacter().getTimeSync().csDiff);
		}
		, sendDefense = function(params){
			return $timeout(function(){
				if([data_villages.villages[params.start_village].sniper_defense, data_villages.villages[params.start_village].sniper_attack].every(f=>f==false)){
					removeCommandDefense(params.id_command)
					return
				}

				commandQueue.bind(params.id_command, resendDefense, null, params, function(fns){
					commandDefense[params.id_command] = {
							"timeout" 	: fns.fn.apply(this, [fns.params]),
							"params"	: params
					}
				})
				
			}, params.timer_delay - modelDataService.getSelectedCharacter().getTimeSync().csDiff);
		}
		, resendDefense = function(params){
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

			if(!Object.keys(units).length){
				removeCommandDefense(params.id_command)
				data_log.defense.push(
						{
							"text": "Sniper not sent - not units - resendDefense" + params.id_command,
							"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
							"target": formatHelper.villageNameWithCoordinates(
									{
										"name": params.target_name,
										"x": params.target_x,
										"y": params.target_y
									}
							),
							"date": time.convertedTime()
						}
				)
				return
			}

			params.units = units;

			var expires_send = params.data_escolhida - params.time_sniper_ant
			, timer_delay_send = expires_send - time.convertedTime()

			if(timer_delay_send <= -25000){
				data_log.defense.push(
						{
							"text": "Sniper not sent - expires - resendDefense" + params.id_command,
							"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
							"target": formatHelper.villageNameWithCoordinates(
									{
										"name": params.target_name,
										"x": params.target_x,
										"y": params.target_y
									}
							),
							"date": time.convertedTime()
						}
				)
				removeCommandDefense(params.id_command)
				return 
			} else if(timer_delay_send > -25000 && timer_delay_send < 0){
				timer_delay_send = 0;
			}
			resend = true;
			$rootScope.$broadcast(providers.eventTypeProvider.PAUSE)
			return $timeout(function(){
				resend = false;
				data_log.defense.push(
						{
							"text": $filter("i18n")("defense", $rootScope.loc.ale, "defense") + " - " + params.id_command,
							"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
							"target": formatHelper.villageNameWithCoordinates(
									{
										"name": params.target_name,
										"x": params.target_x,
										"y": params.target_y
									}
							),
							"date": time.convertedTime()
						}
				)

				var count_push = 0;

				function send_cmd_cancel(params){
					if(!promise_command_cancel){
						promise_command_cancel = new Promise(function(resol, rejec){
//							$timeout(function(){
								if(Object.values(commandDefense).find(f=>f.id_command==params.id_command))
									trigger_cancel(params, function(){
										resol()
									});
//							}, 5000)
						}).then(function(){
							promise_command_cancel = undefined
							if(queue_command_cancel.length){
								send_cmd_cancel(queue_command_cancel.shift())
							}
						}, function(control_params){
							if(!queue_command_cancel.length){
								count_push++;
							}
							promise_command_cancel = undefined
							queue_command_cancel.push(control_params)
							if(count_push < 5){
								send_cmd_cancel(queue_command_cancel.shift())
							} else {
								count_push = 0;
								queue_command_cancel = [];
							}
						})
					} else {
						queue_command_cancel.push(params)
					}
				}

				send_cmd_cancel(params)

				socketService.emit(providers.routeProvider.SEND_CUSTOM_ARMY, {
					start_village		: params.start_village,
					target_village		: params.target_village,
					type				: params.type,
					units				: params.units,
					icon				: 0,
					officers			: params.officers,
					catapult_target		: params.catapult_target
				});
			}, timer_delay_send - modelDataService.getSelectedCharacter().getTimeSync().csDiff);
		}
		, trigger_cancel = function(_params, callback){
			var comandos_outgoing = modelDataService.getSelectedCharacter().getVillage(_params.start_village).getCommandListModel().outgoing
			, cmds = Object.keys(comandos_outgoing).map(function(param){
				if(comandos_outgoing[param].targetCharacterId = modelDataService.getSelectedCharacter().getId() && 
						comandos_outgoing[param].type == "support" && 
						comandos_outgoing[param].data.direction == "forward" &&
						comandos_outgoing[param].targetVillageId == _params.target_village
				) {
					return comandos_outgoing[param]
				} else {
					return undefined
				}
			}).filter(f => f != undefined)

			var init_time = _params.data_escolhida - _params.time_sniper_ant
			, end_time = _params.data_escolhida + _params.time_sniper_post
			, tot_time = _params.time_sniper_post + _params.time_sniper_ant
			, mid_time = tot_time / 2
			, return_time = init_time + mid_time 
			, expires = return_time - time.convertedTime()

			if(cmds.length){
				cmds.sort(function (a, b) {return a.startedAt - b.startedAt})
				for (_cmd in cmds){
					if(cmds.hasOwnProperty(_cmd)){
						let cmd = cmds[_cmd]
						, params = {
								"timer_delay" 		: expires,
								"id_command" 		: cmd.id,
								"start_village" 	: _params.start_village,
								"target_village" 	: _params.target_village
						}

						if(expires >= -15000 && expires < 0){
							params.timer_delay = 0;
						} else if(expires < -15000){
							data_log.defense.push(
									{
										"text": "Sniper not sent - expires - " + cmd.id_command,
										"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(cmd.start_village).data),
										"target": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(cmd.target_village).data),
										"date": time.convertedTime()
									}
							)
							removeCommandDefense(_params.id_command)
							continue
						}

						if(!commandDefense[params.id_command]){
							removeCommandDefense(_params.id_command)
							commandQueue.bind(cmd.id, sendCancel, null, params, function(fns){
								commandDefense[params.id_command] = {
										"timeout" 	: fns.fn.apply(this, [fns.params]),
										"params"	: fns.params
								}

							})
						}
					}
				}
			}
			callback()
		}
		, listener_command_sent = function($event, data){
			if(!$event.currentScope){
				return
			}

			if(data.target.character_id = modelDataService.getSelectedCharacter().getId() 
					&& data.type == "support" 
						&& data.direction == "forward"
							&& (Object.values(commandDefense).find(f=>f.params.target_village == data.target.id)
									&& Object.values(commandDefense).find(f=>f.params.start_village == data.home.id)) 
			) {
				var cmds = Object.keys(commandDefense).map(function(param){
					if(commandDefense[param].params.start_village == data.home.id 
							&& commandDefense[param].params.target_village == data.target.id
					) {
						return commandDefense[param].params
					} else {
						return undefined
					}
				}).filter(f => f != undefined)

				cmds.sort(function(a,b){return a.data_escolhida - b.data_escolhida})
				let cmd = cmds.shift()
				if(!cmd){return}

				let dif = time.convertMStoUTC(data.time_start * 1000) - (cmd.data_escolhida - cmd.time_sniper_ant)
				, expires = ((((cmd.data_escolhida + cmd.time_sniper_post) - time.convertedTime()) - dif) / 2)
				, params = {
					"timer_delay" 		: expires,
					"id_command" 		: data.id,
					"start_village" 	: cmd.start_village,
					"target_village" 	: cmd.target_village
				}

				if(expires >= -25000 && expires < 0){
					params.timer_delay = 0;
				} else if(expires < -25000){
					data_log.defense.push(
							{
								"text": "Sniper not sent - expires - " + cmd.id_command,
								"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(cmd.start_village).data),
								"target": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(cmd.target_village).data),
								"date": time.convertedTime()
							}
					)
					removeCommandDefense(cmd.id_command)
					return
				}

				if(!commandDefense[params.id_command]){
					removeCommandDefense(cmd.id_command)
					commandQueue.bind(params.id_command, sendCancel, null, params, function(fns){
						commandDefense[params.id_command] = {
								"timeout" 	: fns.fn.apply(this, [fns.params]),
								"params"	: fns.params
						}

					})
				}
			}
		}
		, addDefense = function(params){

			if(!params){return}
			!(typeof(listener_sent) == "function") ? listener_sent = $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, listener_command_sent) : null;

			var id_command = (Math.round(time.convertedTime() + params.data_escolhida).toString());
			if(params.id_command){
				id_command = params.id_command
			}

			var expires = params.data_escolhida - params.time_sniper_ant
			, timer_delay = expires - time.convertedTime()

			if(timer_delay >= -25000){
				if(timer_delay < 0){
					angular.extend(params, {
						"timer_delay" : 5000,
						"id_command": id_command
					})
				} else {
					angular.extend(params, {
						"timer_delay" : timer_delay - conf.TIME_DELAY_UPDATE,
						"id_command": id_command
					})
				}
				commandQueue.bind(params.id_command, sendDefense, null, params, function(fns){
					commandDefense[params.id_command] = {
							"timeout" 	: fns.fn.apply(this, [fns.params]),
							"params"	: params
					}
				})
				
			} else {
				data_log.defense.push(
						{
							"text": "Sniper not add - expires " + params.id_command,
							"origin": formatHelper.villageNameWithCoordinates(modelDataService.getVillage(params.start_village).data),
							"target": formatHelper.villageNameWithCoordinates(
									{
										"name": params.target_name,
										"x": params.target_x,
										"y": params.target_y
									}
							),
							"date": time.convertedTime()
						}
				)
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

			let div_pai = document.createElement("div")
			let input_ant = document.createElement("input")
			let input_post = document.createElement("input")
			let div = document.createElement("div")

			div_pai.style.float = "right";
			input_ant.setAttribute("id", "sniper_ant")
			input_ant.setAttribute("type", "number")
			input_ant.setAttribute("step", "1")
			input_ant.setAttribute("min", "5")
			input_ant.setAttribute("max", "600")
			input_ant.classList.add("sniper_ant")
			input_ant.style.width = "40px";
			input_ant.style.color = "white";
			input_post.setAttribute("id", "sniper_post")
			input_post.setAttribute("type", "number")
			input_post.setAttribute("step", "1")
			input_post.setAttribute("min", "5")
			input_post.setAttribute("max", "600")
			input_post.classList.add("sniper_post")
			input_post.style.width = "40px";
			input_post.style.color = "white";
			div.style.float = "right";
			div.classList.add(opts[(isMark) ? 1 : 0])
			div.classList.add("indicatorSelected")
			div_pai.appendChild(input_ant)
			div_pai.appendChild(input_post)
			div_pai.appendChild(div)

			let pai = document.querySelectorAll(".content.incoming td.column-time_completed")[i]

			pai.insertBefore(div_pai, pai.childNodes[0]);
			if ((document.querySelectorAll(".sniper_ant")[i]) != undefined){
				(document.querySelectorAll(".sniper_ant")[i]).value = isSelected != undefined && isSelected.params != undefined ? isSelected.params.time_sniper_ant / 1000 : data_defense.time_sniper_ant / 1000;
			}
			if ((document.querySelectorAll(".sniper_post")[i]) != undefined){
				(document.querySelectorAll(".sniper_post")[i]).value = isSelected != undefined && isSelected.params != undefined ? isSelected.params.time_sniper_post / 1000 : data_defense.time_sniper_post / 1000;
			}

			document.querySelectorAll(".indicatorSelected")[i].addEventListener('click', function (event) {
				if (document.querySelectorAll(".indicatorSelected")[i].classList.contains("icon-26x26-dot-red")) {
					this.classList.remove("icon-26x26-dot-red");
					this.classList.add("icon-26x26-dot-green");
					var sniper_ant;
					var sniper_post;
					(document.querySelectorAll(".sniper_ant")[i]).value < conf.MIN_TIME_SNIPE_ANT ? sniper_ant = conf.MIN_TIME_SNIPE_ANT : (document.querySelectorAll(".sniper_ant")[i]).value > conf.MAX_TIME_SNIPE_ANT ? sniper_ant = conf.MAX_TIME_SNIPE_ANT : sniper_ant = (document.querySelectorAll(".sniper_ant")[i]).value; 
					(document.querySelectorAll(".sniper_post")[i]).value < conf.MIN_TIME_SNIPE_POST ? sniper_post = conf.MIN_TIME_SNIPE_POST : (document.querySelectorAll(".sniper_post")[i]).value > conf.MAX_TIME_SNIPE_POST ? sniper_post = conf.MAX_TIME_SNIPE_POST : sniper_post = (document.querySelectorAll(".sniper_post")[i]).value;
					var r;
					list_timeout[i] = $timeout(function(){
						r = undefined;
						this.classList.remove("icon-26x26-dot-green");
						this.classList.add("icon-26x26-dot-red");
					}, conf.loading_timeout);

					r = loadVillage(command).then(function(aldeia){
						$timeout.cancel(list_timeout[i]);	
						var params = {
								start_village		: command.target_village_id,
								target_village		: aldeia.getId(),
								target_name			: aldeia.getName(),
								target_x			: aldeia.getX(),
								target_y			: aldeia.getY(),
								type				: "support",
								data_escolhida		: time.convertMStoUTC(command.model.completedAt),
//								data_escolhida		: time.convertMStoUTC(command.model.time_completed * 1000),
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
					this.classList.remove("icon-26x26-dot-green");
					this.classList.add("icon-26x26-dot-red");
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
						if (document.querySelectorAll('span.type').length <= iCount) 
							iCount = 0;
					}
				}, 100)
			};
		}
		, removeCommandDefense = function(id_command){
			if(commandDefense[id_command]){
				data_log.defense.push(
						{
							"text": "Command removed - " + id_command,
							"date": time.convertedTime()
						}
				)
				if(typeof(commandDefense[id_command].timeout) == "object"){
					if(commandDefense[id_command].timeout.$$state.status == 0){
						$timeout.cancel(commandDefense[id_command].timeout)	
					}
				}
				delete commandDefense[id_command];
				commandQueue.unbind(id_command)
				$rootScope.$broadcast(providers.eventTypeProvider.CHANGE_COMMANDS_DEFENSE)
			}
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
			if(!resend){
				verificarAtaques();
			}
			if(!listener_verify){
				listener_verify = $rootScope.$on(providers.eventTypeProvider.COMMAND_INCOMING, _ => {
					if(!isRunning){return}
					promise_verify = undefined;

//					promise.$$state.status === 0 // pending
//					promise.$$state.status === 1 // resolved
//					promise.$$state.status === 2 // rejected


					if(!timeout || !timeout.$$state || timeout.$$state.status != 0){
						timeout = $timeout(verificarAtaques, 180000); // 3seg
					}
				});
			}
		}
		, start = function(){
			if(isRunning){return}
			if(resend){
				$timeout(function(){start(true)}, 10000)
				return;
			}
			ready(function(){
				commandDefense = {};
				isRunning = !0;
				reformatCommand();
//				if(robotTW2.databases.data_main.auto_calibrate){
//				calibrate_time()
//				}
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
				queue_command_cancel = [];
				promise_command_cancel = undefined;
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
			get_command			: function (id){
				return Object.keys(commandDefense).map(function(key){
					if(commandDefense[key].params.start_village == id){
						return commandDefense[key].params.start_village;	
					}
				}).filter(f=>f!=undefined);
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
			robotTW2.services.$filter,
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
