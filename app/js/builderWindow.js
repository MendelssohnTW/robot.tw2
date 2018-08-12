define("robotTW2/screens", [], function(){
	return []
})
,
define("robotTW2/builderWindow", [
	"robotTW2/getScreen",
	"robotTW2/services",
	"robotTW2/screens"
	], function(
			getScreen,
			services,
			screens
	){
	var builderWindow = function (key, templateName, callback){
		key ? this.addhotkey(key, templateName) : null;
		templateName ? this.templateName = templateName : null;
		this.callback = callback;
		screens[templateName] = this;
		return this
	}
	, initialized = !1
	, openned = !1

	return builderWindow.prototype.buildWin = function(templateName) {
		var templateName = this;
		$rootScope.$on("$includeContentLoaded", function(event, screenTemplateName, data){
			screenTemplateName.indexOf(templateName) ? screens[templateName].openned = !0 : screens[templateName].openned = !1
		})
		new Promise(function(res, rej){
			getScreen(templateName, $rootScope.$new(), function(data){
				res(data)
			})
		})
		.then(function(data){
			screens[templateName].$data = data;
			$(".win-main").removeClass("jssb-focus")
			$(".win-main").removeClass("jssb-applied")
			!screens[templateName].$scrollbar ? screens[templateName].$scrollbar = new jsScrollbar(document.querySelector(".win-main")) : screens[templateName].$scrollbar;
			screens[templateName].callback()
		}, function(reason) {
			//console.log(reason); // Error!
		});

	}
	,
	builderWindow.prototype.addhotkey = function(key, templateName) {
		var fnThis = this.buildWin;
		services.hotkeys.add(key, function(){
			fnThis.call(templateName)
		}, ["INPUT", "SELECT", "TEXTAREA"])
	}
	,
	builderWindow.prototype.recalcScrollbar = function() {
		this.$scrollbar.recalc()
	}
	,
	builderWindow.prototype.setCollapse = function() {
		var a = this;
		$("section")[0].querySelectorAll(".twx-section.collapse").forEach(function(b) {
			var c = !b.classList.contains("hidden-content")
			, d = document.createElement("span");
			d.className = "min-max-btn";
			var e = document.createElement("a");
			e.className = "btn-orange icon-26x26-" + (c ? "minus" : "plus"),
			c || (b.nextSibling.style.display = "none"),
			d.appendChild(e),
			b.appendChild(d),
			d.addEventListener("click", function() {
				"none" === b.nextElementSibling.style.display ? (b.nextElementSibling.style.display = "",
						e.className = e.className.replace("plus", "minus"),
						c = !0) : (b.nextElementSibling.style.display = "none",
								e.className = e.className.replace("minus", "plus"),
								c = !1),
								a.recalcScrollbar()
			})
		})
	}
	,
	builderWindow.init = function() {
		initialized = !0
	}
	,
	builderWindow.isInitialized = function() {
		return initialized
	}
	,
	builderWindow
})