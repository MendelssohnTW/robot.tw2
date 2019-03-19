define("robotTW2/controllers/AttackController", [
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/conf",
	"robotTW2/time",
	"helper/time",
	"robotTW2/databases/data_villages",
	"robotTW2/databases/data_attack",
	"helper/format"
	], function(
			services,
			providers,
			conf,
			time,
			helper,
			data_villages,
			data_attack,
			formatHelper
	){
	return function AttackController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		$scope.data_attack = data_attack;
		$scope.text_version = $scope.version + " " + data_attack.version;
		$scope.local_data_villages = []
		$scope.local_out_villages = []
		$scope.data_villages = data_villages;

		var self = this
		, update = function(){
			$scope.comandos = Object.keys(data_attack.commands).map(function(elem, index, array){
				services.socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
					'my_village_id'		: services.modelDataService.getSelectedVillage().getId(),
					'village_id'		: data_attack.commands[elem].target_village,
					'num_reports'		: 0
				}, function(data){
					$scope.local_out_villages.push(
							{
								"id"	: data.village_id ,
								"label"	: data.village_name + " (" + data.village_x + "|" + data.village_y + ")",
								"x"		: data.village_x,
								"y"		: data.village_y
							});
					if (!$scope.$$phase) {$scope.$apply()}
				})
				return data_attack.commands[elem]
			});

			$scope.comandos.sort(function(a,b){return (a.data_escolhida - time.convertedTime() - a.duration) - (b.data_escolhida - time.convertedTime() - b.duration)})
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}
		, getVillage = function getVillage(vid){
			if(!vid){return}
			return services.modelDataService.getSelectedCharacter().getVillage(vid)
		}
		, setVillage = function setVillage(village){
			if(!village){return}
			return services.modelDataService.getSelectedCharacter().setSelectedVillage(village)
		}

		$scope.getClass = function(type){
			var className = "";
			switch (type) {
			case "support": {
				className = "icon-26x26-support";
				break;
			}
			case "attack": {
				className = "icon-26x26-attack-red";
				break;
			}
			case "relocate": {
				className = "icon-26x26-relocate";
				break;
			}
			}
			return className
		}

		$scope.jumpToVillage = function(vid){
			if(!vid){return}
			var village = getVillage(vid)
			if(!village){return}
			let x = village.data.x
			let y = village.data.y
			setVillage(village)
			services.mapService.jumpToVillage(x, y);
			$scope.closeWindow();
		}

		$scope.jumpOutVillage = function(vid){
			if(!vid){return}
			let v = $scope.local_out_villages.find(f=>f.id==vid);
			if(!v){return}
			services.mapService.jumpToVillage(v.x, v.y);
			$scope.closeWindow();
		}

		$scope.getHoraSend = function(param){
			return services.$filter("date")(new Date(param.data_escolhida - param.duration), "HH:mm:ss.sss");
		}

		$scope.getDataSend = function(param){
			return services.$filter("date")(new Date(param.data_escolhida - param.duration), "dd/MM/yyyy");
		}

		$scope.getHoraAlvo = function(param){
			return services.$filter("date")(new Date(param.data_escolhida), "HH:mm:ss.sss");
		}

		$scope.getDataAlvo = function(param){
			return services.$filter("date")(new Date(param.data_escolhida), "dd/MM/yyyy");
		}

		$scope.getTimeRest = function(param){
			var difTime = param.data_escolhida - time.convertedTime() - param.duration; 
			return helper.readableMilliseconds(difTime)
		}

		$scope.getLabelStart = function(param){
			let vid = param.start_village;
			if(!vid){return}
			return $scope.local_data_villages.find(f=>f.id==vid).label
		}

		$scope.getLabelTarget = function(param){
			let vid = param.target_village;
			if(!vid || !$scope.local_out_villages.find(f=>f.id==vid)){return}
			return $scope.local_out_villages.find(f=>f.id==vid).label
		}

//		$scope.getVstart = function(param){
//		var vid = param.start_village;
//		if(!vid){return}
//		return getVillageData(vid).name
//		}

//		$scope.getVcoordStart = function(param){

//		var vid = param.start_village;
//		if(!vid){return}
//		var x = getVillageData(vid).x
//		var y = getVillageData(vid).y
//		return "(" + x + "/" + y + ")"
//		}

//		$scope.getVcoordTarget = function(param){
//		return "(" + param.target_x + "/" + param.target_y + ")"
//		}

		$scope.clear_attack = function(){
			services.AttackService.removeAll();
		}

		$scope.menu = function () {
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
		}

		$scope.removeCommand = services.AttackService.removeCommandAttack;

		$scope.$on(providers.eventTypeProvider.CHANGE_COMMANDS, function() {
			update();
		})

		$scope.$watch("data_attack", function(){
			if(!$scope.data_attack){return}
			data_attack = $scope.data_attack;
			data_attack.set();
		}, true)

		$scope.$on("$destroy", function() {
			$scope.data_attack.set();
		});

//		Object.keys(data_villages.villages).map(function(key){
//		let data = getVillage(key).data;
//		angular.extend($scope.local_data_villages, {[key] : {"data": data}})
//		return $scope.local_data_villages;
//		})

		Object.keys($scope.data_villages.villages).map(function(key){
			var vill = getVillage(key);
			$scope.local_data_villages.push({
				id 		: key,
				name 	: vill.data.name,
				label 	: formatHelper.villageNameWithCoordinates(vill.data),
				value 	: $scope.data_villages.villages[key].defense_activate,
				x		: vill.data.x,
				y		: vill.data.y
			})
			$scope.local_data_villages.sort(function(a,b){return a.label.localeCompare(b.label)})
			return $scope.local_data_villages;
		})

		update();

		$scope.setCollapse();

		return $scope;
	}
})