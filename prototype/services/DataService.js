define("robotTW2/services/DataService", [
	"robotTW2",
	"robotTW2/version",
	"robotTW2/conf",
	"conf/conf",
	"robotTW2/socketSend",
	"robotTW2/time"
	], function(
			robotTW2,
			version,
			conf,
			conf_conf,
			socketSend,
			convertedTime
	){
	return (function DataService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			$filter,
			ready
	) {
		var isInitialized = !1
		, isRunning = !1
		, interval_data = null
		, grid_queue = []
		, countVillages = 0
		, promise_grid = undefined
		, setupGrid = function (t_ciclo_x, t_ciclo_y) {
			var i
			, t = 0
			, arr_x = []
			, arr_y = [];

			for (i = 0; i < t_ciclo_x; i++) {
				arr_x[i] = null
			}

			for (i = 0; i < t_ciclo_y; i++) {
				arr_y[i] = null
			}

			return arr_x.concat().map(function (elem) {
				return arr_y.concat()
			});
		}
		, loadMap = function (x_min, x_max, y_min, y_max) {
			countVillages = 0;
			var dist_x = Math.abs(x_max - x_min);
			var dist_y = Math.abs(y_max - y_min);
			var ciclos_x = 0;
			var ciclos_y = 0;

			Math.trunc(dist_x / conf.MAP_CHUNCK_LEN) / (dist_x / conf.MAP_CHUNCK_LEN) < 1 ? ciclos_x = Math.trunc(dist_x / conf.MAP_CHUNCK_LEN) + 1 : ciclos_x = Math.trunc(dist_x / conf.MAP_CHUNCK_LEN);
			Math.trunc(dist_y / conf.MAP_CHUNCK_LEN) / (dist_y / conf.MAP_CHUNCK_LEN) < 1 ? ciclos_y = Math.trunc(dist_y / conf.MAP_CHUNCK_LEN) + 1 : ciclos_y = Math.trunc(dist_y / conf.MAP_CHUNCK_LEN);

			var t_ciclo_x = 0;
			if (ciclos_x % 2 < 1) {
				t_ciclo_x = ciclos_x + 1;
			} else {
				t_ciclo_x = ciclos_x;
			}
			var t_ciclo_y = 0;
			if (ciclos_y % 2 < 1) {
				t_ciclo_y = ciclos_y + 1;
			} else {
				t_ciclo_y = ciclos_y;
			}

			var map_chunk_size_x = Math.round(dist_x / t_ciclo_x);
			var map_chunk_size_y = Math.round(dist_y / t_ciclo_y);

			var grid = setupGrid(t_ciclo_x, t_ciclo_y);
			for (var i = 0; i < t_ciclo_x; i++) {
				for (var j = 0; j < t_ciclo_y; j++) {
					grid[i][j] = {"x":x_min + map_chunk_size_x * i, "y":y_min + map_chunk_size_y * j, "dist_x": map_chunk_size_x, "dist_y": map_chunk_size_y};
					grid[i][j].villages = [];
				};
			};
			return {
				grid: grid
			};
		}
		, upInterval = function(){
			updateVillages();
			isRunning = !0,
			interval_data = setInterval(function(){
				updateVillages();
				return;
			}, $rootScope.data_data.interval)
		}
		, villagesCheckTimer = (function (){
			var interval,
			w = {};
			return w.init = function() {
				$rootScope.data_data.complete = convertedTime() + $rootScope.data_data.interval ;
				$rootScope.data_data.logs = [];
				if($rootScope.data_data.last_update + $rootScope.data_data.interval < convertedTime() && $rootScope.data_data.auto_initialize){
					upInterval()
				} else if($rootScope.data_data.last_update < convertedTime()){
					upInterval()
				}
			}
			,
			w.stop = function() {
				isRunning = !1;
				clearInterval(interval_data);
				interval_data = undefined;
			}
			,
			w.isInitialized = function() {
				return isRunning
			}
			,
			w
		})()
		, loadVillagesWorld = function(listaGrid) {
			var t = undefined
			, promise_send = undefined
			, send_queue = []
			, sendVillage = function (village, callback){
				if(!isRunning()) return
				socketSend.emit(providers.routeProvider.UPDATE_VILLAGE, {village:village}, function(resp){
					if (resp.data.updated && resp.type == providers.routeProvider.UPDATE_VILLAGE.type){
						console.log("aldeia " + countVillages + " enviada");
					} else {
						console.log("aldeia " + countVillages + " enviada com erro");
					}
					countVillages++;
					callback();
				});
				return;
			}
			, socketGetVillages = function (reg, callbackSocket){
				if(!isRunning()) return
				console.log("Buscando " + reg.x + "/" + reg.y);
				$rootScope.data_data.logs.push({"text":$filter("i18n")("text_search", $rootScope.loc.ale, "data") + reg.x + "/" + reg.y, "date": convertedTime()})
				if(!$rootScope.data_data.logs) $rootScope.data_data.logs = [];
				t = $timeout(function(){
					$rootScope.data_data.logs.push({"text":$filter("i18n")("text_timeout", $rootScope.loc.ale, "data") + reg.x + "/" + reg.y, "date": convertedTime()})
					callbackSocket();
				}, conf_conf.LOADING_TIMEOUT);

				socketService.emit(providers.routeProvider.MAP_GETVILLAGES,{x:reg.x, y:reg.y, width: reg.dist_x, height: reg.dist_y}, function(data){
					var lista_barbaras = [];
					if (data.error_code == "INTERNAL_ERROR"){
						console.log("Error internal x " + x + " / y " + y);
						$rootScope.data_data.logs.push({"text":$filter("i18n")("text_err", $rootScope.loc.ale, "data") + reg.x + "/" + reg.y, "date": convertedTime()})
						callbackSocket();
					} else {
						if (data != undefined && data.villages != undefined && data.villages.length > 0){
							var villages = data.villages || [];

							villages.forEach(function(village){
								function s(village){
									if(!promise_send){
										promise_send = new Promise(function(res){
											sendVillage(village, res);
										})
										.then(function(){
											if(send_queue.length){
												s(send_queue.shift())
											} else {
												callbackSocket();
											}
										})
									} else {
										send_queue.push(village)
									}
								}
								s(village)
							})


						} else {
							callbackSocket();
						}
					}
				});
			};

			var exec_promise_grid = function (reg){
				promise_grid = new Promise(function(resolve){
					socketGetVillages(reg, resolve);
				})
				.then(function(){
					$timeout.cancel(t);
					t = undefined;

					promise_grid = undefined
					if(grid_queue.length){
						var reg = grid_queue.shift();
						exec_promise_grid(reg)
					} else {
						$rootScope.data_data.logs.push({"text":$filter("i18n")("text_completed", $rootScope.loc.ale, "data") + reg.x + "/" + reg.y, "date": convertedTime()})
						$rootScope.data_data.last_update = new date().getTime();
						if (!villagesCheckTimer.isInitialized()) {
							villagesCheckTimer.init();
						}
						return;
//						res()
					}
				})

			}

			listaGrid.forEach(function(reg){
				if(promise_grid){
					grid_queue.push(reg)
				} else {
					exec_promise_grid(reg)
				}
			})

		}
		, updateVillages = function(){
			var grid = loadMap(400, 500, 400 ,500).grid;
			var listaGrid = [];
			var l = Object.keys(grid).length;
			for(tx = 0; tx < l; tx++) {
				for(ty = 0; ty < l; ty++) {
					listaGrid.push({
						x			: grid[tx][ty].x,
						y			: grid[tx][ty].y,
						dist_x		: grid[tx][ty].dist_x,
						dist_y		: grid[tx][ty].dist_y
					});
				}
			};

			loadVillagesWorld(listaGrid)
		}
		, init = function (bool) {
			isInitialized = !0
			if(bool){return}
			start();
		}
		, start = function (){
			if(isRunning){return}
			ready(function(){
				if (!villagesCheckTimer.isInitialized()){
					villagesCheckTimer.init();
				};
			}, ["all_villages_ready"])
		}
		, stop = function (){
			$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, {name:"DATA"})
			villagesCheckTimer.stop()
		}
		return	{
			init			: init,
			start 			: start,
			stop 			: stop,
			isRunning		: function() {
				return isRunning
			},
			isInitialized	: function(){
				return isInitialized
			},
			version			: version.data,
			name			: "data"
		}
	})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.services.$filter,
			robotTW2.ready
	)
})
