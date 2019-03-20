define("robotTW2/controllers/SpyController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/time",
	"robotTW2/databases/data_spy",
	"robotTW2/databases/data_villages",
	"robotTW2/autocomplete",
	"helper/math"
	], function(
			services,
			providers,
			helper,
			time,
			data_spy,
			data_villages,
			autocomplete,
			math
	){
	return function SpyController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
		$scope.SELECT = services.$filter("i18n")("SELECT", services.$rootScope.loc.ale);
		$scope.SEARCH_MAP = services.$filter('i18n')('SEARCH_MAP', services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		$scope.date_init = services.$filter("date")(new Date(time.convertedTime()), "yyyy-MM-dd")
		$scope.hour_init = services.$filter("date")(new Date(time.convertedTime()), "HH:mm:ss")
		$scope.ms_init = 0;
		$scope.data_spy = data_spy
		$scope.text_version = $scope.version + " " + data_spy.version;
		$scope.send_scope = {};

		var self = this
		, TABS = {
				SPY 	: services.$filter("i18n")("spy", services.$rootScope.loc.ale, "spy"),
				COMP	: services.$filter("i18n")("comp", services.$rootScope.loc.ale, "spy")
		}
		, TAB_ORDER = [
			TABS.SPY,
			TABS.COMP
			]
		, setActiveTab = function setActiveTab(tab) {
			$scope.activeTab		= tab;
			$scope.requestedTab		= null;
		}
		, initTab = function initTab() {
			if (!$scope.activeTab) {
				setActiveTab($scope.requestedTab);
			}
		}
		, update = function(){
			$scope.comandos = Object.keys(data_spy.commands).map(function(elem, index, array){
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
				return data_spy.commands[elem]
			});
			$scope.comandos.sort(function(a,b){return (a.data_escolhida - time.convertedTime() - a.duration) - (b.data_escolhida - time.convertedTime() - b.duration)})
			if(document.getElementById("input-ms-interval")){
				document.getElementById("input-ms-interval").value = helper.readableMilliseconds(data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds(data_spy.interval) : helper.readableMilliseconds(data_spy.interval);
			}
			if (!$scope.$$phase) {$scope.$apply()}
		}
		, updateValues = function(){
			if(Object.keys($scope.send_scope).length){
				let durationInSeconds = $scope.send_scope.distance / services.modelDataService.getWorldConfig().getSpeed() * services.modelDataService.getGameData().getBaseData().spy_speed * 60
				let get_data = $("#input-date").val();
				let get_time = $("#input-time").val();
				let get_ms = $("#input-ms").val();
				if (get_time.length <= 5){
					get_time = get_time + ":00"; 
				}
				if (get_data != undefined && get_time != undefined){
					$scope.send_scope.milisegundos_duracao = durationInSeconds * 1000;
					$scope.send_scope.tempo_escolhido = new Date(get_data + " " + get_time + "." + get_ms).getTime();
					$scope.date_init = services.$filter("date")(new Date($scope.send_scope.tempo_escolhido), "yyyy-MM-dd")
					$scope.hour_init = services.$filter("date")(new Date($scope.send_scope.tempo_escolhido), "HH:mm:ss")
				}
			}
		}
		, updateTarget = function(){
			if($scope.item){
				services.socketService.emit(providers.routeProvider.MAP_GET_VILLAGE_DETAILS, {
					'my_village_id'		: services.modelDataService.getSelectedVillage().getId(),
					'village_id'		: $scope.item.id,
					'num_reports'		: 0
				}, function(data){
					$scope.send_scope.target_name = data.village_name;
					$scope.send_scope.distance = math.actualDistance(
							{
								'x' : $scope.data_select.selectedOption.x,
								'y' : $scope.data_select.selectedOption.y
							}, 
							{
								'x' : data.village_x,
								'y' : data.village_y
							}
					);

					$scope.send_scope.type = $scope.data_type.selectedOption.value; //type
					$scope.send_scope.startId
					$scope.send_scope.targetId
					$scope.send_scope.targetVillage //name
					$scope.send_scope.targetX
					$scope.send_scope.targetY
					$scope.send_scope.qtd = $scope.data_qtd.selectedOption//qtd
					updateValues()
					if (!$scope.$$phase) {$scope.$apply()}
				})
			} else if($scope.item_player){

			}
		}
		, updateEnter = function(item, element){
			$scope.item = item
			$scope.item_player = undefined
			element[0].firstElementChild.value = item.displayedName
			updateTarget()
			if (!$scope.$$phase) {$scope.$apply()}
		}
		, updateEnterPlayer = function(item, element){
			$scope.item_player = item
			$scope.item = undefined
			element[0].firstElementChild.value = item.displayedName
			updateTarget()
			if (!$scope.$$phase) {$scope.$apply()}
		}

		$scope.requestedTab = TABS.SPY;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;

		$scope.isRunning = services.SpyService.isRunning();

		$scope.local_data_villages = services.VillageService.getLocalVillages("spy", "label");

		$scope.village_selected = $scope.local_data_villages[Object.keys($scope.local_data_villages)[0]]

		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
		}

		$scope.autoCompleteKey = function(event){
			let obj_autocomplete = {
					'type'					: 'village',
					'placeholder'			: $scope.SEARCH_MAP,
					'onEnter'				: updateEnter,
					'exclude'				: null,
					"inputValueReadOnly" 	: "",
					"keepSelected"			: false
			}

			let object_scope = {
					"inputValue" 	: event.srcElement.value,
					"element" 		: $($("#autocomplete_spy")[0]),
					"id" 			: "autocomplete_spy",
					"autoComplete" 	: obj_autocomplete
			}
//			angular.extend($scope, object_scope)
			autocomplete(object_scope, event);
		}

		$scope.autoCompleteKeyPlayer = function(event){
			let obj_autocomplete = {
					'type'					: 'character',
					'placeholder'			: $scope.SEARCH_MAP,
					'onEnter'				: updateEnterPlayer,
					'exclude'				: null,
					"inputValueReadOnly" 	: "",
					"keepSelected"			: false
			}

			let object_scope = {
					"inputValue" 	: event.srcElement.value,
					"element" 		: $($("#autocomplete_spy_player")[0]),
					"id" 			: "autocomplete_spy_player",
					"autoComplete" 	: obj_autocomplete
			}
//			angular.extend($scope, object_scope)
			autocomplete(object_scope, event);
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

		$scope.getClass = function(type){
			if($scope.activeTab != TABS.SPY){return}
			var className = "";
			switch (type) {
			case "units": 
				className = "icon-34x34-units";
				break;
			default: 
				className = "icon-34x34-village";
			break;
			}
			return className
		}

		$scope.getHoraSend = function(param){
			if($scope.activeTab != TABS.SPY){return}
			return services.$filter("date")(new Date(param.data_escolhida - param.duration), "HH:mm:ss.sss");
		}

		$scope.getDataSend = function(param){
			if($scope.activeTab != TABS.SPY){return}
			return services.$filter("date")(new Date(param.data_escolhida - param.duration), "dd/MM/yyyy");
		}

		$scope.getHoraAlvo = function(param){
			if($scope.activeTab != TABS.SPY){return}
			return services.$filter("date")(new Date(param.data_escolhida), "HH:mm:ss.sss");
		}

		$scope.getDataAlvo = function(param){
			if($scope.activeTab != TABS.SPY){return}
			if($scope.activeTab != TABS.SPY){return}
			return services.$filter("date")(new Date(param.data_escolhida), "dd/MM/yyyy");
		}

		$scope.getTimeRestSend = function(param){
			if($scope.activeTab != TABS.SPY){return}
			var difTime = param.data_escolhida - time.convertedTime() - param.duration; 
			return helper.readableMilliseconds(difTime)
		}

		$scope.getTimeRest = function(){
			if($scope.activeTab != TABS.SPY){return}
			return data_spy.complete > time.convertedTime() ? helper.readableMilliseconds(data_spy.complete - time.convertedTime()) : 0;
		}

		$scope.clear_spy = function(){
			services.SpyService.removeAll();
		}

		$scope.menu = function () {
			services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
		}

		$scope.removeCommand = services.SpyService.removeCommandAttackSpy;

		$scope.blur = function(){
			var t = $("#input-ms-interval").val();
			if(t.length <= 5) {
				t = t + ":00"
			}
			data_spy.interval = helper.unreadableSeconds(t) * 1000;
		}

		$scope.sendAttackSpy = function(){
			updateValues()
			if ($scope.tempo_escolhido > time.convertedTime() + $scope.milisegundos_duracao){
				services.SpyService.addScopeAttackSpy($scope);
				$scope.closeWindow();
			} else {
				notify("date_error");
			}
		}

		$scope.$on(providers.eventTypeProvider.CHANGE_COMMANDS, function() {
			update();
		})

		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_SPY, function($event, data) {
			if($scope.activeTab != TABS.SPY){return}
			document.getElementById("input-ms-interval").value = helper.readableMilliseconds(data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds(data_spy.interval) : helper.readableMilliseconds(data_spy.interval);
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})

		$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function($event, data) {
			if($scope.activeTab != TABS.SPY){return}
			$scope.isRunning = services.SpyService.isRunning();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		})

		$scope.$watch("data_logs.spy", function(){
			$scope.recalcScrollbar();
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		}, true)

		$scope.$watch("data_spy", function(){
			if(!$scope.data_spy){return}
			data_spy = $scope.data_spy;
			data_spy.set();
		}, true)

		$scope.$watch("data_select", function(){
			if(!$scope.data_select){return}
			var village = services.VillageService.getVillage($scope.data_select.selectedOption.id)
			let qtd_spy = village.getScoutingInfo().getNumAvailableSpies();
			let lts = [];
			for (let i = 0; i < qtd_spy; i++){
				lts.push(i + 1)
			}
			$scope.data_qtd = services.MainService.getSelects(lts)
			$scope.date_init = services.$filter("date")(new Date(time.convertedTime()), "yyyy-MM-dd")
			$scope.hour_init = services.$filter("date")(new Date(time.convertedTime()), "HH:mm:ss")

			updateValues();
		}, true)

		$scope.$on("$destroy", function() {
			$scope.data_spy.set();
		});

		$scope.data_select = services.MainService.getSelects($scope.local_data_villages)
		$scope.data_qtd = services.MainService.getSelects([1, 2, 3, 4, 5])
		$scope.data_type = services.MainService.getSelects([
			{
				"name" : services.$filter("i18n")("units", services.$rootScope.loc.ale, "spy"),
				"value" : "units"
			},
			{
				"name" : services.$filter("i18n")("buildings", services.$rootScope.loc.ale, "spy"),
				"value" : "buildings"

			}]
		)

		initTab();
		update();
		$scope.setCollapse();

		return $scope;
	}
})
