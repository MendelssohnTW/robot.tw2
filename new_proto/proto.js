
var exports = {}

"use strict";

var CONTENT_CLASS			= 'win-content';
var BLOCKED_CLASS			= 'blocked';
var getPath = function getPath(origPath, opt_noHost) {
	if (opt_noHost) {
		return origPath;
	}
	return host + origPath;
}
, requestFile = function requestFile(fileName, onLoad, opt_onError) {
	var I18N_PATH_EXT = ['/lang/', '.json'];
	var uri	= I18N_PATH_EXT.join(fileName)
	, onFileLoaded = function onFileLoaded() {
		$timeout = $timeout || window.injector.get('$timeout');
		$timeout(function () {
			i18n.updateLocAle(true);
			if (onLoad) {
				onLoad();
			}
		});
	};

	httpService.get(uri, function(jsont) {
		i18n.setJSON(jsont);
		onFileLoaded();
	}, function error(data, status, headers, config) {
		if (angular.isFunction(opt_onError)) {
			opt_onError(data, status, headers, config);
		}
	}, true);
}
, requestFn = (function(){
	var fns = {}
	, triggered = {}
	, service = {};
	return service.prefix = "robotTW2/" 
		, service.bind = function(key, fn, params, callback) {
		fns.hasOwnProperty(this.prefix + key) || (fns[this.prefix + key] = []),
		fns[this.prefix + key].push(
				{
					fn:fn, params:params || {}
				}
		)
		if(typeof(callback)=="function"){
			callback({fn:fn, params:params || {}})
		}
	}
	,
	service.trigger = function(key, params) {
		fns.hasOwnProperty(this.prefix + key) && fns[this.prefix + key].forEach(function(fs) {
			if(!params || !Object.keys(params).length) {
				if(!Object.keys(fs.params).length) {
					triggered[this.prefix + key] = fs.fn.apply(this, [])
				} else {
					triggered[this.prefix + key] = fs.fn.apply(this, fs.params)
				}
			} else {
				if(!Object.keys(fs.params).length) {
					triggered[this.prefix + key] = fs.fn.apply(this, [])
				} else {
					triggered[this.prefix + key] = fs.fn.apply(this, fs.params)
				}
			}
		})
	}
	,
	service.get = function(key, opt_prefix, index) {
		if(!key) return;
		!index ? index = 0 : index;
		return opt_prefix && fns[this.prefix + key] ? fns[this.prefix + key][index] : fns[key] ? fns[key][index] : null 
	}
	, service.unbind = function(key) {
		if(fns.hasOwnProperty(this.prefix + key)){
			if(triggered[key]){
				if(typeof(triggered[this.prefix + key]) == "object"){
					if(triggered[this.prefix + key].$$state.status == 0){
						$timeout.cancel(triggered[this.prefix + key])	
					}
				} else if(typeof(triggered[this.prefix + key]) == "function"){
					triggered[this.prefix + key]();
				}
				delete triggered[this.prefix + key];
				delete fns[this.prefix + key];
			} else {
				delete fns[this.prefix + key];
			}
		}
	}
	, service.unbindAll = function(type) {
		Object.keys(fns).map(function(key){
			if(!fns[key].params) {
				return undefined
			} else {
				if(!fns[key].params.type) {
					return undefined
				} else {
					if(fns[key].params.type == type){
						if(triggered[key]){
							if(typeof(triggered[key]) == "object"){
								if(triggered[key].$$state.status == 0){
									$timeout.cancel(triggered[key])	
								}
							} else if(typeof(triggered[key]) == "function"){
								triggered[key]();
							}
							delete triggered[key];
							delete fns[key];
						} else {
							delete fns[key];
						}
					}
				}
			}
		})
	}
	, service.getFns = function(){return fns}
	,
	service;
})();

var commandQueue = (function (){
	var service = {};
	return service.bind = function(key, fn, opt_db, params, callback) {
		if(!key) return;
		if(opt_db){
			if(typeof(opt_db.get) == "function"){
				if(!opt_db.commands){opt_db["commands"]= {}}
				!opt_db.commands[key] ? opt_db.commands[key] = params : null;
				$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
			}
		}
		requestFn.bind(key, fn, params, function(fns){
			if(typeof(callback)=="function"){
				callback(fns)
			}	
		})
	}
	,
	service.trigger = function(key, params) {
		if(!key) return;
		if(!params){
			requestFn.trigger(key);
		} else {
			requestFn.trigger(key, [params]);	
		}
	}
	,
	service.unbind = function(key, opt_db) {
		if(!key) return;
		if(opt_db){
			if(typeof(opt_db.get) == "function"){
				delete opt_db.commands[key];
			}
		}
		$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
		requestFn.unbind(key);
	}
	,
	service.unbindAll = function(type, opt_db) {
		if(!type){return}
		requestFn.unbindAll(type)
		if(opt_db)	{
			opt_db.commands = {};
		}
		$rootScope.$broadcast(exports.providers.eventTypeProvider.CHANGE_COMMANDS)
	}
	,
	service
})()


