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

			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
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
		{"tavern": 7},
		{"hospital": 3},  
		{"preceptory": 0},  
		{"church": 0},
		{"chapel": 0},
		{"academy": 1},  
		{"rally_point": 3},  
		{"statue": 3},
		{"market": 5},
		{"timber_camp": 19},  
		{"clay_pit": 19},
		{"iron_mine": 19},  
		{"farm": 27},
		{"warehouse": 24},  
		{"wall": 10}
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
				CONF			: 2.04,
				VILLAGES		: 2.01,
				HEADQUARTER		: 2.01,
				ALERT			: 2.01,
				RECON			: 2.02,
				SPY				: 2.01,
				ATTACK			: 2.01,
				DEFENSE			: 2.01,
				FARM			: 2.01,
				RECRUIT			: 2.02,
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
				RECON		 	: "ctrl+alt+r",
				SPY			 	: "ctrl+alt+q",
				ATTACK		 	: "ctrl+alt+a",
				DEFENSE		 	: "ctrl+alt+d",
				FARM		 	: "ctrl+alt+f",
				RECRUIT		 	: "ctrl+alt+e",
				DEPOSIT		 	: "ctrl+alt+t"
			},
			RESERVA				: {
				FOOD			: 200,
				WOOD			: 500,
				CLAY			: 500,
				IRON			: 500,
				SLOTS			: 2
			},
			TROOPS_NOT				: []

	}

	var data_conf = database.get("conf");
	if(!data_conf) {
		data_conf = conf;
		database.set("conf", data_conf, true)
	} else {
		if(!data_conf.VERSION.CONF || data_conf.VERSION.CONF < conf.VERSION.CONF){
			data_conf = conf;
			database.set("conf", data_conf, true)
		}
	}
	return data_conf;

})