define("robotTW2/services/VillService", [
	"robotTW2",
	"robotTW2/conf",
	"robotTW2/databases/data_alert",
	"robotTW2/databases/data_villages",
	"helper/format"
], function (
	robotTW2,
	conf,
	data_alert,
	data_villages,
	formatHelper
) {
		return (function VillService(
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
				, getVillage = function getVillage(vid) {
					if (!vid) { return }
					return angular.copy(modelDataService.getSelectedCharacter().getVillage(vid))
				}
				, setVillage = function setVillage(village) {
					if (!village) { return }
					return angular.copy(modelDataService.getSelectedCharacter().setSelectedVillage(village))
				}
				, getLocalVillages = function getLocalVillages(type, type_sort) {
					let str = undefined
						, local_data_villages = []
					switch (type) {
						case "defense":
							str = "defense_activate"
							break;
						case "recruit":
							str = "recruit_activate"
							break;
						default:
							str = undefined
							break;
					}
					Object.keys(data_villages.villages).map(function (key) {
						var vill = getVillage(key);
						if (!vill || !vill.data) {
							delete data_villages.villages[key]
							data_villages.set()
						}
						local_data_villages.push({
							id: key,
							name: vill.data.name,
							label: formatHelper.villageNameWithCoordinates(vill.data),
							value: data_villages.villages[key][str] || data_villages.villages[key],
							spies: vill.getScoutingInfo().getNumAvailableSpies(),
							x: vill.data.x,
							y: vill.data.y,
							units: vill.getUnitInfo().getUnits()
						})
						if (typeof (type_sort) == "string") {
							local_data_villages.sort(function (a, b) { return a[type_sort].localeCompare(b[type_sort]) })
						}
					})
					return local_data_villages;
				}
				, init = function () {
					isInitialized = !0
					start();
				}
				, start = function () {
					if (isRunning) { return }
					ready(function () {
						isRunning = !0;
					}, ["all_villages_ready"])
				}
				, stop = function () {
					isRunning = !1;
				}

			init()

			return {
				init: init,
				start: start,
				getVillage: getVillage,
				setVillage: setVillage,
				getLocalVillages: getLocalVillages,
				stop: stop,
				isRunning: function () {
					return isRunning
				},
				isInitialized: function () {
					return isInitialized
				},
				name: "village"
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