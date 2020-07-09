define("robotTW2/controllers/AlertController", [
	"robotTW2/services",
	"robotTW2/providers",
	"helper/time",
	"robotTW2/unreadableSeconds",
	"robotTW2/databases/data_alert",
], function (
	services,
	providers,
	helper,
	unreadableSeconds,
	data_alert
) {
		return function AlertController($scope) {
			$scope.CLOSE = services.$filter("i18n")("CLOSE", services.$rootScope.loc.ale);
			$scope.MENU = services.$filter("i18n")("MENU", services.$rootScope.loc.ale);
			$scope.version = services.$filter("i18n")("version", services.$rootScope.loc.ale);
			$scope.data_alert = data_alert;
			$scope.text_version = $scope.version + " " + $scope.data_alert.version;
			var self = this;

			var getMembers = function (callback) {
				return new Promise(function (resolve, reject) {
					try {
						services.socketService.emit(providers.routeProvider.TRIBE_GET_MEMBERLIST, { 'tribe': services.modelDataService.getSelectedCharacter().getTribeId() }, function (o) {
							services.$timeout(_ => {
								if (o) {
									resolve(o)
								} else {
									reject();
								}
							}, 2000);
						});
					} catch (Error) {
						reject(Error);
					}
				})
					.then(function (data) {
						if (data.members) {
							$scope.members = data.members;
						} else {
							!$scope.members ? $scope.members = {} : $scope.members;
						}
						$scope.recalcScrollbar()
						$scope.setCollapse()

						upDate()
					}, function (reason) {
						services.$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, { message: "Erro ao carregar dados dos membros da tribo" })
						!$scope.members ? $scope.members = {} : $scope.members;
						upDate()
						//console.log(reason); // Error!
					});

			}
				//		, getTribeName = function(member_id){
				//			return services.modelDataService.getSelectedCharacter(member_id).getTribe().data.name
				//		}
				, upDate = function () {
					$scope.members = $scope.members.map(function (member) {
						if ($scope.data_alert.friends.find(f => f === member.name)) {
							member.isFriend = true;
						} else {
							member.isFriend = false;
						}
						return member
					})
					$scope.underattack = $scope.members.map(function (member) {
						return member.under_attack && $scope.data_alert.friends.some(s => s === member.name) ? member : undefined;
					}).filter(f => f != undefined)
					if (!$scope.$$phase) $scope.$apply();
				}

			$scope.underattack = [];

			getMembers();

			//		$scope.getTribeName = getTribeName;

			$scope.set = function (interval_alert) {
				if (interval_alert.length <= 5) {
					interval_alert = interval_alert + ":00"
				}
				if (unreadableSeconds(interval_alert) * 1e3 > 30 * 60 * 1000) {
					$scope.data_alert.interval = 30 * 60 * 1000
					$scope.interval_alert = 30 * 60 * 1000;
				} else if (unreadableSeconds(interval_alert) * 1e3 < 5 * 60 * 1000) {
					$scope.data_alert.interval = 5 * 60 * 1000
					$scope.interval_alert = 5 * 60 * 1000;
				} else {
					$scope.data_alert.interval = unreadableSeconds(interval_alert) * 1e3
					$scope.interval_alert = interval_alert;
				}
				document.getElementById("input-text-time-interval").value = $scope.interval_alert;
				if (!$scope.$$phase) $scope.$apply();

			}

			$scope.selectAll = function () {
				$scope.members.forEach(function (member) {
					member.isFriend = true;
					if (!$scope.data_alert.friends.find(f => f == member.name)) {
						$scope.data_alert.friends.push(member.name)
					}
				})

				upDate()
			}

			$scope.removeAll = function () {
				$scope.members.forEach(function (member) {
					member.isFriend = false;
				})
				$scope.data_alert.friends = [];
				upDate()
			}

			$scope.remove = function (name) {
				$scope.data_alert.friends = $scope.data_alert.friends.filter(f => f != name);
				upDate()
			}

			$scope.toggleValue = function (member) {
				if (member.isFriend) {
					$scope.data_alert.friends.push(member.name)

				} else {
					$scope.data_alert.friends = $scope.data_alert.friends.filter(f => f !== member.name);
				}
				upDate()
			}

			$scope.menu = function () {
				services.$rootScope.$broadcast(providers.eventTypeProvider.OPEN_MAIN);
			}

			$scope.$on(providers.eventTypeProvider.ISRUNNING_CHANGE, function ($event, data) {
				if (!data || data.name != "ALERT") { return }
				$scope.isRunning = services.AlertService.isRunning();
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			})

			$scope.$watch("data_alert", function () {
				if (!$scope.data_alert) { return }
				data_alert = $scope.data_alert;
				data_alert.set();
			}, true)

			$scope.interval_alert = helper.readableMilliseconds($scope.data_alert.interval)

			$scope.setCollapse();

			return $scope;
		}
	})