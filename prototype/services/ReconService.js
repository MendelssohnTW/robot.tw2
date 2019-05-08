define("robotTW2/services/ReconService", [
	"robotTW2",
	"robotTW2/conf",
	"helper/time",
	"robotTW2/databases/data_recon"
	], function(
			robotTW2,
			conf,
			helper,
			data_recon
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
						return $filter("i18n")(obj[1], $rootScope.loc.ale, "units");
					} else {
						return
					} 
				}).sort(function(a, b){return a < b}).filter(f=>f!=undefined).join(" / ")

				var unitText = y;

				var classe = "icon-34x34-attack-red";

				var span_unit = undefined;
				switch (true) {
				case unitText.includes($filter("i18n")("snob", $rootScope.loc.ale, "units")) :
					span_unit = "snob"
						break;
				case unitText.includes($filter("i18n")("trebuchet", $rootScope.loc.ale, "units")) :
					span_unit = "trebuchet"
						break;
				case unitText.includes($filter("i18n")("sword", $rootScope.loc.ale, "units")) :
					span_unit = "sword"
						break;
				case unitText.includes($filter("i18n")("ram", $rootScope.loc.ale, "units")) :
					span_unit = "ram"
						break;
				case unitText.includes($filter("i18n")("light_cavalry", $rootScope.loc.ale, "units")) :
					span_unit = "light_cavalry"
						break;
				case unitText.includes($filter("i18n")("heavy_cavalry", $rootScope.loc.ale, "units")) :
					span_unit = "heavy_cavalry"
						break;
				case unitText.includes($filter("i18n")("axe", $rootScope.loc.ale, "units")) :
					if(cmdType == "attack"){
						span_unit = "axe"
					} else {
						span_unit = "spear"
					}
				break;
				}
				
				let pai_type = document.querySelectorAll('span.type');
				let pai_edit = document.querySelectorAll('span.edit');

				switch (cmdType) {
				case "attack":
					if(span_unit != undefined){
						pai_type[i].classList.remove("icon-34x34-attack");
						pai_type[i].classList.add("icon-34x34-unit-" + span_unit);
						pai_edit[i].classList.remove("icon-34x34-edit");
						pai_edit[i].classList.add(classe);
					}
					break;
				case "relocate":
					pai_type[i].classList.remove("icon-34x34-relocate");
					pai_type[i].classList.add("icon-34x34-unit-" + span_unit);
					pai_edit[i].classList.remove("icon-34x34-edit");
					pai_edit[i].classList.add("icon-34x34-relocate");
					break;
				case "support":
					pai_type[i].classList.remove("icon-34x34-support");
					pai_type[i].classList.add("icon-34x34-unit-" + span_unit);
					pai_edit[i].classList.remove("icon-34x34-edit");
					pai_edit[i].classList.add("icon-34x34-support");
					break;
				}

				return unitText;
			}
		}
		, setNewHandlersAtackRecon = function(){
			if(!overviewService){
				overviewService	= injector.get("overviewService");
			}
			overviewService.gameFormatCommand = overviewService.formatCommand;
			var i = 0
			, OverviewController = undefined

			overviewService.formatCommand = function (command) {
				overviewService.gameFormatCommand(command);

				if(isPaused){return}

				if(!OverviewController){
					OverviewController = robotTW2.loadController("OverviewController")
				} else if(i < 1 ){
					OverviewController = robotTW2.loadController("OverviewController")
				}
				
				if(!OverviewController){return}
				
				$timeout(function(){
					var elem = undefined;
					document.querySelectorAll(".command-type")[i] ? elem = (document.querySelectorAll(".command-type")[i]).querySelectorAll("div")[0] : i = 0;
					if(elem){
						if(OverviewController && OverviewController.activeTab == OverviewController.TABS.INCOMING){
							var unitText = getAttackTypeAtackRecon(command, i);
							if (unitText != undefined){
								if(Object.keys(data_recon.rename).map(function(elem, index, array){
									return unitText.includes($filter("i18n")(elem, $rootScope.loc.ale, "units"))
								}).filter(f=>f!=undefined).length && data_recon.active_rename){
									getrenameCmdAtackRecon(command, unitText);
								}
							}
							elem.setAttribute("style", "margin-top: 1px; display: block; overflow: hidden; text-overflow: ellipsis;	white-space: nowrap; max-width: 104px")
							i++;
							if (document.querySelectorAll('span.type').length === i) {
								i = 0;
							}

						} else if(OverviewController.activeTab == OverviewController.TABS.COMMANDS){
							elem.setAttribute("style", "margin-top: 1px; display: block; overflow: hidden; text-overflow: ellipsis;	white-space: nowrap; max-width: 104px")
							i++;
							if (document.querySelectorAll('span.type').length === i) {
								i = 0;
							}
						}
						elem.addEventListener("mouseenter", function(a) {
							$rootScope.$broadcast(providers.eventTypeProvider.TOOLTIP_SHOW, "tooltip", elem.innerText, true, elem)
						}),
						elem.addEventListener("mouseleave", function() {
							$rootScope.$broadcast(providers.eventTypeProvider.TOOLTIP_HIDE, "tooltip")
						})
					}
					if(!OverviewController){return}
					if (!OverviewController.$$phase) OverviewController.$apply();
				}, 200)
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
			version			: conf.VERSION.RECON,
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