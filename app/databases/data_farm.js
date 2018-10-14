define("robotTW2/databases/data_farm", [
	"robotTW2/databases/database",
	"robotTW2/conf",
	"robotTW2/services",
//	"robotTW2/notify",
	"helper/time"
	], function(
			database,
			conf,
			services,
//			notify,
			helper
	) {

	var service = {};
	service.getPreset = function(id){
		return database.get("data_farm").presets[id];
	}
	service.getPresets = function(){
		return database.get("data_farm").presets;
	}
	service.setPresets = function(presets){
		if(!presets){return}
		data_farm.presets = presets;
		service.save();
	}
	service.getJourneyTime = function(){
		return database.get("data_farm").journey_time;
	}
	service.setJourneyTime = function(journey_time){
		if(!journey_time){return}
		data_farm.journey_time = journey_time;
		service.save();
	}
	service.getJourneyDistance = function(){
		return database.get("data_farm").journey_distance;
	}
	service.getMinJourneyDistance = function(){
		return database.get("data_farm").min_journey_distance;
	}
	service.getFarmTime = function(){
		return database.get("data_farm").farm_time;
	}
	service.setFarmTime = function(farm_time){
		if(!farm_time){return}
		data_farm.farm_time = farm_time;
		service.save();
	}
	service.getFarmTimeStop = function(){
		return database.get("data_farm").farm_time_stop;
	}
	service.setFarmTimeStop = function(farm_time_stop){
		if(!farm_time_stop){return}
		data_farm.farm_time_stop = farm_time_stop;
		service.save();
	}
	service.getFarmTimeStart = function(){
		return database.get("data_farm").farm_time_start;
	}
	service.setFarmTimeStart = function(farm_time_start){
		if(!farm_time_start){return}
		data_farm.farm_time_start = farm_time_start;
		service.save();
	}
	service.getMaxPointsFarm = function(){
		return database.get("data_farm").max_points_farm;
	}
	service.getMinPointsFarm = function(){
		return database.get("data_farm").min_points_farm;
	}
	service.getMaxCommandsFarm = function(){
		return database.get("data_farm").max_commands_farm;
	}

	service.addException = function(exception){
		if(exception){
			!data_farm.list_exceptions.find(f => f == exception) ? data_farm.list_exceptions.push(exception) : null;
			service.save();
		}
	}

	service.removeException = function(exception){
		if(exception){
			data_farm.list_exceptions = data_farm.list_exceptions.filter(f => f != exception)
			service.save();
		}
	}

	service.getExceptions = function(){
		return database.get("data_farm").list_exceptions
	}

	service.setExceptions = function(exceptions){
		if(exceptions){
			angular.merge(data_farm.list_exceptions, exceptions)
			service.save();
		}
	}

	service.getTimeComplete = function(){
		return database.get("data_farm").completed_at;
	}

	service.setTimeComplete = function(time){
		if(!time){return}
		data_farm.completed_at = time
		service.save();
	}

	service.getAutoInitialize = function(){
		return database.get("data_farm").auto_initialize;
	}

	service.getInitialized = function(){
		return database.get("data_farm").initialized;
	}

	service.save = function(){
		database.set("data_farm", data_farm, true)
	}

	var data_farm = database.get("data_farm");
	var dataNew = {
			auto_initialize			: false, 
			initialized				: false, 
			activated				: false, 
			version					: conf.VERSION.FARM,
			farm_time				: conf.FARM_TIME,
			farm_time_start			: helper.gameTime(),
			farm_time_stop			: new Date((services.$filter("date")(new Date(helper.gameTime() + 86400000), "yyyy-MM-dd")) + " 06:00:00").getTime(),
			journey_distance		: 15,
			min_journey_distance	: 7,
			journey_time			: conf.JOURNEY_TIME,
			max_points_farm			: conf.MAX_POINTS,
			min_points_farm			: conf.MIN_POINTS,
			max_commands_farm		: conf.MAX_COMMANDS,
			list_exceptions			: [],
			presets					: {}
	}


	if(!data_farm){
		data_farm = dataNew
		database.set("data_farm", data_farm, true)
	} else {
		if(!data_farm.version || data_farm.version < conf.VERSION.FARM){
			data_farm = dataNew
			database.set("data_farm", data_farm, true)
//			notify("data_farm");
		} else {
			if(!data_farm.auto_initialize) data_farm.initialized = !1;
			if(data_farm.auto_initialize) data_farm.initialized = !0;
			database.set("data_farm", data_farm, true)		
		}
	}

	Object.setPrototypeOf(data_farm, service);

	return data_farm;
})
