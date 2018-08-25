define("robotTW2/getScope", function(){
	return function (elem) {
		var selector = angular.element(elem[0]);
		return selector.scope();
	}
})
,
define("robotTW2/loadController", [
	"robotTW2/getScope"
	], function(
			getScope
	){
	return function(controller){
		return window[controller] || getScope($('[ng-controller=' + controller + ']'));
	}
})
,
define("robotTW2/eventQueue", function() {
	var events = {}
	, service = {};
	return service.bind = function(key, event) {
		events.hasOwnProperty(key) || (events[key] = []),
		events[key].push(event)
	}
	,
	service.trigger = function(key, event) {
		events.hasOwnProperty(key) && events[key].forEach(function(a) {
			events.apply(this, event)
		})
	}
	,
	service
})
,
define("robotTW2/getScreen", [
	"robotTW2/templates",
	"robotTW2/services"
	], function(
			templates,
			services
	){
	!services.httpService.getUri ? services.httpService.getUri = services.httpService.get: null;
	services.httpService.get = function(uri, onLoad){
		if (0 === uri.indexOf("*")) {
			uri = uri.substr(1);
			templates.get(uri, onLoad)
		} else {
			services.httpService.getUri(uri, onLoad);
		}
	}

	return function(templateName, opt_scope, opt_loadCallback, opt_destroyCallback, opt_toggle){
		services.windowManagerService.getScreenWithInjectedScope("!*" + templateName, opt_scope, opt_loadCallback, opt_destroyCallback, opt_toggle);
	}
})
,
define("robotTW2/templates", [], function(){
	var get = function(template, onLoad){
		var onLoadWrapper = function onLoadWrapper(responseText) {
			onLoad(responseText);
//			if (!$rootScope.$$phase) {
//			$rootScope.$apply();
//			}
		};
		var docs = $("div[ng-include]");
		var doc = docs.map(
				function(doc){
					return doc.attributes.getNamedItem("src").value.indexOf(template) != -1 ? doc : undefined
				}
		).filter(f=>f!=undefined)[0]
		if(doc){
			var cln = doc.cloneNode(true);
			onLoadWrapper(cln)
		}
	}
	return {get : get}
})
,
define("robotTW2/notify", [
	"robotTW2/services",
	"robotTW2/providers"
	], function(
			services,
			providers
	) {
	return function(message){
		$rootScope.$broadcast(providers.eventTypeProvider.NOTIFICATION_NEW, {
			message: services.$filter("i18n")(message, $rootScope.loc.ale, "notify"),
			type: "achievement"
		})
	}
})
,
define("robotTW2/unitTypesRenameRecon", [
	"robotTW2/services"
	], function(
			services
	) {
	var l = {}
	services.modelDataService.getGameData().data.units.map(function(obj, index, array){
		if(obj.name != "knight"){
			{l[obj.name] = true}
		}
	});
	return l
})
,
define("robotTW2/unitTypes", [
	"robotTW2/services"
	], function(
			services
	) {
	var t = services.modelDataService.getGameData().data.units.map(function(obj, index, array){
		return [obj.speed, obj.name]
	}).map(m => {
		return [m[0], m[1]];
	}).sort((a, b) => {
		return a[0] - b[0];
	});

	var no_repeat = t.map(function(elem, index, array){
		if(index > 0) {
			if(array[index][0] !== array[index-1][0]){
				return elem
			}
		} else {
			return elem
		}
	}).filter(f=>f!=undefined)

	var list_units = [];
	no_repeat.map(function(elem, i, ar){
		list_units.push(t.map(function(obj, index, array){
			if(obj[0] == elem[0]) {
				return services.$filter("i18n")(obj[1], $rootScope.loc.ale, "recon");
			} else {
				return
			} 
		}).sort(function(a, b){return a < b}).filter(f=>f!=undefined).join(" / "))
	}).filter(f=>f!=undefined)
	return list_units
})
,
define("robotTW2/conf", [
	"robotTW2/database",
	"conf/buildingTypes"
	], function(
			database,
			buildingTypes
	) {

	var levelsBuilding = [];
	for (var type in buildingTypes){
		if(buildingTypes.hasOwnProperty(type) && [buildingTypes[type]] != "fortress"){
			levelsBuilding.push({[buildingTypes[type]] : 0})
		}
	}
	var orderbuilding = [
		{"academy": 1}, //Academia
		{"headquarter": 2}, //Principal
		{"farm": 3}, //Fazenda
		{"warehouse": 4}, //Armazém
		{"barracks": 5}, //Quartel
		{"rally_point": 6}, //Ponto de encontro
		{"timber_camp": 7}, //Bosque
		{"iron_mine": 8}, //Mina de Ferro
		{"clay_pit": 9}, //Poço de Argila
		{"wall": 10}, //Muralha
		{"statue": 11}, //Estátua
		{"tavern": 12}, //Taverna
		{"market": 13}, //Mercado
		{"hospital": 14}, //Hospital
		{"preceptory": 15}, //Salão das ordens
		{"church": 16}, //Igreja
		{"chapel": 17} //Caplea
		]

	var limitBuilding = [
		{"headquarter": 20},
		{"barracks": 15},
		{"tavern": 13},
		{"hospital": 5},  
		{"preceptory": 0},  
		{"church": 0},
		{"chapel": 0},
		{"academy": 1},  
		{"rally_point": 5},  
		{"statue": 5},
		{"market": 15},
		{"timber_camp": 23},  
		{"clay_pit": 23},
		{"iron_mine": 25},  
		{"farm": 30},
		{"warehouse": 25},  
		{"wall": 18}
		]

	var seg = 1000 // 1000 milisegundos
	, min = seg * 60
	, h = min * 60

	var conf = {
			h						: h,
			min						: min,
			seg						: seg,
			EXECUTEBUILDINGORDER 	: true,
			BUILDINGORDER			: orderbuilding,
			BUILDINGLIMIT			: limitBuilding,
			BUILDINGLEVELS			: levelsBuilding,
			MAX_COMMANDS			: 42,
			MIN_POINTS				: 0,
			MAX_POINTS				: 12000,
			MAP_CHUNCK_LEN 			: 30 / 2,
			VERSION					: {
				VILLAGES		: 2.01,
				HEADQUARTER		: 2.03,
				ALERT			: 2.01,
				RECON			: 2.05,
				SPY				: 2.04,
				ATTACK			: 2.01,
				DEFENSE			: 2.01,
				FARM			: 2.01,
				RECRUIT			: 2.04,
				DEPOSIT			: 2.01
			},
			TEMPO_DE_PERCURSO		: h,
			TEMPO_DE_FARM			: h,
			INTERVAL				: {
				HEADQUARTER	: h,
				RECRUIT		: h,
				DEPOSIT		: 15 * min,
				ALERT		: 5 * min
			},
			HOTKEY					: {
				MAIN 			: "ctrl+alt+p",
				HEADQUARTER 	: "ctrl+alt+h",
				ALERT		 	: "ctrl+alt+w",
				RECON		 	: "",
				SPY			 	: "",
				ATTACK		 	: "ctrl+alt+a",
				DEFENSE		 	: "ctrl+alt+d",
				FARM		 	: "ctrl+alt+f",
				RECRUIT		 	: "ctrl+alt+e",
				DEPOSIT		 	: ""
			},
			RESERVA				: {
				RECRUIT : {
					FOOD			: 500,
					WOOD			: 2000,
					CLAY			: 2000,
					IRON			: 2000,
					SLOTS			: 2
				},
				HEADQUARTER : {
					FOOD			: 500,
					WOOD			: 2000,
					CLAY			: 2000,
					IRON			: 2000,
					SLOTS			: 2
				}

			},
			TROOPS_NOT				: ["knight", "snob", "doppelsoldner", "trebuchet"]

	}
	return conf;
})