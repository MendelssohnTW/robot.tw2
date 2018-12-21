define([
	"app.providers"
	], function (
			providers
	) {	
	providers.factory("routeProvider", function routeProvider(){
		var routes = {
				'LOGIN':{
					type:"login",
					data:["user", "world_id"]
				},
				'UPDATE_LOGIN':{
					type:"update_login",
					data:["user", "world_id"]
				},
				'REGISTER':{
					type:"register",
					data:["user"]
				},
				'SEARCH_WORLDS':{
					type:"search_worlds",
					data:[]
				},
				'SEARCH_WORLD':{
					type:"search_world",
					data:["world_id"]
				},
				'SEARCH_TRIBE':{
					type:"search_tribe",
					data:["character_id", "world_id"]
				},
				'SEARCH_TRIBES_FOR_WORLD':{
					type:"search_tribes_for_world",
					data:["world_id"]
				},
				'SEARCH_CHARACTERS':{
					type:"search_characters",
					data:["tribe_id", "world_id"] //tribe.id
				},
				'SEARCH_CHARACTER':{
					type:"search_character",
					data:["character_id"] //character.id
				},
				'SEARCH_ALL_VILLAGES':{
					type:"search_all_villages",
					data:[""]
				},
				'SEARCH_VILLAGES_FOR_TRIBE':{
					type:"search_villages_for_tribe",
					data:["tribe_id"] //tribe.id
				},
				'SEARCH_VILLAGES_FOR_CHARACTER':{
					type:"search_villages_for_character",
					data:["character_id"] //character.id
				},
				'SEARCH_MAX_VILLAGE_FOR_CHARACTER':{
					type:"search_max_village_for_character",
					data:["character_id"] //character.id
				},
				'SEARCH_ALL_VILLAGES_FOR_COORDS':{
					type:"search_all_villages_for_coords",
					data:["coords"]
				},
				'SEARCH_ALL_VILLAGES_FOR_BLOCK':{
					type:"search_all_villages_for_block",
					data:["coord", "world_id"]
				},
				'SEARCH_NICKNAME':{
					type:"search_nickname",
					data:["nickname, world_id"]
				},
				'SEARCH_DONATIONS':{
					type:"search_donations",
					data:["tribe_id"]
				},
				'DELETE_DONATION':{
					type:"delete_donation",
					data:["donation_id"]
				},
				'UPDATE_DONATION':{
					type:"update_donation",
					data:["donation"]
				},
				'SEARCH_RESERVATIONS':{
					type:"search_reservations",
					data:["tribe_id", "world_id"]
				},
				'SEARCH_RESERVATIONS_FOR_CHARACTER':{
					type:"search_reservations_for_character",
					data:["character_id", "world_id"]
				},
				'DELETE_RESERVATION':{
					type:"delete_reservation",
					data:["reservation_id", "character_id"]
				},
				'DELETE_RESERVATION_EXCLUDED':{
					type:"delete_reservation_excluded",
					data:["reservation_id"]
				},
				'UPDATE_RESERVATION':{
					type:"update_reservation",
					data:["reservation"]
				},
				'SEARCH_SQUADRONS':{
					type:"search_squadrons",
					data:["tribe_id"]
				},
				'SEARCH_SQUADRON':{
					type:"search_squadron",
					data:["squadron"]
				},
				'SEARCH_SQUADRON_FOR_CHARACTER':{
					type:"search_squadron_for_character",
					data:["character_id"]
				},
				'DELETE_SQUADRON':{
					type:"delete_squadron",
					data:["squadron_id"]
				},
				'UPDATE_SQUADRON':{
					type:"update_squadron",
					data:["squadron"]
				},
				'INSERT_CHARACTER_SQUADRON':{
					type:"update_character_squadron_has_character",
					data:["character"]
				},
				'DELETE_CHARACTER_SQUADRON':{
					type:"delete_character_squadron_has_character",
					data:["character"]
				},
				'SEARCH_CHARACTERS_FOR_SQUADRON':{
					type:"search_characters_for_squadron",
					data:["squadron_id"]
				},
				'UPDATE_COMMAND':{
					type:"update_command",
					data:["command"]
				},
				'DELETE_COMMAND':{
					type:"delete_command",
					data:["command_id"]
				},
				'SEARCH_OPERATIONS_FOR_TRIBE':{
					type:"search_operations_for_tribe",
					data:["tribe_id"]
				},
				'UPDATE_OPERATION':{
					type:"update_operation",
					data:["operation"]
				},
				'DELETE_OPERATION':{
					type:"delete_operation",
					data:["operation_id"]
				},
				'SEARCH_COMMANDS_FOR_OPERATION':{
					type:"search_commands_for_operation",
					data:["operation_id"]
				},
				'SEARCH_RESERVATION_EXCLUDE':{
					type:"search_reservation_exclude",
					data:["village_id", "character_id"]
				}
		}
		return routes;
	})

});