define("robotTW2/version", function(){
	return {
		main:			"3.0.4",
		villages:		"3.0.4",
		alert:			"3.0.4",
		deposit:		"3.0.4",
		headquarter:	"3.0.4",
		recon:			"3.0.4",
		spy:			"3.0.4",
		attack:			"3.0.4",
		defense:		"3.0.4",
		farm:			"3.0.4",
		recruit:		"3.0.4",
		medic:			"3.0.4",
		secondvillage:	"3.0.4",
		map:			"3.0.4",
		data:			"3.0.4",
		logs:			"3.0.4"
	}
});

define("robotTW2/conf", [
	"conf/buildingTypes",
	"robotTW2/version"
	], function(
			buildingTypes,
			version
	) {

	var levelsBuilding = [];
	for (var type in buildingTypes){
		if(buildingTypes.hasOwnProperty(type) && [buildingTypes[type]] != "fortress"){
			levelsBuilding.push({[buildingTypes[type]] : 0})
		}
	}

	var orderbuilding= {
			academy : [
				{"warehouse": 1}, //Armazém
				{"headquarter": 2}, //Principal
				{"academy": 3}, //Academia
				{"farm": 4}, //Fazenda
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
				],
				production : [
					{"timber_camp": 1}, //Bosque
					{"iron_mine": 2}, //Mina de Ferro
					{"clay_pit": 3}, //Poço de Argila
					{"rally_point": 4}, //Ponto de encontro
					{"academy": 5}, //Academia
					{"headquarter": 6}, //Principal
					{"farm": 7}, //Fazenda
					{"warehouse": 8}, //Armazém
					{"barracks": 9}, //Quartel
					{"wall": 10}, //Muralha
					{"statue": 11}, //Estátua
					{"tavern": 12}, //Taverna
					{"market": 13}, //Mercado
					{"hospital": 14}, //Hospital
					{"preceptory": 15}, //Salão das ordens
					{"church": 16}, //Igreja
					{"chapel": 17} //Caplea
					],
					base : [
						{"academy": 1}, //Academia
						{"barracks": 2}, //Quartel
						{"farm": 3}, //Fazenda
						{"headquarter": 4}, //Principal
						{"warehouse": 5}, //Armazém
						{"rally_point": 6}, //Ponto de encontro
						{"wall": 7}, //Muralha
						{"statue": 8}, //Estátua
						{"tavern": 9}, //Taverna
						{"timber_camp": 10}, //Bosque
						{"iron_mine": 11}, //Mina de Ferro
						{"clay_pit": 12}, //Poço de Argila
						{"market": 13}, //Mercado
						{"hospital": 14}, //Hospital
						{"preceptory": 15}, //Salão das ordens
						{"church": 16}, //Igreja
						{"chapel": 17} //Caplea
						]
	}

	var limitBuilding = {
			academy : [
				{"headquarter": 20},
				{"barracks": 10},
				{"tavern": 7},
				{"hospital": 1},  
				{"preceptory": 0},  
				{"church": 0},
				{"chapel": 0},
				{"academy": 1},  
				{"rally_point": 5},  
				{"statue": 5},
				{"market": 5},
				{"timber_camp": 18},  
				{"clay_pit": 18},
				{"iron_mine": 18},  
				{"farm": 25},
				{"warehouse": 23},  
				{"wall": 10}
				],
				production : [
					{"headquarter": 20},
					{"barracks": 21},
					{"tavern": 7},
					{"hospital": 1},  
					{"preceptory": 0},  
					{"church": 0},
					{"chapel": 0},
					{"academy": 1},  
					{"rally_point": 5},  
					{"statue": 5},
					{"market": 15},
					{"timber_camp": 30},  
					{"clay_pit": 30},
					{"iron_mine": 30},  
					{"farm": 30},
					{"warehouse": 27},  
					{"wall": 15}
					],
					base : [
						{"headquarter": 20},
						{"barracks": 23},
						{"tavern": 13},
						{"hospital": 5},  
						{"preceptory": 0},  
						{"church": 0},
						{"chapel": 0},
						{"academy": 1},  
						{"rally_point": 5},  
						{"statue": 5},
						{"market": 5},
						{"timber_camp": 15},  
						{"clay_pit": 15},
						{"iron_mine": 15},  
						{"farm": 30},
						{"warehouse": 25},  
						{"wall": 20}
						]
	}

	var seg = 1000 // 1000 milisegundos
	, min = seg * 60
	, h = min * 60;

	var conf = {
			h						: h,
			min						: min,
			seg						: seg,
			EXECUTEBUILDINGORDER 	: true,
			BUILDINGORDER			: orderbuilding,
			BUILDINGLIMIT			: limitBuilding,
			BUILDINGLEVELS			: levelsBuilding,
			LIMIT_COMMANDS_DEFENSE	: 13,
			MAX_COMMANDS_FARM		: 42,
			MIN_POINTS_FARM			: 0,
			MAX_POINTS_FARM			: 12000,
			MAP_CHUNCK_LEN 			: 10,
			TIME_CORRECTION_COMMAND : -225,
			TIME_DELAY_UPDATE		: 30 * seg,
			TIME_DELAY_FARM			: 1000,
			TIME_SNIPER_ANT 		: 30000,
			TIME_SNIPER_POST 		: 3000,
			TIME_SNIPER_POST_SNOB	: 1000,
			MAX_TIME_CORRECTION 	: 5 * seg,
			MIN_TIME_SNIPER_ANT 	: 5,
			MAX_TIME_SNIPER_ANT 	: 600,
			MIN_TIME_SNIPER_POST 	: 0.3,
			MAX_TIME_SNIPER_POST 	: 600,
			MAX_JOURNEY_DISTANCE 	: 6,
			MIN_JOURNEY_DISTANCE 	: 1,
			MAX_JOURNEY_TIME     	: 1 * h,
			MIN_JOURNEY_TIME     	: 8 * min,
			VERSION					: {
				MAIN			: version.main,
				VILLAGES		: version.villages,
				HEADQUARTER		: version.headquarter,
				ALERT			: version.alert,
				RECON			: version.recon,
				SPY				: version.spy,
				ATTACK			: version.attack,
				DEFENSE			: version.defense,
				FARM			: version.farm,
				RECRUIT			: version.recruit,
				DEPOSIT			: version.deposit,
				MEDIC			: version.medic,
				SECONDVILLAGE	: version.secondvillage,
				MAP				: version.map,
				DATA			: version.data,
				LOGS			: version.logs
			},
			FARM_TIME		      	: 30 * min,
			MIN_INTERVAL	     	: 5 * min,
			INTERVAL				: {
				HEADQUARTER	: h,
				RECRUIT		: h,
				DEPOSIT		: 15 * min,
				ALERT		: 5 * min,
				ATTACK		: h,
				MEDIC		: h,
				DATA		: {
					villages	: 6 * h,
					tribes		: 2 * h,
					logs		: 1 * h,
					members		: 3 * h
				},
				SPY			: 30 * min
			},
			DBS : [
				"alert",
				"attack",
				"defense",
				"deposit",
				"farm",
				"headquarter",
				"medic",
				"recon",
				"recruit",
				"spy",
				"secondvillage",
				"map",
				"data",
				"logs"
				]
			,
			HOTKEY					: {
				ALERT		 	: "ctrl+alt+l",
				ATTACK		 	: "ctrl+alt+a",
				DEFENSE		 	: "ctrl+alt+d",
				DEPOSIT		 	: "ctrl+alt+t",
				FARM		 	: "ctrl+alt+f",
				HEADQUARTER 	: "ctrl+alt+h",
				MAIN 			: "ctrl+alt+p",
				MEDIC		 	: "ctrl+alt+i",
				RECON		 	: "ctrl+alt+r",
				RECRUIT		 	: "ctrl+alt+e",
				SPY			 	: "ctrl+alt+s",
				SECONDVILLAGE	: "ctrl+alt+q",
				MAP			 	: "ctrl+alt+m",
				DATA			: "ctrl+alt+j"
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
			TROOPS_NOT				: {
				RECRUIT	: ["knight", "snob", "doppelsoldner", "trebuchet"],
				FARM	: ["knight", "snob", "doppelsoldner", "trebuchet", "ram"]}

	}
	return conf;
})
angular.extend(robotTW2.databases, define("robotTW2/databases", [], function(){
	robotTW2.loadScript("/databases/database.js");
	return robotTW2.databases;
}))
angular.extend(robotTW2.providers, define("robotTW2/providers", [], function(){
	robotTW2.register("providers", "routeProvider", {
		'UPDATE_WORLD':{
			type:"update_world",
			data:["world"],
		},
		'UPDATE_TRIBE':{
			type:"update_tribe",
			data:["tribe"],
		},
		'SEARCH_CHARACTER':{
			type:"search_character",
			data:["character_id"]
		},
		'SEARCH_CHARACTERS':{
			type:"search_characters",
			data:[""]
		},
		'UPDATE_CHARACTER':{
			type:"update_character",
			data:["character"]
		},
		'UPDATE_VILLAGE_CHARACTER':{
			type:"update_village_character",
			data:["village_character"]
		},
		'UPDATE_VILLAGE_LOST_CHARACTER':{
			type:"update_village_lost_character",
			data:["village_character"]
		},
		'SEARCH_VILLAGES_FOR_CHARACTER':{
			type:"search_villages_for_character",
			data:["id"]
		},
		'DELETE_CHARACTER':{
			type:"delete_member",
			data:["character_id"]
		},
		'SEARCH_WORLD':{
			type:"search_world",
			data:["world"]
		},
		'SEARCH_TRIBES_PERMITED':{
			type:"search_tribes_permited",
			data:[]
		},
		'UPDATE_VILLAGE':{
			type:"update_village",
			data:["village"]
		},
		'UPT_VILLAGE':{
			type:"upt_village",
			data:["village"]
		},
		'VERIFY_RESERVATION':{
			type:"verify_reservation",
			data:["verify_reservation"]
		},
		'SEARCH_LOCAL':{
			type:"search_local",
			data:[""]
		}
	});
	robotTW2.register("providers", "eventTypeProvider", {
		"ISRUNNING_CHANGE"				: "Internal/robotTW2/isrunning_change",
		"RESUME_CHANGE_FARM"			: "Internal/robotTW2/resume_change_farm",
		"RESUME_CHANGE_RECRUIT"			: "Internal/robotTW2/resume_change_recruit",
		"INTERVAL_CHANGE_RECRUIT"		: "Internal/robotTW2/interval_change_recruit",
		"RESUME_CHANGE_HEADQUARTER"		: "Internal/robotTW2/resume_change_headquarter",
		"INTERVAL_CHANGE_HEADQUARTER"	: "Internal/robotTW2/interval_change_headquarter",
		"INTERVAL_CHANGE_DEPOSIT"		: "Internal/robotTW2/interval_change_deposit",
		"CHANGE_COMMANDS"				: "Internal/robotTW2/change_commands",
		"CHANGE_COMMANDS_DEFENSE"		: "Internal/robotTW2/change_commands_defense",
		"CHANGE_TIME_CORRECTION"		: "Internal/robotTW2/change_time_correction",
		"CMD_SENT"						: "Internal/robotTW2/cmd_sent",
		"SOCKET_EMIT_COMMAND"			: "Internal/robotTW2/secket_emit_command",
		"SOCKET_RECEPT_COMMAND"			: "Internal/robotTW2/socket_recept_command",
		"OPEN_REPORT"					: "Internal/robotTW2/open_report"
	});
	return robotTW2.providers;
}))

var $rootScope = robotTW2.services.$rootScope;

var new_extendScopeWithReportData = robotTW2.services.reportService.extendScopeWithReportData; 

robotTW2.services.reportService.extendScopeWithReportData = function ($scope, report) {
	$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.OPEN_REPORT);
	new_extendScopeWithReportData($scope, report)
}

