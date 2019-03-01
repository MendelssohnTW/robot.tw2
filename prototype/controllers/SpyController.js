define("robotTW2/autocomplete", [
	"helper/dom", 
	"struct/MapData",
	"robotTW2/services",
	"robotTW2/providers",
	"helper/format"
	], function(
			domHelper, 
			mapData,
			services,
			providers,
			formatHelper
	){
	var id = "two-autocomplete",
	open = !1,
	isValidCoords = function(a) {
		return /\s*\d{2,3}\|\d{2,3}\s*/.test(a)
	},
	clickHandler = function(elem) {
		domHelper.matchesId.bind(elem, 'select-field', true, service.hide); //.custom-select
	},
	onItemSelected = function(item) {
		service.hide(), services.$rootScope.$broadcast(providers.routeProvider.SELECT_HIDE, id), services.$rootScope.$broadcast(providers.routeProvider.SELECT_SELECTED, id, item) //item = array
	},
	getLabel = function(village) {
		return village.name + "(" + village.x + "/" + village.y + ")"
	},
	extendItemProperties = function extendItemProperties(item) {

		if (item.type === 'village') {
			item.displayedName = formatHelper.villageNameWithCoordinates(item);
		}

		if (item.type) {
			item.leftIcon = 'size-34x34';
			// If type is defined, use its icon.
			item.leftIcon += ' icon-26x26-rte-' + item.type;
		}

		return item;
	}
	service = {};
	return service.hide = function() {
		services.$rootScope.$broadcast(providers.routeProvider.SELECT_HIDE, id), 
		$(window).off("click", clickHandler), 
		$(".win-main").off("mousewheel", service.hide), 
		open = !1
	}, service.show = function(list, triggerElement, f, g) {
		return id = f, 
		!!list.length && (
				services.$rootScope.$broadcast(providers.routeProvider.SELECT_SHOW, 
						id, 
						list, 
						null, //selected
						onItemSelected, 
						triggerElement, 
						!0, //dropDown
						0, //rightMargin
						services.$filter('i18n')('no_results', services.$rootScope.loc.ale, 'directive_autocomplete')
				), 
				open || (
						open = !0, 
						$(".win-main").on("mousewheel", service.hide), 
						$(window).on("click", clickHandler)
				), 
				!0
		)
	}, service.search = function(param, callback, type, e) {
		let list = []
		if (isValidCoords(param)) {
			var coords_args = param.split("/").map(function(arg) {
				return parseInt(arg, 10)
			});
			return void mapData.loadTownDataAsync(coords_args[0], coords_args[1], 1, 1, function(data) {
				data && list.push({
					id: data.id,
					type: "village",
					name: getLabel(a)
				}), callback(list)
			})
		}
		services.autoCompleteService.mixed(type, param, function(data) {
			let list = data.result;
			list = list.map(extendItemProperties);
			callback(list)
		});
	}, service
}),
define("robotTW2/controllers/SpyController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/time",
	"robotTW2/databases/data_spy",
	"robotTW2/databases/data_villages",
	"robotTW2/autocomplete"
	], function(
			services,
			providers,
			helper,
			time,
			data_spy,
			data_villages,
			autocomplete
	){
	return function SpyController($scope) {
		$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
		$scope.CLEAR = services.$filter("i18n")("CLEAR", services.$rootScope.loc.ale);
		$scope.SELECT = services.$filter("i18n")("SELECT", services.$rootScope.loc.ale);
		$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);

		var self = this


//		data_escolhida: 1551304200000
//		duration: 900000
//		id_command: "3102607103727"
//		spys: 2
//		startVillage: 2833
//		targetVillage: 2949
//		timer_delay: 395462
//		type: "units"



		$scope.data_spy = data_spy
		$scope.text_version = $scope.version + " " + data_spy.version;

		var TABS = {
				SPY 	: services.$filter("i18n")("spy", services.$rootScope.loc.ale, "spy"),
				COMP	: services.$filter("i18n")("comp", services.$rootScope.loc.ale, "spy"),
				LOG		: services.$filter("i18n")("log", services.$rootScope.loc.ale, "spy")
		}
		, TAB_ORDER = [
			TABS.SPY,
			TABS.COMP,
			TABS.LOG,
			]

		$scope.requestedTab = TABS.SPY;
		$scope.TABS = TABS;
		$scope.TAB_ORDER = TAB_ORDER;

		$scope.local_data_villages = []

		function getVillage(vid){
			if(!vid){return}
			return services.modelDataService.getSelectedCharacter().getVillage(vid)
		}

		function getVillageData(vid){
			if(!vid){return}
			return $scope.local_data_villages[vid].data;
		}

		Object.keys(data_villages.villages).map(function(key){
			let data = getVillage(key).data;
			$scope.local_data_villages.push({
				id : key,
				name : data.name,
				value : data
			})
			return $scope.local_data_villages;
		})

		$scope.village_selected = $scope.local_data_villages[Object.keys($scope.local_data_villages)[0]]

		if (!$scope.$$phase) {$scope.$apply()}

		var setActiveTab = function setActiveTab(tab) {
			$scope.activeTab								= tab;
			$scope.requestedTab								= null;
		}
		, initTab = function initTab() {
			if (!$scope.activeTab) {
				setActiveTab($scope.requestedTab);
			}
		}
		, update = function(){
			$scope.comandos = Object.keys(data_spy.commands).map(function(elem, index, array){
				return data_spy.commands[elem]
			});
			$scope.comandos.sort(function(a,b){return (a.data_escolhida - time.convertedTime() - a.duration) - (b.data_escolhida - time.convertedTime() - b.duration)})
			if (!$scope.$$phase) {$scope.$apply()}
		}

		initTab();
		update();

		$scope.userSetActiveTab = function(tab){
			setActiveTab(tab);
		}

		$scope.isRunning = services.SpyService.isRunning();

		$scope.autoCompleteKey = function(event){
			var id = event.srcElement.id;
			var valeu = event.srcElement.value;
			if (!valeu || valeu.length < 2) return autocomplete.hide();
			autocomplete.search(valeu, function(list) {
				list.length && autocomplete.show(list, event.srcElement[0], id)
			}, ["village"])
		}

		$scope.getVstart = function(param){
			if($scope.activeTab != TABS.SPY){return}
			var vid = param.start_village;
			if(!vid){return}
			return getVillageData(vid).name
		}

		$scope.getVcoordStart = function(param){
			if($scope.activeTab != TABS.SPY){return}
			var vid = param.start_village;
			if(!vid){return}
			var x = getVillageData(vid).x
			var y = getVillageData(vid).y
			return "(" + x + "/" + y + ")"
		}

		$scope.getVtarget = function(param){
			if($scope.activeTab != TABS.SPY){return}
			if(!param){return}
			return param.target_name
		}

		$scope.getVcoordTarget = function(param){
			if($scope.activeTab != TABS.SPY){return}
			if(!param){return}
			var x = param.target_x
			var y = param.target_y
			return "(" + x + "/" + y + ")"
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


		$scope.clear_spy = function(){
			services.SpyService.removeAll();
		}

		$scope.removeCommand = services.SpyService.removeCommandAttackSpy;

		$scope.$on(providers.eventTypeProvider.CHANGE_COMMANDS, function() {
			update();
		})

		$scope.blur = function(){
			var t = $("#input-ms").val();
			if(t.length <= 5) {
				t = t + ":00"
			}
			data_spy.interval = helper.unreadableSeconds(t) * 1000;
		}

		$scope.getTimeRest = function(){
			if($scope.activeTab != TABS.SPY){return}
			return data_spy.complete > time.convertedTime() ? helper.readableMilliseconds(data_spy.complete - time.convertedTime()) : 0;
		}


		$scope.$on(providers.eventTypeProvider.INTERVAL_CHANGE_SPY, function($event, data) {
			if($scope.activeTab != TABS.SPY){return}
			document.getElementById("input-ms").value = helper.readableMilliseconds(data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds(data_spy.interval) : helper.readableMilliseconds(data_spy.interval);
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

		$scope.$on("$destroy", function() {
			$scope.data_spy.set();
		});

		if($scope.activeTab = TABS.SPY){
			document.getElementById("input-ms").value = helper.readableMilliseconds(data_spy.interval).length == 7 ? "0" + helper.readableMilliseconds(data_spy.interval) : helper.readableMilliseconds(data_spy.interval);
		}
		$scope.setCollapse();

		return $scope;
	}
})
