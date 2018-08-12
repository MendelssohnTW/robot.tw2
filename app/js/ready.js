define("robotTW2/ready", [
	"conf/gameStates",
	"robotTW2/services",
	"robotTW2/providers",
	"angular"
	], function(
			gameStates,
			services,
			providers,
			angular
	){
	
	return function(opt_callback, array_keys) {
		array_keys = array_keys || ["map"];
		var callback = function(key){
			array_keys = array_keys.filter(function(opt_key) {
				return opt_key !== key
			}),
			array_keys.length || opt_callback()
		}
		, obj_keys = {
				map: function() {
					var src = document.querySelector("#map");
					if (angular.element(src).scope().isInitialized)
						return callback("map");
					$rootScope.$on(providers.eventTypeProvider.MAP_INITIALIZED, function() {
						callback("map")
					})
				},
				tribe_relations: function() {
					var character = services.modelDataServiservicesce.getSelectedCharacter();
					if (character) {
						var tribe_relations = character.getTribeRelations();
						if (!character.getTribeId() || tribe_relations)
							return callback("tribe_relations")
					}
					var listener_tribe_relations = $rootScope.$on(providers.eventTypeProvider.TRIBE_RELATION_LIST, function() {
						listener_tribe_relations(),
						callback("tribe_relations")
					})
				},
				initial_village: function() {
					if (services.modelDataService.getGameState().getGameState(gameStates.INITIAL_VILLAGE_READY))
						return callback("initial_village");
					$rootScope.$on(providers.eventTypeProvider.GAME_STATE_INITIAL_VILLAGE_READY, function() {
						callback("initial_village")
					})
				},
				all_villages_ready: function() {
					if (services.modelDataService.getGameState().getGameState(gameStates.ALL_VILLAGES_READY))
						return callback("all_villages_ready");
					$rootScope.$on(providers.eventTypeProvider.GAME_STATE_ALL_VILLAGES_READY, function() {
						callback("all_villages_ready")
					})
				}
		};
		array_keys.forEach(function(key) {
			obj_keys[key]()
		})
	}
})