define("robotTW2/alert", [
	"robotTW2/data_alert",
	"robotTW2/services",
	"robotTW2/providers"
	], function(
			data_alert,
			services,
			providers
	){
	var isInitialized = !1
	, isRunning = !1
	, interval_alert = null
	, listener_alert_ready = undefined
	, listener_tab_alert = undefined
	, notifyAttacks = function() {
		$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: "Jogadores sob ataque!"})
	}
	, verify_alert = function(){
		try {
			services.socketService.emit(providers.routeProvider.TRIBE_GET_MEMBERLIST, {'tribe': services.modelDataService.getSelectedCharacter().getTribeId()}, function (o) {
				services.$timeout(_ => {
					var friends = data_alert.getFriends();
					if (o.members != undefined){
						if (o.members.filter(f => f.under_attack && friends.some(s => s === f.name)).length) {
							notifyAttacks();
						}
					}
					wait();
				}, 2000);
			});
		} catch (Error){
			wait();
			$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: "Erro ao carregar dados dos membros da tribo"})
		}
	}
	, wait = function(){
		if(!interval_alert){
			interval_alert = services.$timeout(verify_alert, data_alert.getTimeCicle())
		} else {
			services.$timeout.cancel(interval_alert);
			interval_alert = services.$timeout(verify_alert, data_alert.getTimeCicle())
		}
	}
	, init = function (){
		isInitialized = !0
		start();
	}
	, start = function (){
		if(isRunning){return} 
		isRunning = !0;
		verify_alert();
	}
	, stop = function (){
		isRunning = !1;
		typeof(listener_tab_alert) == "function" ? listener_tab_alert(): null;
		listener_tab_alert = undefined;
		services.$timeout.cancel(interval_alert);
		interval_alert = undefined;
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
		version			: "1.0.0",
		name			: "alert"
	}

})
,
define("robotTW2/alert/ui", [
	"robotTW2/alert",
	"robotTW2/builderWindow",
	"robotTW2/services",
	"robotTW2/providers",
	"robotTW2/data_alert",
	"helper/time",
	"robotTW2/conf"
	], function(
			alert,
			builderWindow,
			services,
			providers,
			data_alert,
			helper,
			conf
	){
	var $window
	, build = function(callback) {
		var hotkey = conf.HOTKEY.ALERT;
		var templateName = "alert";
		$window = new builderWindow(hotkey, templateName, callback)
		return $window
	}
	, injectScope = function() {

		var getMembers = function(callback){
			return new Promise(function(resolve, reject){
				try {
					services.socketService.emit(providers.routeProvider.TRIBE_GET_MEMBERLIST, {'tribe': services.modelDataService.getSelectedCharacter().getTribeId()}, function (o) {
						services.$timeout(_ => {
							if (o){
								resolve(o) 
							} else {
								reject();
							}
						}, 2000);
					});
				} catch (Error){
					reject(Error);
				}	
			})
			.then(function(data){
				if(data.members){
					callback(data.members);
				} else {
					callback({})
				}
			}, function(reason) {
				$rootScope.$broadcast(providers.eventTypeProvider.MESSAGE_ERROR, {message: "Erro ao carregar dados dos membros da tribo"})
				callback({})
				//console.log(reason); // Error!
			});

		}
		, getTribeName = function(member_id){
			return services.modelDataService.getSelectedCharacter(member_id).getTribe().data.name
		}
		, getUnderAttack = function(members){
			$scope.friends = data_alert.getFriends();
			return members.map(function(member){
				return member.under_attack && $scope.friends.some(s => s === member.name) ? member : undefined;
			}).filter(f=>f!=undefined)
		}
		, getFriends = function(members){
			$scope.friends = data_alert.getFriends();
			members.map(function(member){
				if($scope.friends.find(f => f === member.name)){
					member.isFriend = true;
				} else {
					member.isFriend = false;
				}
			})
			return members
		}
		, upDate = function(members){
			$scope.members = getFriends(members)
			$scope.underattack = getUnderAttack($scope.members);
			if (!$rootScope.$$phase) {
				$rootScope.$apply();
			}
		}


		var $scope = $window.$data.scope;
		$scope.title = services.$filter("i18n")("title", $rootScope.loc.ale, "alert");
		$scope.introducing = services.$filter("i18n")("introducing", $rootScope.loc.ale, "alert");
		$scope.init_standard = services.$filter("i18n")("init_standard", $rootScope.loc.ale, "alert");
		$scope.text_member = services.$filter("i18n")("text_member", $rootScope.loc.ale, "alert");
		$scope.text_points = services.$filter("i18n")("text_points", $rootScope.loc.ale, "alert");
		$scope.text_underattack = services.$filter("i18n")("text_underattack", $rootScope.loc.ale, "alert");
		$scope.text_villages = services.$filter("i18n")("text_villages", $rootScope.loc.ale, "alert");
		$scope.text_ranking = services.$filter("i18n")("text_ranking", $rootScope.loc.ale, "alert");
		$scope.state = services.$filter("i18n")("state", $rootScope.loc.ale, "alert");
		$scope.settings_for_member = services.$filter("i18n")("settings_for_member", $rootScope.loc.ale, "alert");
		$scope.save = services.$filter("i18n")("SAVE", $rootScope.loc.ale);
		$scope.close = services.$filter("i18n")("CLOSE", $rootScope.loc.ale);
		$scope.restore = services.$filter("i18n")("RESTORE", $rootScope.loc.ale);
		$scope.start = services.$filter("i18n")("START", $rootScope.loc.ale);
		$scope.stop = services.$filter("i18n")("STOP", $rootScope.loc.ale);
		$scope.data_alert = data_alert.getAlert();

		$window.$data.ativate = $scope.data_alert.ATIVATE;

		$scope.friends = data_alert.getFriends();

		$scope.underattack = [];

		getMembers(function(members){
			$scope.members = members
			upDate($scope.members)
		});

		$scope.getTribeName = getTribeName;

		$scope.remove = function(name){
			$scope.friends = $scope.friends.filter(f => f != name);
			data_alert.setFriends($scope.friends);
			upDate($scope.members)
		}

		$scope.toggleValue = function(member){
			if(member.isFriend){
				$scope.friends.push(member.name)
			} else {
				$scope.friends = $scope.friends.filter(f => f !== member.name);
			}
			data_alert.setFriends($scope.friends);
			upDate($scope.members)
		}

		$scope.interval_alert = helper.readableMilliseconds(data_alert.getTimeCicle())

		if (!$rootScope.$$phase) {
			$rootScope.$apply();
		}

		services.$timeout(function(){
			$window.setCollapse();
			$window.recalcScrollbar();
		}, 500)

	}

	Object.setPrototypeOf(alert, {
		build : function(){
			build(injectScope)
		}
	})
})
