define("robotTW2/services/DefenseService", [
	"robotTW2",
	"robotTW2/conf",
	"robotTW2/convert_readable_for_ms",
	"robotTW2/readableSeconds",
	], function(
			robotTW2,
			conf,
			convert_readable_for_ms,
			readableSeconds
	){
	return (function DefenseService(
			$rootScope,
			providers,
			$timeout,
			commandQueue,
			socketService,
			ready
	) {

		var isRunning = !1
		, isPaused = !1
		, isInitialized = !1
		, interval_reload = undefined
		, timeoutIdDefense = {}
		, data_defense = robotTW2.databases.data_defense
		, data_main = robotTW2.databases.data_main
		, interval = data_defense.interval
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
		, distSupportSniper = function (dx, dy) {
			return Math.sqrt(Math.pow(dx, 2) + (Math.pow(dy, 2) * 0.75));
		}
		, troops_measure = function(command, callback){
			var troops = database.get("troops_support");
			var x1 = command.startX, 
			y1 = command.startY, 
			x2 = command.targetX, 
			y2 = command.targetY,
			seconds_duration = convert_readable_for_ms(readableSeconds(command.completedAt / 1000, false)) - convert_readable_for_ms(readableSeconds(command.startedAt / 1000, false));
			if (y1 % 2)
				x1 += .5;
			if (y2 % 2)
				x2 += .5;
			var dy = y1 - y2,
			dx = x1 - x2;
			var distancia = Math.abs(distSupportSniper(dx, dy));
			var timetable = [
				[540, "heavy_cavalry"],
				[840, "axe"],
				[1080, "sword"],
				[1440, "ram"],
				[2100, "snob"],
				[480, "light_cavalry"],
				[3000, "trebuchet"]
				];
			var array_unitType = timetable.map(m => {
				return [m[0], m[1], Math.abs((seconds_duration / 1000) - Math.round(m[0] * distancia))];
			});
			var unitType = array_unitType.sort((a, b) => {
				return a[2] - b[2];
			})[0][1];
			switch (unitType) {
			case "light_cavalry":
				callback(troops.light_cavalry, unitType);
				break;
			case "heavy_cavalry":
				callback(troops.heavy_cavalry, unitType);
				break;
			case "axe":
				callback(troops.axe, unitType);
				break;
			case "sword":
				callback(troops.sword, unitType);
				break;
			case "ram":
				callback(troops.ram, unitType);
				break;
			case "snob":
				callback(troops.snob, unitType);
				break;
			case "trebuchet":
				callback(troops.trebuchet, unitType);
				break;
			default : 
				callback(true, "");
			}
		}
		, troops_analyze = function(list_snob, list_trebuchet, list_others, comandos, callback){
			var dados = database.get("dados_support")
			, sortearSnob = function(list){
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
							var timeSniperPost = 3000;
							if(!cmt.nob) {
								timeSniperPost = dados.TIME_SNIPER_POST;	
							} else {
								timeSniperPost = conf.TIME_SNIPER_POST_SNOB;
							}
							var params = {
									start_village		: cmt.targetVillageId,
									target_village		: aldeia.id,
									target_name			: aldeia.name,
									target_x			: aldeia.x,
									target_y			: aldeia.y,
									type				: "support",
									data_escolhida		: convert_readable_for_ms(readableSeconds(cmt.completedAt / 1000, false)),
									TIME_SNIPER_ANT		: dados.TIME_SNIPER_ANT,
									TIME_SNIPER_POST	: timeSniperPost,
									no_target			: false
							}
							addSupport(params, cmt.id);
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
			var comandos = database.get("comandos_support");
			var vls = getVillages(); 

			function gt(){
				if (vls.length){
					var id = vls.shift()
					var list_snob = [];
					var list_trebuchet = [];
					var list_calvary = [];
					var list_infatary = [];
					var list_ram = [];
					var list_others = [];

					var cmds = getVillage(id).getCommandListModel();
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
					list_snob.length || list_trebuchet.length || list_others.length ? troops_analyze(list_snob, list_trebuchet, list_others, comandos, gt) : gt();
				} else {
					upDateTbodySupport();
					$rootScope.$broadcast(providers.eventTypeProvider.DEPOSIT_READY)
					$rootScope.$broadcast(providers.eventTypeProvider.RECON_READY)
					$rootScope.$broadcast(providers.eventTypeProvider.HEADQUARTER_READY)
				}
			}
			gt()

		}
		, sendCancel = function(timer_delay, id){
			return $timeout(function () {
				socketService.emit(routeProvider.COMMAND_CANCEL, {
					command_id: id
				}, function(data){
					if (data.error_code == "ENTITY_NOT_FOUND" 
						&& data.message == "command not found (#" + id + ")"){
						addLog("Comando não encontrado.", "support");
						console.log("Comando não encontrado.");
					} else if(data.error_code == "ENTITY_NOT_FOUND"
						&& data.message == "Não é mais possível cancelar esse comando.") {
						addLog("Não é mais possível cancelar esse comando.", "support");
						console.log("Não é mais possível cancelar esse comando.");
					}
					return;
				})
			}, timer_delay);
		}
		, sendDefense = function(timer_delay, params, id_command){
			var a = {}
			, b = {}
			, c = {}
			, d = {}
			, command_returned = function($event, data){
				addLog("Aldeia " 
						+ getVillage(data.origin.id).data.name + 
						" comando sniper retornado em " 
						+ new Date(gameTime())
						, "support");
				console.log("Aldeia "
						+ getVillage(data.origin.id).data.name + 
						" comando sniper retornado em " 
						+ new Date(gameTime()) 
				);
				data && typeof(d[data.command_id]) == "function" ? d[data.command_id]() : null;
			}
			, command_cancelled = function($event, data){
				addLog("Aldeia " 
						+ getVillage(data.origin.id).data.name + 
						" comando sniper cancelado em " 
						+ new Date(gameTime())
						, "support");
				console.log("Aldeia " 
						+ getVillage(data.origin.id).data.name + 
						" comando sniper cancelado em " 
						+ new Date(gameTime())
				);
				data && typeof(b[data.command_id]) == "function" ? b[data.command_id]() : null;
				if(c[data.command_id]) {
					$timeout.cancel(c[data.command_id]);
					delete c[data.command_id];
				}
				delete timeoutIdCancel[data.command_id];
				d[data.command_id] = $rootScope.$on(providers.eventTypeProvider.COMMAND_RETURNED, command_returned);
			}
			, command_sent = function($event, data){
				if(params.start_village == data.origin.id){
					b[data.command_id] = $rootScope.$on(providers.eventTypeProvider.COMMAND_CANCELLED, command_cancelled);
					var dados = database.get("dados_support")
					if(a[id_command] && typeof(a[id_command].listener) == "function") {
//						dados.TIME_CORRECTION_COMMAND += (data.time_start * 1000 - a[id_command].time);
//						dados.TIME_CORRECTION_COMMAND > 3000 ? dados.TIME_CORRECTION_COMMAND = 775 : dados.TIME_CORRECTION_COMMAND;
//						dados.TIME_CORRECTION_COMMAND < -3000 ? dados.TIME_CORRECTION_COMMAND = 0 : dados.TIME_CORRECTION_COMMAND;
						database.set("dados_support", dados, true);
						a[id_command].listener();
						delete a[id_command];
					}
					addLog("Comando de defesa da aldeia "
							+ data.home.name + 
							" enviado as "
							+ new Date(gameTime()) + 
							" solicitado para sair as " 
							+ new Date(data.time_start * 1000) + 
							" solicitado para chegar as " 
							+ new Date(data.time_completed * 1000) +
							" com as seguintes unidades " 
							+ JSON.stringify(data.units)
							, "support");
					console.log("Comando de defesa da aldeia "
							+ data.home.name + 
							" enviado as "
							+ new Date(gameTime()) + 
							" solicitado para sair as " 
							+ new Date(data.time_start * 1000) + 
							" solicitado para chegar as " 
							+ new Date(data.time_completed * 1000) +
							" com as seguintes unidades " 
							+ JSON.stringify(data.units)
					);
					if (timeoutIdSupport[id_command]){
						$timeout.cancel(timeoutIdSupport[id_command]);
						delete timeoutIdSupport[id_command]	
					}
					removeDefense(id_command, "comandos_support", timeoutIdSupport, upDateTbodySupport)
					//var expires = params.data_escolhida + params.TIME_SNIPER_POST - conf.TIME_RATE_CANCEL;
					var expires = params.data_escolhida + params.TIME_SNIPER_POST;
					var timer_delay = ((expires - gameTime()) / 2) - dados.TIME_CORRECTION_COMMAND;
					if(timer_delay > 0){
						addLog("Comando sniper da aldeia aguardando", "support")
						console.log("Comando sniper da aldeia aguardando")
						timeoutIdCancel[data.origin.id] = sendCancel(timer_delay, data.command_id);
						c[data.command_id] = function(){
							return $timeout(function () {
								addLog("Timeout de cancelamento superado, comando sniper da aldeia não enviado", "support")
								console.log("Timeout de cancelamento superado, comando sniper da aldeia não enviado")
								b[data.command_id]()
							}, timer_delay + 5000);
						}
					} else {
						console.log(timer_delay)
						addLog("Comando sniper da (sendDefense) aldeia " 
								+ modelDataService.getVillage(params.start_village).data.name + 
								" não enviado as " 
								+ new Date(gameTime()) + 
								" com tempo do servidor, devido vencimento de limite de delay"
								, "support")
								console.log("Comando sniper da (sendDefense) aldeia " 
										+ modelDataService.getVillage(params.start_village).data.name + 
										" não enviado as "
										+ new Date(gameTime()) + 
										" com tempo do servidor, devido vencimento de limite de delay"
								);
					}
				}
			}

			return $timeout(function () {
				var lista = [],
				units = {};
				var village = getVillage(params.start_village);
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
				var par = angular.copy(params);
				var dados = database.get("dados_support")
				var expires_send = params.data_escolhida - params.TIME_SNIPER_ANT;
				var timer_delay_send = expires_send - gameTime() - dados.TIME_CORRECTION_COMMAND;
				if(timer_delay_send > - 2000){
					timer_delay_send < 0 ? timer_delay_send = 0 : timer_delay_send;
					$timeout(function () {
						a[id_command] = {
								time 		: params.data_escolhida - params.TIME_SNIPER_ANT,
								listener 	: $rootScope.$on(providers.eventTypeProvider.COMMAND_SENT, command_sent)
						} 
						socketService.emit(
								routeProvider.SEND_CUSTOM_ARMY, {
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
					addLog("Comando de defesa da aldeia " + modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(gameTime()) + " com tempo do servidor, devido vencimento de limite de delay", "support")
					console.log("Comando de defesa da aldeia " + modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(gameTime()) + " com tempo do servidor, devido vencimento de limite de delay");
				}

			}, timer_delay - conf.TIME_DELAY_UPDATE);
		}
		, addDefense = function(params, id_command){
			if(params && id_command){
				var t = {
						id_command: id_command
				}
				angular.merge(params, t);
				var cmd = {
						id_command: id_command,
						params: params
				}
				var comandos = data_defense.get().commands;
				var expires = params.data_escolhida - params.time_sniper_ant;
				var timer_delay = expires - gameTime() - data_main.get().time_correction_command;

				if(timeoutIdSupport[id_command]) {
					$timeout.cancel(timeoutIdSupport[id_command]);
					delete $timeout.cancel(timeoutIdSupport[id_command]);
				}
				if(timer_delay > -2000){
					timer_delay < 0 ? timer_delay = 0 : timer_delay;
					timeoutIdSupport[id_command] = sendDefense(timer_delay, params, id_command, params.enviarFull);
					!comandos.find(f => f.id_command == cmd.id_command) ? comandos.push(cmd) : null;
				} else {
					comandos = comandos.filter(f => f.id_command != cmd.id_command);
//					addLog("Comando de defesa (addsupport) da aldeia " + modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(gameTime()) + " com tempo do servidor, devido vencimento de limite de delay", "support")
					console.log("Comando de defesa  (addsupport) da aldeia " + modelDataService.getVillage(params.start_village).data.name + " não enviado as " + new Date(gameTime()) + " com tempo do servidor, devido vencimento de limite de delay");
				}
				database.set("comandos_support", comandos, true);				
			}
		}
		, removeDefense = function(id_command, db, timeoutId, opt_callback){
			var comandos = database.get(db);
			var comando = null;
			comandos = comandos.filter(f => f.id_command != id_command);
			if (timeoutId[id_command]){
				$timeout.cancel(timeoutId[id_command]);
				delete timeoutId[id_command]	
			}
			if(comandos){
				database.set(db, comandos, true)
				typeof(opt_callback) == "function" ? opt_callback() : null;
			}
		}
		, addDefenseSelector = function(command, i){
			var comandos = data_defense.get().commands;
			var dados = database.get("dados_support");
			var opts = ["icon-26x26-dot-red", "icon-26x26-dot-green"];
			var isSelected = comandos.find(f => f.id_command == command.command_id);
			var isMark = false;
			if (isSelected != undefined){
				isMark = true;
			} else {
				isMark = false;
			}
			$($(".content.incoming td.column-time_completed")[i]).prepend('<div style="float: right;"><input id="sniper_ant" class="sniper_ant" type="number" style="width: 40px; color: white;" step="1" min="5" max"600"><input id="sniper_post" class="sniper_post" type="number" style="width: 40px; color: white;"  step="1" min="1" max"600"></div><div class="' + opts[(isMark) ? 1 : 0] + ' indicatorSelected"></div>');
			if (($(".sniper_ant")[i]) != undefined){
				($(".sniper_ant")[i]).value = isSelected != undefined && isSelected.params != undefined ? isSelected.params.time_sniper_ant / 1000 : dados.time_sniper_ant / 1000;
			}
			if (($(".sniper_post")[i]) != undefined){
				($(".sniper_post")[i]).value = isSelected != undefined && isSelected.params != undefined ? isSelected.params.time_sniper_post / 1000 : dados.time_sniper_post / 1000;
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
									data_escolhida		: convert_readable_for_ms(readableSeconds(cmt.time_completed, false)),
									time_sniper_ant		: sniper_ant * 1000,
									time_sniper_post	: sniper_post * 1000,
									no_target			: true
							}
							addDefense(params, cmt.command_id);
						}
					})
				} else {
					$(this).removeClass("icon-26x26-dot-green").addClass("icon-26x26-dot-red");
					removeDefense(command.command_id, "comandos_support", timeoutIdDefense, upDateTbodyDefense)
				}
			});
		}
		, returnCommand = function(){
			robotTW2.services.overviewService.formatCommand = oldCommand;
		}
		, reformatCommand = function() {
			var OverviewController;
			oldCommand = robotTW2.services.overviewService.formatCommand;
			robotTW2.services.overviewService.supportFormatCommand = robotTW2.services.overviewService.formatCommand;
			var iCount = 0;
			var t = 0;

			robotTW2.services.overviewService.formatCommand = function (command) {
				robotTW2.services.overviewService.supportFormatCommand(command);
				OverviewController = robotTW2.loadController("OverviewController");
				if (OverviewController && OverviewController.activeTab == OverviewController.TABS.INCOMING){
					var f = $timeout(function(){
						t++;
						addDefenseSelector(command, iCount);
						iCount++;
						if ($('span.type').length <= iCount) {
							iCount = 0; 
							t = 0;
							$timeout.cancel(f);
							f = undefined;
						}
					}, 100 * t)
				}
			};
		}
		, init = function(){
			isInitialized = !0
			start();
		}
		, start = function(){
			if(isRunning){return}
			ready(function(){
				reformatCommand();
//				w.reload();
				listener_lost = $rootScope.$on(providers.eventTypeProvider.VILLAGE_LOST, updateVillages);
				listener_conquered = $rootScope.$on(providers.eventTypeProvider.VILLAGE_CONQUERED, updateVillages);
//				listener_window_support = $rootScope.$on(providers.eventTypeProvider.OPEN_SUPPORT, addWindowDefense);
				isRunning = !0;
//				database.get("comandos_support") ? database.get("comandos_support").forEach(function(e){
//					if(e.params.data_escolhida < gameTime() || e.params.no_target == false){
//						removeDefense(e.id_command, "comandos_support", timeoutIdDefense, upDateTbodyDefense)
//					} else {
//						addDefense(e.params, e.id_command);
//					}
//				}) : database.set("comandos_support", undefined, true);
				handlerVerify();
				verificarAtaques();
			}, ["all_villages_ready"])
		}
		, stop = function(){
			typeof(listener_lost) == "function" ? listener_lost(): null;
			typeof(listener_conquered) == "function" ? listener_conquered(): null;
//			typeof(listener_window_support) == "function" ? listener_window_support(): null;
			listener_layout = undefined;
			listener_conquered = undefined;
//			listener_window_support= undefined;
			isRunning = !1;
			returnCommand();
		}
		
		return	{
			init			: init,
			start			: start,
			stop 			: stop,
			isRunning		: function () {
				return isRunning
			},
			isPaused		: function () {
				return isPaused
			},
			isInitialized	: function () {
				return isInitialized
			},
			version			: "1.0.0",
			name			: "defense",
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.providers,
			robotTW2.services.$timeout,
			robotTW2.commandQueue,
			robotTW2.socketEmit,
			robotTW2.ready
	)
})