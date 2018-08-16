define("robotTW2/recon", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/loadController",
	"robotTW2/data_recon",
	"helper/time"
	], function(
			services,
			providers,
			loadController,
			data_recon,
			helper
	){
	var isInitialized = !1
	, isRunning = !1
	, isPaused = !1
	, data = data_recon.getRecon()
	, getrenameCmdAtackRecon = function (command, unitText) {
		if(command.command_name != unitText){
		services.socketService.emit(providers.routeProvider.COMMAND_RENAME, {
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

			var t = services.modelDataService.getGameData().data.units.map(function(obj, index, array){
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
					return services.$filter("i18n")(obj[1], $rootScope.loc.ale, "recon");
				} else {
					return
				} 
			}).sort(function(a, b){return a < b}).filter(f=>f!=undefined).join(" / ")

			var unitText = y;

			var classe = "icon-34x34-attack-red";

			if(unitText.includes("snob")){

			}

			var span_unit = undefined;
			switch (true) {
			case unitText.includes(services.$filter("i18n")("snob", $rootScope.loc.ale, "recon")) :
				span_unit = "snob"
					break;
			case unitText.includes(services.$filter("i18n")("trebuchet", $rootScope.loc.ale, "recon")) :
				span_unit = "trebuchet"
					break;
			case unitText.includes(services.$filter("i18n")("sword", $rootScope.loc.ale, "recon")) :
				span_unit = "sword"
					break;
			case unitText.includes(services.$filter("i18n")("ram", $rootScope.loc.ale, "recon")) :
				span_unit = "ram"
					break;
			case unitText.includes(services.$filter("i18n")("light_cavalry", $rootScope.loc.ale, "recon")) :
				span_unit = "light_cavalry"
					break;
			case unitText.includes(services.$filter("i18n")("heavy_cavalry", $rootScope.loc.ale, "recon")) :
				span_unit = "heavy_cavalry"
					break;
			case unitText.includes(services.$filter("i18n")("axe", $rootScope.loc.ale, "recon")) :
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
		services.overviewService.gameFormatCommand = services.overviewService.formatCommand;
		var i = 0
		, t = 0
		, OverviewController = undefined

		services.overviewService.formatCommand = function (command) {
			services.overviewService.gameFormatCommand(command);

			if(isPaused){return}
			
			OverviewController = loadController("OverviewController");
			data = data_recon.getRecon()

			t++;
			services.$timeout(function(){
				
				if (OverviewController){
					var elem = undefined;
					$(".command-type")[i] ? elem = $($(".command-type")[i])[0].querySelector("div") : i = 0;
					if(elem){
					if(OverviewController.activeTab == OverviewController.TABS.INCOMING){
						var unitText = getAttackTypeAtackRecon(command, i);
						//if (unitText != undefined && data_recon.getRecon().RENAME_COMMAND){
						if (unitText != undefined){
							var rename = data.RENAME_COMMAND;
							if(rename == true){
								var renameCmd = getrenameCmdAtackRecon(command, unitText);
							} else if(rename == "snob" && unitText == services.$filter("i18n")("snob", $rootScope.loc.ale, "recon")){
								var renameCmd = getrenameCmdAtackRecon(command, unitText);
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
					if (!$rootScope.$$phase) $rootScope.$apply();
				}
			}, 100 * t)
		}
	}
	, start = function (){
		if(isRunning) {return}
		isRunning = !0
		setNewHandlersAtackRecon();
	}
	, pause = function (){
		isPaused = !0
	}
	, stop = function (){
		isRunning = !1
		services.overviewService.formatCommand = services.overviewService.gameFormatCommand;
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

})
,
define("robotTW2/recon/ui", [
	"robotTW2/recon",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_recon",
	"helper/time",
	"robotTW2/conf",
	'conf/overviewTabs',
	'conf/unitTypes'
	], function(
			recon,
			builderWindow,
			services,
			providers,
			data_recon,
			helper,
			conf,
			OVERVIEW_TABS,
			UNIT_TYPES
	){
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.RECON;
		var templateName = "recon";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
		return null
	}
	, injectScope = function(){
		var $scope = $window.$data.scope;
		$scope.title = services.$filter("i18n")("title", $rootScope.loc.ale, "recon");
		$scope.introducing = services.$filter("i18n")("introducing", $rootScope.loc.ale, "recon");
		$scope.rename_command = services.$filter("i18n")("rename_command", $rootScope.loc.ale, "recon");
		$scope.rename_snob = services.$filter("i18n")("rename_snob", $rootScope.loc.ale, "recon");
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);

		$scope.data = data_recon.getRecon();
		$scope.renameSnob = false;
		$scope.rename = true;

		if($scope.data.RENAME_COMMAND == "snob"){
			$scope.rename = true;
			$scope.renameSnob = true;
		} else if ($scope.data.RENAME_COMMAND == false){
			$scope.rename = false;
			$scope.renameSnob = false;
		} else {
			$scope.rename = true;
			$scope.renameSnob = false;
		}

		$scope.toggleRename = function(rename){
			$scope.rename = rename;
			if($scope.rename == false){
				$scope.data.RENAME_COMMAND = false
			} else {
				if($scope.renameSnob == false){
					$scope.data.RENAME_COMMAND = true
				} else {
					$scope.data.RENAME_COMMAND = "snob";
					$scope.renameSnob = true
				}
			}
			data_recon.setRecon($scope.data)
			if (!$rootScope.$$phase) $rootScope.$apply();
		}

		$scope.toggleRenameSnob = function(renameSnob){
			$scope.renameSnob = renameSnob;
			if($scope.renameSnob == true) {
				$scope.data.RENAME_COMMAND = "snob"
			} else {
				if($scope.rename == false){
					$scope.data.RENAME_COMMAND = false
				} else {
					$scope.data.RENAME_COMMAND = true
				}
			}
			data_recon.setRecon($scope.data)
			if (!$rootScope.$$phase) $rootScope.$apply();
		}

		$window.$data.ativate = $scope.data.ATIVATE;
		$scope.isRunning = recon.isRunning();
		$scope.paused = recon.isPaused();
		
		$scope.pause_recon = function(){
			recon.pause();
			$scope.paused = !0;
		}
		$scope.resume_recon = function(){
			recon.resume();
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

	Object.setPrototypeOf(recon, {
		build : function(){
			build(injectScope)
		}
	})
})