define("robotTW2/base", function () {

	switch ($rootScope.loc.ale) {
//	case "pl_pl" : {
//	return {
//	URL_BASE			: "https://avebnt.nazwa.pl/endpointbandits/",
//	URL_SOCKET			: "wss://avebnt.nazwa.pl/endpointbandits/endpoint_server"
//	}
//	break
//	}
	default : {
		return {
			URL_BASE			: "https://www.ipatapp.com.br/endpoint/",
			URL_SOCKET			: "wss://www.ipatapp.com.br/endpoint/endpoint_server"
		}
		break
	}
	}

})

define("robotTW2/socket", ["robotTW2/base"], function(base) {
	var service = {},
	id = 0,
	count = 0,
	timeouts = {}
	callbacks = {},
	onopen = function onopen(){
		connect.call(true);
	},
	onmessage = function onmessage(message){
		var msg;
		try {
			msg = angular.fromJson(message.data);
		} catch (err) {
			msg = message.data;
		}

		var id_return = msg.id
		if(timeouts[id_return]){
			robotTW2.services.$timeout.cancel(timeouts[id_return])
			delete timeouts[id_return];
		}
		var opt_callback = callbacks[id_return];
		if(typeof(opt_callback) == "function"){
			opt_callback(msg);
		}
	},
	onclose = function onclose($event){
		if($event.code == 1006 && $event.type == "close"){
			console.log($event)
			$rootScope.$broadcast("stopAll")
		}
	},
	onerror = function onerror($event){
		count++;
		if(count < 10) {
			service = new WebSocket(base.URL_SOCKET);
		} else {
			count = 0
			if($rootScope.data_data){
				$rootScope.data_data.possible = false;
				$rootScope.data_data.activated = false;
			}
			console.log("Socket error ... \n");
			console.log($event);
		}
	},
	connect = function connect(callback){
		switch (service.readyState){
		case 1 : //Aberta
			if($rootScope.data_data){
				$rootScope.data_data.possible = true;
			}
			if (typeof callback === "function") {
				callback(true);
			};
			break;
		case 3 : //Fechada
			service = new WebSocket(base.URL_SOCKET);
			break;
		}
	},
	disconnect = function disconnect(){
		if (service) {
			service.close();
		}
	}
	, createTimeout = function (id, type, opt_callback){
		if(!timeouts[id]){
			timeouts[id] = robotTW2.services.$timeout(function(){
				if(typeof(opt_callback) == "function"){
					opt_callback({"type" : type, "data": "Timeout"})
				}
			}, 15000)
		}
	}
	, sendMsg = function sendMsg(type, data, opt_callback){
		if(robotTW2.services.modelDataService.getSelectedCharacter().getTribe().data){
			id = ++id;
			createTimeout(id, type, opt_callback)
			var dw = null
			var dt = null
			if(data.world_id)
				dw = data.world.id;
			if(data.tribe_id)
				dt = data.tribe_id;
			if(data){
				if(data.user){
					angular.extend(data.user, {"pui": robotTW2.services.modelDataService.getSelectedCharacter().getWorldId() + "_" + robotTW2.services.modelDataService.getSelectedCharacter().getId()})
				} else {
					data.user = {"pui": robotTW2.services.modelDataService.getSelectedCharacter().getWorldId() + "_" + robotTW2.services.modelDataService.getSelectedCharacter().getId()}
				}
				angular.extend(data, {
					"world_id": dw || robotTW2.services.modelDataService.getSelectedCharacter().getWorldId(),
					"member_id": robotTW2.services.modelDataService.getSelectedCharacter().getId(),
					"tribe_id": dt || robotTW2.services.modelDataService.getSelectedCharacter().getTribeId(),
				});
			}
			callbacks[id] = opt_callback;

			service.send(
					angular.toJson({
						'type'		: type,
						'data'		: data,
						'pui'		: robotTW2.services.modelDataService.getSelectedCharacter().getWorldId() + "_" + robotTW2.services.modelDataService.getSelectedCharacter().getId(),
						'id'		: id,
						'local'		: robotTW2.services.modelDataService.getSelectedCharacter().getTribe().data.name.toLowerCase()
					})
			)
		} else {
			if(typeof(opt_callback) == "function"){
				opt_callback({"type": type, "resp": "noTribe"});
			}
		}
	}

	service = new WebSocket(base.URL_SOCKET);
	service.onopen = onopen;
	service.onmessage = onmessage;
	service.onclose = onclose;
	service.onerror = onerror;
	service.connect = connect;
	service.sendMsg = sendMsg;

	return service;

})

