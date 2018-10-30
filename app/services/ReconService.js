define("robotTW2/services/ReconService", [
	"robotTW2",
	"helper/time"
	], function(
			robotTW2,
			helper
	){
	return (function ReconService() {

		var isInitialized = !1
		, isRunning = !1
		, isPaused = !1
		, data_recon = robotTW2.databases.data_recon
		, db = data_recon.get()
		, getrenameCmdAtackRecon = function (command, unitText) {
			if(command.command_name != unitText){
				robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.COMMAND_RENAME, {
					command_id: command.command_id,
					name: unitText
				});
			}
		}
		, getAttackTypeAtackRecon = function (command, i) {
			var x1 = command.origin_x
			, y1 = command.origin_y 
			, x2 = command.target_x 
			, y2 = command.target_y 
			, seconds_duration = helper.unreadableSeconds(helper.readableMilliseconds((command.model.completedAt - command.model.startedAt), null, true))
			, minutes_duration = seconds_duration / 60
			, cmdname = command.command_name 
			, cmdType = command.command_type 
			, target_character_name = command.target_character_name
			, officer_supporter = command.officer_supporter;

			if (y1 % 2) //se y é impar
				x1 += .5;
			if (y2 % 2)
				x2 += .5;
			var dy = y1 - y2
			, dx = x1 - x2
			, distancia = Math.abs(Math.sqrt(Math.pow(dx,2) + (Math.pow(dy,2) * 0.75)));
			if (officer_supporter != 0 && officer_supporter != undefined){ //Verifica se possui oficial tático
				distancia = distancia / 2;
			}

			if (target_character_name == "Bárbaros"){
				return "Farm BB";
			} else {

				var t = robotTW2.services.modelDataService.getGameData().data.units.map(function(obj, index, array){
					return [obj.speed, obj.name]
				}).map(m => {
					return [m[0], m[1], Math.abs(minutes_duration - Math.round(m[0] * distancia))];
				}).sort((a, b) => {
					return a[2] - b[2];
				});

				var units_ret = [];

				angular.extend(units_ret, t);

				var unit = units_ret.shift();


				var y = t.map(function(obj, index, array){
					if(obj[0] == unit[0]) {
						return robotTW2.services.$filter("i18n")(obj[1], robotTW2.services.$rootScope.loc.ale, "recon");
					} else {
						return
					} 
				}).sort(function(a, b){return a < b}).filter(f=>f!=undefined).join(" / ")

				var unitText = y;

				var classe = "icon-34x34-attack-red";

				var span_unit = undefined;
				switch (true) {
				case unitText.includes(robotTW2.services.$filter("i18n")("snob", robotTW2.services.$rootScope.loc.ale, "recon")) :
					span_unit = "snob"
						break;
				case unitText.includes(robotTW2.services.$filter("i18n")("trebuchet", robotTW2.services.$rootScope.loc.ale, "recon")) :
					span_unit = "trebuchet"
						break;
				case unitText.includes(robotTW2.services.$filter("i18n")("sword", robotTW2.services.$rootScope.loc.ale, "recon")) :
					span_unit = "sword"
						break;
				case unitText.includes(robotTW2.services.$filter("i18n")("ram", robotTW2.services.$rootScope.loc.ale, "recon")) :
					span_unit = "ram"
						break;
				case unitText.includes(robotTW2.services.$filter("i18n")("light_cavalry", robotTW2.services.$rootScope.loc.ale, "recon")) :
					span_unit = "light_cavalry"
						break;
				case unitText.includes(robotTW2.services.$filter("i18n")("heavy_cavalry", robotTW2.services.$rootScope.loc.ale, "recon")) :
					span_unit = "heavy_cavalry"
						break;
				case unitText.includes(robotTW2.services.$filter("i18n")("axe", robotTW2.services.$rootScope.loc.ale, "recon")) :
					if(cmdType == "attack"){
						span_unit = "axe"
					} else {
						span_unit = "spear"
					}
				break;
				}

				switch (cmdType) {
				case "attack":
					if(span_unit != undefined){
						$($('span.type')[i]).removeClass("icon-34x34-attack").addClass("icon-34x34-unit-" + span_unit);
						$($('span.edit')[i]).removeClass("icon-34x34-edit").addClass(classe);
					}
					break;
				case "relocate":
					$($('span.type')[i]).removeClass("icon-34x34-relocate").addClass("icon-34x34-unit-" + span_unit);
					$($('span.edit')[i]).removeClass("icon-34x34-edit").addClass("icon-34x34-relocate");
					break;
				case "support":
					$($('span.type')[i]).removeClass("icon-34x34-support").addClass("icon-34x34-unit-" + span_unit);
					$($('span.edit')[i]).removeClass("icon-34x34-edit").addClass("icon-34x34-support");
					break;
				}

				return unitText;
			}
		}
		, setNewHandlersAtackRecon = function(){
			robotTW2.services.overviewService.gameFormatCommand = robotTW2.services.overviewService.formatCommand;
			var i = 0
			, t = 0
			, OverviewController = undefined

			robotTW2.services.overviewService.formatCommand = function (command) {
				robotTW2.services.overviewService.gameFormatCommand(command);

				if(isPaused){return}

				OverviewController = robotTW2.loadController("OverviewController");

				t++;
				robotTW2.services.$timeout(function(){

					if (OverviewController){
						var elem = undefined;
						$(".command-type")[i] ? elem = $($(".command-type")[i])[0].querySelector("div") : i = 0;
						if(elem){
							if(OverviewController.activeTab == OverviewController.TABS.INCOMING){
								var unitText = getAttackTypeAtackRecon(command, i);
								if (unitText != undefined){
									if(Object.keys(db.rename).map(function(elem, index, array){
										return unitText.includes(robotTW2.services.$filter("i18n")(elem, robotTW2.services.$rootScope.loc.ale, "recon"))
									}).filter(f=>f!=undefined).length){
										getrenameCmdAtackRecon(command, unitText);
									}
								}
								elem.setAttribute("style", "margin-top: 1px; display: block; overflow: hidden; text-overflow: ellipsis;	white-space: nowrap; max-width: 104px")
								i++;
								if ($('span.type').length === i) {
									i = 0;
									t = 0;
								}

							} else if(OverviewController.activeTab == OverviewController.TABS.COMMANDS){
								elem.setAttribute("style", "margin-top: 1px; display: block; overflow: hidden; text-overflow: ellipsis;	white-space: nowrap; max-width: 104px")
								i++;
								if ($('span.type').length === i) {
									i = 0;
									t = 0;
								}

							}
							elem.addEventListener("mouseenter", function(a) {
								robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.TOOLTIP_SHOW, "tooltip", elem.innerText, true, elem)
							}),
							elem.addEventListener("mouseleave", function() {
								robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.TOOLTIP_HIDE, "tooltip")
							})
						}
						if (!robotTW2.services.$rootScope.$$phase) robotTW2.services.$rootScope.$apply();
					}
				}, 100 * t)
			}
		}
		, start = function (){
			if(isRunning) {return}
			robotTW2.ready(function(){
				isRunning = !0
				robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECON"})
				setNewHandlersAtackRecon()
			}, ["all_villages_ready"])
		}
		, pause = function (){
			isPaused = !0
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECON"})
		}
		, stop = function (){
			isRunning = !1
			robotTW2.services.$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECON"})
			robotTW2.services.overviewService.formatCommand = robotTW2.services.overviewService.gameFormatCommand;
		}
		, init = function (){
			isInitialized = !0
			start();
		}
		return	{
			init			: init,
			start 			: start,
			pause 			: pause,
			stop 			: stop,
			isRunning		: function() {
				return isRunning
			},
			isInitialized	: function(){
				return isInitialized
			},
			isPaused		: function(){
				return isPaused
			},
			version			: "1.0.0",
			name			: "recon"
		}

	})()
})