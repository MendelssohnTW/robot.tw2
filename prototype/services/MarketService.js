define("robotTW2/CommandMarket", [
], function () {
	return {}
})

define("robotTW2/services/MarketService", [
	"robotTW2",
	"robotTW2/time",
	"helper/time",
	"robotTW2/conf",
	"robotTW2/databases/data_market",
	"robotTW2/CommandMarket"
], function (
	robotTW2,
	time,
	helper,
	conf,
	data_market,
	commandMarket
) {
		return (function MarketService(
			$rootScope,
			socketService,
			providers,
			modelDataService,
			$timeout,
			commandQueue,
			ready,
			loadScript,
			loadController
		) {

			var isInitialized = !1
				, isRunning = !1
				, isPaused = !1
				, interval_market = undefined
				, listener_open = undefined
				, listener_close = undefined
				, listener_layout = undefined
				, interval_handler = undefined
				, list = []
				, setList = function (callback) {
					list.push(conf.INTERVAL.MARKET)
					data_market.interval < conf.MIN_INTERVAL ? list.push(conf.MIN_INTERVAL) : list.push(data_market.interval)
					var t = Math.min.apply(null, list)
					data_market.interval = t
					data_market.complete = time.convertedTime() + t
					list = [];
					data_market.set();
					$rootScope.$broadcast(providers.eventTypeProvider.INTERVAL_CHANGE, { name: "MARKET" })
					if (callback && typeof (callback) == "function") { callback(t) }
				}
				, wait = function () {
					setList(function (tm) {
						if (!interval_market) {
							interval_market = $timeout(function () {

							}, tm)
						} else {
							$timeout.cancel(interval_market);
							interval_market = undefined;
							interval_market = $timeout(function () {

							}, tm)
						}
					});
				}
				, sendResources = function (params) {
					if (params.wood === 0 && params.clay === 0 && params.iron === 0) {
						return;
					}

					var total_resources = params.wood + params.clay + params.iron

					socketService.emit(providers.routeProvider.TRADING_GET_MERCHANT_STATUS, {
						'village_id': params.start_village
					}, function (data) {
						let merchants_free = data.free
							, maxCapacity = merchants_free * 1000

						if (total_resources < maxCapacity) {
							socketService.emit(providers.routeProvider.TRADING_SEND_RESOURCES, {
								'start_village': params.start_village,
								'target_village': params.target_village,
								'wood': params.wood,
								'clay': params.clay,
								'iron': params.iron
							}, function () {

							});
						}
					})
				}
				, sendInterval = function (params) {
					let village = modelDataService.getSelectedCharacter().getVillage(params.start_village)
						, resources = village.getResources().getResources()
					params.wood = params.wood.bound(0, resources.wood)
					params.clay = params.clay.bound(0, resources.clay)
					params.iron = params.iron.bound(0, resources.iron)
					sendResources(params)
					return setInterval(function () {
						sendResources(params)
					}, params.milisegundos_duracao)
				}
				, addMarket = function (params, opt_id) {
					if (!params) { return }
					var id_command = params.start_village.toString() + params.target_village.toString();
					if (opt_id) {
						id_command = params.id_command
					}
					if (!commandMarket[id_command]) {
						commandQueue.bind(id_command, sendInterval, data_market, params, function (fns) {
							commandMarket[fns.params.id_command] = {
								"interval": fns.fn.apply(this, [fns.params]),
								"params": params
							}
						})
					}
				}
				, sendCommandMarket = function (scp) {
					if (scp.merchants.free === 0 || (scp.rangeSlider.wood.value === 0 && scp.rangeSlider.clay.value === 0 && scp.rangeSlider.iron.value === 0)) {
						return;
					}
					var params = {
						'id_command': scp.startId.toString() + scp.targetId.toString(),
						'milisegundos_duracao': (scp.milisegundos_duracao * 2) + 10000,
						'type': "market",
						'start_village': scp.startId,
						'distance': scp.distance,
						'target_village': scp.targetId,
						'target_name': scp.targetVillage,
						'target_x': scp.targetX,
						'target_y': scp.targetY,
						'wood': scp.rangeSlider.wood.value,
						'clay': scp.rangeSlider.clay.value,
						'iron': scp.rangeSlider.iron.value
					}
					addMarket(params, true);
				}
				, removeCommandMarket = function (id_command) {
					if (commandMarket[id_command].interval) {
						clearInterval(commandMarket[id_command].interval)
						delete commandMarket[id_command];
					}
					commandQueue.unbind(id_command, data_market)
				}
				, removeAll = function () {
					Object.keys(commandMarket).map(function (elem) {
						if (commandMarket[elem].interval) {
							clearInterval(commandMarket[elem].interval)
							delete commandMarket[elem];
						}
					})
					commandQueue.unbindAll("market", data_market)
				}
				, init = function () {
					isInitialized = !0
					start();
				}
				, start = function () {
					if (isRunning) { return }
					ready(function () {
						var open = false;
						isRunning = !0;
						loadScript("/controllers/MarketCompletionController.js");
						listener_open = $rootScope.$on("open_get_selected_village_market", function () { open = true })
						listener_close = $rootScope.$on("close_get_selected_village_market", function () { open = false })
						interval_handler = setInterval(function () {
							var ModalSendResourcesController = loadController("ModalSendResourcesController")
							if (!open && ModalSendResourcesController) {
								$rootScope.$broadcast("get_selected_village_market")
							}
						}, 1000);
						if (!data_market.commands) { data_market.commands = {} }
						Object.values(data_market.commands).forEach(function (param) {
							addMarket(param, true);
						})
						$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "MARKET" })
					}, ["all_villages_ready"])
				}
				, stop = function () {
					robotTW2.removeScript("/controllers/MarketCompletionController.js");

					typeof (listener_open) == "function" ? listener_open() : null;
					typeof (listener_close) == "function" ? listener_close() : null;
					typeof (listener_layout) == "function" ? listener_layout() : null;
					listener_layout = undefined;
					listener_open = undefined;
					listener_close = undefined;
					clearInterval(interval_handler)
					interval_handler = undefined;
					isRunning = !1
					$rootScope.$broadcast(providers.eventTypeProvider.ISRUNNING_CHANGE, { name: "MARKET" })
					$timeout.cancel(interval_market);
					interval_market = undefined;
				}
				, setListener = function (listener) {
					!listener_layout ? listener_layout = listener : null
				}

			return {
				init: init,
				start: start,
				stop: stop,
				sendCommandMarket: sendCommandMarket,
				removeCommandMarket: removeCommandMarket,
				removeAll: removeAll,
				setListener: setListener,
				isRunning: function () {
					return isRunning
				},
				isPaused: function () {
					return isPaused
				},
				isInitialized: function () {
					return isInitialized
				},
				version: conf.VERSION.MARKET,
				name: "market"
			}

		})(
			robotTW2.services.$rootScope,
			robotTW2.services.socketService,
			robotTW2.providers,
			robotTW2.services.modelDataService,
			robotTW2.services.$timeout,
			robotTW2.commandQueue,
			robotTW2.ready,
			robotTW2.loadScript,
			robotTW2.loadController
		)
	})