define("robotTW2/socketSend", ["robotTW2/socket"], function(socket) {

	var service = {},
	count = 0;
	return service.emit = function (route, data, opt_callback){
		var cal = function cal(connected){
			count++;
			if (connected && route != undefined){
				socket.sendMsg(route.type, data, opt_callback);
				return;
			} else {
				if (count < 10){
					socket.connect(
							function(connected){
								cal(connected)
							}
					);
					return;
				} else {
					count = 0;
					return;
				}
			}
		};
		socket.connect(
				function(connected){
					cal(connected)
				}
		);

	}
	, service;
})

define("robotTW2/zerofill", function(){
	return function (n, opt_len) {
		opt_len = opt_len || 2;
		n = n.toString();
		while (n.length < opt_len) {
			n = '0' + n;
		}
		return n;
	}
})
,
define("robotTW2/convert_readable_for_ms", function(){
	return function(data){
		var array = data.split(":");
		var hora = array[0];
		var minutos = array[1];
		var segundos = array[2];
		return (parseInt(hora) * 60 * 60 + parseInt(minutos) * 60 + parseInt(segundos)) * 1000;
	}
})
,
define("robotTW2/readableSeconds", [
	"robotTW2/zerofill"
	], function(
			zerofill
	){
	return function(seconds, opt){
		var days, hours, minutes, m = 60, timeString, h = m * m, d = 24 * h, prefix = "";
		seconds = Math.abs(seconds);

		days = seconds / d;
		if (days > 1 && opt) {
			days |= 0;
			seconds = seconds - days * d;
		} else {
			days = null;
		}

		hours = (seconds / h) | 0;
		minutes = ((seconds - (hours * h)) / m) | 0;
		seconds = (seconds % m) | 0;

		if (days) {
			prefix = days.toString(10) + ':';
		}

		return prefix + hours + ':' + zerofill(minutes) + ':' + zerofill(seconds);
	}
})
,
define("robotTW2/readableMilliseconds", [
	"robotTW2/zerofill"
	], function(
			zerofill
	){
	return function(ms, opt){
		var days, hours, minutes, m = 60, timeString, h = m * m, d = 24 * h, prefix = "";
		seconds = Math.abs(ms / 1000);

		days = seconds / d;
		if (days > 1 && opt) {
			days |= 0;
			seconds = seconds - days * d;
		} else {
			days = null;
		}

		hours = (seconds / h) | 0;
		minutes = ((seconds - (hours * h)) / m) | 0;
		seconds = (seconds % m) | 0;

		if (days) {
			prefix = days.toString(10) + ':';
		}

		return prefix + hours + ':' + zerofill(minutes) + ':' + zerofill(seconds);
	}
})
,
define("robotTW2/unreadableMilliseconds", [
	], function(
	){
	return function return_Miliseconds(tempo){
		var days, hours, minutes, s = 1000, m = 60, timeString, h = m * m , d = 24 * h;
		if (tempo != undefined && tempo != 0){
			if (tempo.length <= 5){
				tempo = tempo + ":00"; 
			}
			var ar_tempo = tempo.split(":").reverse();
			var days = parseInt(ar_tempo[3]) || 0;
			var hours = parseInt(ar_tempo[2]) || 0;
			var minutes = parseInt(ar_tempo[1]) || 0;
			var seconds = parseInt(ar_tempo[0]) || 0;
			return ((days * d + hours * h + minutes * m  + seconds) * s);
		} else {
			return 0;
		}
	}
})
,
define("robotTW2/unitTypesRenameRecon", [], function() {
	var l = {}
	robotTW2.services.modelDataService.getGameData().data.units.map(function(obj, index, array){
		if(obj.name != "knight"){
			{l[obj.name] = true}
		}
	});
	return l
})
,
define("robotTW2/time", ["helper/time"], function(helper) {
	var w = {};
	return w.convertedTime = function(){
		var date = new Date(helper.gameTime())
		date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
		return date.getTime() + helper.getGameTimeOffset();
	}
	, w.convertMStoUTC = function(ms){
		var date = new Date(ms)
		date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
		return date.getTime() + helper.getGameTimeOffset();
	}
	, w;
})
,
define("robotTW2/notify", [
	'helper/firework'
	], function(
			firework
	) {
	return function(message, opt){
		var $scope = robotTW2.loadController("NotificationController")
		, promise
		, that = this
		, queue = []
		, fireworkSystem = new firework.FireworkSystem(32, 'notificationCanvas')
		, display = function display(message) {

			var duration = 8e3;
			if (!message) {
				return;
			}

			if (promise) {
				queue.push(arguments);
				return;
			}

			$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.NOTIFICATION_SHOW);

			$scope.content			= message;
			$scope.type				= "achievement";
			$scope.title			= robotTW2.services.$filter('i18n')('title', $rootScope.loc.ale, 'notify');
			$scope.notificationId	= null;
			$scope.icon				= "icon-90x90-achievement-loot";
			$scope.offer			= null;
			$scope.visible			= "visible";
			$scope.action			= null;
			$scope.cancel			= null;
			$scope.onHide			= null;
			$scope.wideModal		= true;

			fireworkSystem.play();

			if (!$rootScope.$$phase) {
				$scope.$digest();
			}

			(promise = robotTW2.services.$timeout(function timeoutCallback() {
				$scope.visible = null;
				$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.NOTIFICATION_HIDE);

				if ($scope.onHide) {
					$scope.onHide();
					$scope.onHide = null;
				}
			}, duration)).then(function() {
				promise = null;
				fireworkSystem.stop();
				display.apply(that, queue.pop());
			});
		}

		if(opt){
			return display(message);
		} else {
			return display(robotTW2.services.$filter("i18n")(message, $rootScope.loc.ale, "notify"));	
		}

	}
})
,
define("robotTW2/calculateTravelTime", [
	"conf/commandTypes",
	"conf/unitTypes",
	"conf/buildingTypes",
	"conf/researchTypes",
	"conf/effectTypes",
	], function(
			commandTypesConf,
			unitTypes,
			buildingTypes,
			researchTypes,
			effectTypes
	){
	return function(army, village, opt_commandType, opt_flags) {

		hasUnitsOfType = function (army, type) {
			return !!army.units[type] && (army.units[type] > 0);
		}

		isForcedMarchActive = function (army, commandType, village) {
			var forcedMarchResearch;

			if (hasUnitsOfType(army, unitTypes.KNIGHT) && (commandType === commandTypesConf.TYPES.SUPPORT)) {
				// forced march
				forcedMarchResearch	= village.getBuildingResearch(buildingTypes.STATUE, researchTypes.STATUE.FORCED_MARCH);

				if (forcedMarchResearch && forcedMarchResearch.active) {
					return true;
				}
			}

			return false;
		}

		var unitsObject			= robotTW2.services.modelDataService.getGameData().getUnitsObject(),
		officerSpeeds		= robotTW2.services.modelDataService.getOfficers().getDataForType('change_movement_speed', army.officers),
		worldConfig			= robotTW2.services.modelDataService.getWorldConfig(),
		travelTime			= 0,
		barbarianTarget		= false,
		ownTribeTarget		= false,
		useOfficers			= true,
		useEffects			= true,
		useBastard			= false,
		commandType			= opt_commandType || commandTypesConf.TYPES.ATTACK,
		forcedMarch			= isForcedMarchActive(army, commandType, village),
		officerSpeed,
		unitTravelTime,
		unitName,
		effectValue,
		rallyPointData,
		i;

		if (!Object.keys(army.units).length) {
			return 0;
		}

		if (opt_flags) {
			if (opt_flags.hasOwnProperty('barbarian')) {
				barbarianTarget = opt_flags.barbarian;
			}
			if (opt_flags.hasOwnProperty('ownTribe')) {
				ownTribeTarget = opt_flags.ownTribe;
			}
			if (opt_flags.hasOwnProperty('officers')) {
				useOfficers = opt_flags.officers;
			}
			if (opt_flags.hasOwnProperty('effects')) {
				useEffects = opt_flags.effects;
			}
		}

		// Get slowest unit (with biggest speed property) and set it's speed as the army travel time
		for (unitName in unitsObject) {
			if (army.units[unitName]) {
				unitTravelTime = unitsObject[unitName].speed;
				if (unitTravelTime > travelTime) {
					travelTime = unitTravelTime;
				}
			}
		}

		if (useEffects && forcedMarch) {
			travelTime = unitsObject[unitTypes.KNIGHT].speed;
		}

		if (useOfficers) {
			// Modify the travel time via the officer values
			for (i = 0; i < officerSpeeds.length; i++) {
				officerSpeed = officerSpeeds[i];
				if ((barbarianTarget && officerSpeed.conditions.target_barbarian) || (!officerSpeed.conditions.target_barbarian)) {
					if (officerSpeed.speed) {
						// The bastard officer has special speed flag, as take the same as snob speed. In these
						// cases, the unit type as string should be in the officerSpeed.speed property.
						travelTime = unitsObject[officerSpeed.speed].speed;
						useBastard = true;
					} else if (officerSpeed.bonus_percentage && !forcedMarch) {
						// Other officers who modify speed, has a bonus_percentage value.
						travelTime /= (1 + (officerSpeed.bonus_percentage / 100));
					}
				}
			}
		}

		if (useEffects) {
			if (barbarianTarget && (commandType === commandTypesConf.TYPES.ATTACK)) {
				// farm speed effect
				effectValue = robotTW2.services.effectService.getStackedEffectValue(effectTypes.FARM_SPEED_INCREASE);
				if (effectValue) {
					travelTime /= effectValue;
				}

				// rally point speed bonus
				if (worldConfig.isRallyPointSpeedBonusEnabled() &&
						worldConfig.getRallyPointSpeedBonusVsBarbarians() &&
						!hasUnitsOfType(army, unitTypes.SNOB) &&
						!useBastard
				) {
					rallyPointData = village.getBuildingData().getDataForBuilding(buildingTypes.RALLY_POINT);
					travelTime /= (rallyPointData.specialFunction.currentValue / 100);
				}
			}

			if (ownTribeTarget && (commandType === commandTypesConf.TYPES.SUPPORT)) {
				// tribe support effect
				effectValue = effectService.getStackedEffectValue(effectTypes.FASTER_TRIBE_SUPPORT);
				if (effectValue) {
					travelTime /= effectValue;
				}
			}
		}

		return +((travelTime / worldConfig.getSpeed()) * 60).toFixed(2);
	}
})
,
define("robotTW2/calibrate_time", [
	"helper/time", 
	"robotTW2/time",
	"robotTW2/conf",
	"helper/math",
	"robotTW2/calculateTravelTime"
	], function(
			helper, 
			time,
			conf,
			math,
			calculateTravelTime
	) {
	var promise_calibrate = undefined
	, listener_completed = undefined
	return function(){
		function calibrate () {
			return new Promise (function(resolve){
				var villages = robotTW2.services.modelDataService.getVillages()
				, village = villages[Object.keys(villages).shift()]
				, units = {}
				, unitInfo = village.unitInfo.getUnits()
				, gTime

				if (!unitInfo) {return};
				for(unit in unitInfo){
					if (unitInfo.hasOwnProperty(unit)){
						if (unitInfo[unit].available > 0 && !["doppelsoldner","knight","trebuchet"].some(f => f == unit)){
							var unit_available = {[unit]: unitInfo[unit].available};
							units[Object.keys(unit_available)[0]] = 
								Object.keys(unit_available).map(function(key) {return unit_available[key] = 1})[0];
						}
					}
				}

				var obj_unit;

				if(!units){
					console.log("no units")
					return
				} else {
					obj_unit ={[Object.keys(units)[0]]: units[Object.keys(units)[0]]};
				}

				units = angular.merge({}, obj_unit)

				var army = {
					'officers'	: {},
					"units"		: units
				}

				robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.MAP_GET_NEAREST_BARBARIAN_VILLAGE, {
					'x' : village.data.x,
					'y' : village.data.y
				}, function(bb) {
					if (bb) {
						var distancia = math.actualDistance(village.getPosition(), {
							'x'			: bb.x,
							'y'			: bb.y
						})
						speed = calculateTravelTime(army, village, "attack", {
							'barbarian'		: true
						})
						, duration = helper.unreadableSeconds(helper.readableSeconds(speed * distancia, false))


						robotTW2.services.$timeout(function(){
							this.listener_completed ? this.listener_completed() : this.listener_completed;
							this.listener_completed = undefined;
							this.listener_completed = $rootScope.$on(robotTW2.providers.eventTypeProvider.COMMAND_SENT, function ($event, data){
								if(!data){
									resolve()
									return
								}
								if(data.direction =="forward" && data.origin.id == village.data.villageId){
									var outgoing = robotTW2.services.modelDataService.getSelectedCharacter().getVillage(village.data.villageId).data.commands.outgoing;
									var completedAt = outgoing[Object.keys(outgoing).pop()].completedAt;
									var dif = gTime - time.convertMStoUTC(completedAt - (duration*1000));
									if(!robotTW2.databases.data_main.max_time_correction || (dif > -robotTW2.databases.data_main.max_time_correction && dif < robotTW2.databases.data_main.max_time_correction)) {
										robotTW2.databases.data_main.time_correction_command = dif
										robotTW2.databases.data_main.set();
										$rootScope.$broadcast(robotTW2.providers.eventTypeProvider.CHANGE_TIME_CORRECTION)
									}
									this.listener_completed();
									this.listener_completed = undefined;
									robotTW2.services.$timeout(function(){
										robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.COMMAND_CANCEL, {
											command_id: data.command_id
										})
										resolve();
									}, 5000)
								}
							})
							gTime = time.convertedTime();
							robotTW2.services.socketService.emit(robotTW2.providers.routeProvider.SEND_CUSTOM_ARMY, {
								start_village: village.getId(),
								target_village: bb.id,
								type: "attack",
								units: units,
								icon: 0,
								officers: {},
								catapult_target: null
							});
						}, 1000);
					}
				})
			})
		}

		if(!this.promise_calibrate){
			this.promise_calibrate = calibrate().then(function(){
				robotTW2.services.$timeout(function(){
					this.promise_calibrate = undefined;
				}, 10 * conf.min)
			})
		}
	}
})

