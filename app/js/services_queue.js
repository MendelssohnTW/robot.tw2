define("robotTW2/requestFn", [], function (){
	var fns = {}
	, service = {};
	return service.prefix = "robotTW2/" 
		, service.bind = function(key, fn) {
		fns.hasOwnProperty(key) || (fns[key] = []),
		fns[key].push(fn)
	}
	,
	service.trigger = function(key, fn) {
		fns.hasOwnProperty(key) && fns[key].forEach(function(fs) {
			fs.apply(this, fn)
		})
	}
	,
	service.get = function(key, opt_prefix, index) {
		if(!key) return;
		!index ? index = 0 : index;
		return opt_prefix && fns[this.prefix + key] ? fns[this.prefix + key][index] : fns[key] ? fns[key][index] : null 
	}
	,
	service
})
,
require([
	"robotTW2/requestFn"
	], function(
			requestFn
	){
	require(["robotTW2/headquarter", "robotTW2/headquarter/ui"], function(headquarter){
		headquarter && typeof(headquarter.init) == "function" ? requestFn.bind("robotTW2/headquarter", headquarter) : null;	
	})

	require(["robotTW2/farm", "robotTW2/farm/ui"], function(farm){
		farm && typeof(farm.init) == "function" ? requestFn.bind("robotTW2/farm", farm) : null;	
	}, function(err){
		console.log(err)
	})

	require(["robotTW2/deposit", "robotTW2/deposit/ui"], function(deposit){
		deposit && typeof(deposit.init) == "function" ? requestFn.bind("robotTW2/deposit", deposit) : null;	
	}, function(err){
		console.log(err)
	})

	require(["robotTW2/alert", "robotTW2/alert/ui"], function(alert){
		alert && typeof(alert.init) == "function" ? requestFn.bind("robotTW2/alert", alert) : null;	
	}, function(err){
		console.log(err)
	})
	
	require(["robotTW2/recon", "robotTW2/recon/ui"], function(recon){
		recon && typeof(recon.init) == "function" ? requestFn.bind("robotTW2/recon", recon) : null;	
	}, function(err){
		console.log(err)
	})
	
	require(["robotTW2/recruit", "robotTW2/recruit/ui"], function(recruit){
		recruit && typeof(recruit.init) == "function" ? requestFn.bind("robotTW2/recruit", recruit) : null;	
	}, function(err){
		console.log(err)
	})
	
	require(["robotTW2/spy", "robotTW2/spy/ui"], function(spy){
		spy && typeof(spy.init) == "function" ? requestFn.bind("robotTW2/spy", spy) : null;	
	}, function(err){
		console.log(err)
	})
	
	require(["robotTW2/attack", "robotTW2/attack/ui"], function(attack){
		attack && typeof(attack.init) == "function" ? requestFn.bind("robotTW2/attack", attack) : null;	
	}, function(err){
		console.log(err)
	})
	
	require(["robotTW2/defense", "robotTW2/defense/ui"], function(defense){
		defense && typeof(defense.init) == "function" ? requestFn.bind("robotTW2/defense", defense) : null;	
	}, function(err){
		console.log(err)
	})

})
