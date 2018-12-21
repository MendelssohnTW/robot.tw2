define([
	"app.services",
	"base"
	], function (
			services,
			base
	) {	
	services.factory("socket", [
		"$rootScope",
		"conf",
		function socket(
				$rootScope,
				conf
		){
			var service = {},
			id = 0,
			callbacks = {},
			onopen = function onopen(){
				connect.call(true);
			},
			onmessage = function onmessage(message){
				var msg = angular.fromJson(message.data);
				var id_return = msg.id
				var opt_callback = callbacks[id_return];
				opt_callback(msg);
			},
			onclose = function onclose(){
			},
			onerror = function onerror(){
				console.log("Socket error ... \n");
			},
			connect = function connect(callback){
				switch (service.readyState){
				case 1 :{ //Aberta
					if (typeof callback === "function") {
						callback(true);
					};
					break;
				}
				case 3 :{ //Fechada
					service = new WebSocket(base.URL_SOCKET);
					connect.call = callback;
					break
				}
				default:{
					connect.call = callback;
				}
				}
			},
			disconnect = function disconnect(){
				if (service) {
					service.close();
				}
			},
			sendMsg = function sendMsg(type, data, role, opt_callback){
				var dw = null
				var dt = null
				if(data.world)
					dw = data.world.id;
				if(data.tribe)
					dt = data.tribe.id;
				angular.extend(data, {
					"world_id": conf.USER.world_id || dw,
					"character_id": conf.USER.character_id,
					"tribe_id": conf.USER.tribe_id || dt,
				}
				)

				id = ++id;
				callbacks[id] = opt_callback;
				service.send(
						angular.toJson({
							'type'		: type,
							'data'		: data,
							'role'		: role,
							'id'		: id
						})
				)	
			};

			service 				= new WebSocket(base.URL_SOCKET);
			service.onopen			= onopen;
			service.onmessage 		= onmessage;
			service.onclose 		= onclose;
			service.onerror 		= onerror;
			service.connect 		= connect;
			service.sendMsg 		= sendMsg;

			return service;

		}])
});