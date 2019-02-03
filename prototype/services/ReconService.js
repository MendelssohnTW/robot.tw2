define("robotTW2/services/ReconService", [
	"robotTW2",
	"robotTW2/version",
	"helper/time"
	], function(
			robotTW2,
			version,
			helper
	){
	return (function ReconService(
			$rootScope,
			providers,
			modelDataService,
			$timeout,
			$filter,
			socketService,
			overviewService,
			ready
	) {

		var isInitialized = !1
		, isRunning = !1
		, isPaused = !1
		, getrenameCmdAtackRecon = function (command, unitText) {
			if(command.command_name != unitText){
				socketService.emit(providers.routeProvider.COMMAND_RENAME, {
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
			, seconds_duration = (command.model.completedAt - command.model.startedAt) / 1000
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

				var t = modelDataService.getGameData().data.units.map(function(obj, index, array){
					if(obj.name != "knight"){
						return [obj.speed, obj.name]
					}
				}).filter(f=>f!=undefined).map(m => {
					return [m[0], m[1], Math.abs(minutes_duration - Math.round(m[0] * distancia))];
				}).sort((a, b) => {
					return a[2] - b[2];
				});

				var units_ret = [];

				angular.extend(units_ret, t);

				var unit = units_ret.shift();

				var y = t.map(function(obj, index, array){
					if(obj[0] == unit[0]) {
						return $filter("i18n")(obj[1], $rootScope.loc.ale, "recon");
					} else {
						return
					} 
				}).sort(function(a, b){return a < b}).filter(f=>f!=undefined).join(" / ")

				var unitText = y;

				var classe = "icon-34x34-attack-red";

				var span_unit = undefined;
				switch (true) {
				case unitText.includes($filter("i18n")("snob", $rootScope.loc.ale, "recon")) :
					span_unit = "snob"
						break;
				case unitText.includes($filter("i18n")("trebuchet", $rootScope.loc.ale, "recon")) :
					span_unit = "trebuchet"
						break;
				case unitText.includes($filter("i18n")("sword", $rootScope.loc.ale, "recon")) :
					span_unit = "sword"
						break;
				case unitText.includes($filter("i18n")("ram", $rootScope.loc.ale, "recon")) :
					span_unit = "ram"
						break;
				case unitText.includes($filter("i18n")("light_cavalry", $rootScope.loc.ale, "recon")) :
					span_unit = "light_cavalry"
						break;
				case unitText.includes($filter("i18n")("heavy_cavalry", $rootScope.loc.ale, "recon")) :
					span_unit = "heavy_cavalry"
						break;
				case unitText.includes($filter("i18n")("axe", $rootScope.loc.ale, "recon")) :
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
			overviewService.gameFormatCommand = overviewService.formatCommand;
			var i = 0
			, t = 0
			, OverviewController = undefined

			overviewService.formatCommand = function (command) {
				overviewService.gameFormatCommand(command);

				if(isPaused){return}

				t++;
				$timeout(function(){
					if(!OverviewController){
						OverviewController = robotTW2.loadController("OverviewController")
					} else if(t <= 1){
						OverviewController = robotTW2.loadController("OverviewController")
					}
					var elem = undefined;
					$(".command-type")[i] ? elem = $($(".command-type")[i])[0].querySelector("div") : i = 0;
					if(elem){
						if(OverviewController.activeTab == OverviewController.TABS.INCOMING){
							var unitText = getAttackTypeAtackRecon(command, i);
							if (unitText != undefined){
								if(Object.keys($rootScope.data_recon.rename).map(function(elem, index, array){
									return unitText.includes($filter("i18n")(elem, $rootScope.loc.ale, "recon"))
								}).filter(f=>f!=undefined).length && $rootScope.data_recon.active_rename){
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
							$rootScope.$broadcast(providers.eventTypeProvider.TOOLTIP_SHOW, "tooltip", elem.innerText, true, elem)
						}),
						elem.addEventListener("mouseleave", function() {
							$rootScope.$broadcast(providers.eventTypeProvider.TOOLTIP_HIDE, "tooltip")
						})
					}
					if (!OverviewController.$$phase) !OverviewController.$apply();
				}, 100)
			}
		}
		, start = function (){
			if(isRunning) {return}
			ready(function(){
				isRunning = !0
				$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECON"})
				setNewHandlersAtackRecon()
			}, ["all_villages_ready"])
		}
		, pause = function (){
			isPaused = !0
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECON"})
		}
		, stop = function (){
			isRunning = !1
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"RECON"})
			overviewService.formatCommand = overviewService.gameFormatCommand;
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
			version			: version.recon,
			name			: "recon"
		}

	})(
			robotTW2.services.$rootScope,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.services.socketService,
			robotTW2.services.overviewService,
			robotTW2.ready
	)
})