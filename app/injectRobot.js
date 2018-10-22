window.name = 'NG_ENABLE_DEBUG_INFO!';

var urlServer = "https://mendelssohntw.github.io/robot.tw2/app/";

if(!window.loadedJs){
	window.loadedJs = []
}

if (!window.inject){
	window.inject = function inject(url, dependencies, callback) {
		try {
			var dependencies_loaded = true;
			var i = 0;
			for (var d in dependencies) {
				if(dependencies.hasOwnProperty(d)){
					if (!loadedJs.some(f => f.toLowerCase() === dependencies[d].toLowerCase())) {
						dependencies_loaded = false;
						if (i <= 60) {
							setTimeout(inject, 1000, dependencies[d], [], callback);
						} else {
							return;
						}
					}
					i++;
				}
			}
			if (dependencies_loaded) {
				var r = Math.round(Math.random() * 1e10)
				var scr = document.createElement("script");
				scr.type = "text/javascript";
				if(urlServer.length > 0) {
					scr.src = urlServer + url + '?' + r;
				} else {
					scr.src = chrome.extension.getURL(url);
				}
				(document.head || document.body || document.documentElement).appendChild(scr);
				loadedJs.push(url);
				callback()
			}
		} catch (error) {
			setTimeout(inject, 1000, url, dependencies, callback);
		}
	};
}

if (!window.injectHTML){
	window.injectHTML = function injectHTML(urls) {

		function next(){
			var url = urls.shift();
			try {
				var scr = document.createElement("div");
				scr.setAttribute("ng-include", "");
				scr.setAttribute("style", "height:100%");
				if(urlServer.length > 0) {
					scr.setAttribute("src", "'" + urlServer + url + "'");
				} else {
					scr.setAttribute("src", "'" + chrome.extension.getURL(url) + "'");
				}
				
				(document.head || document.body || document.documentElement).appendChild(scr);
				if(urls.length){next()}
			} catch (error) {
				urls.unshift(url);
				setTimeout(injectHTML, 1000, urls);
				if(urls.length){next()}
			}
		}
		next()
	};
}

if (!window.checkHTML){
	window.checkHTML = function () {
		if (document.getElementById("interface-bottom")) {
			var scr = document.createElement("link");
			scr.setAttribute("rel", "stylesheet");
			scr.setAttribute("type", "text/css");
			scr.setAttribute("href", "https://mendelssohntw.github.io/robot.tw2/app/css/mainrobot.css");
			document.head.appendChild(scr);
			injectHTML([
				"templates/main.html", 
				"templates/headquarter.html", 
				"templates/farm.html",
				"templates/alert.html",
				"templates/recruit.html",
				"templates/attack.html",
				"templates/attackcompletion.html",
				"templates/defense.html"
				]);
		} else {
			setTimeout(checkHTML, 1000);
		}
	}
	checkHTML();
}

if (!window.check){
	window.check = function () {
		if (document.getElementById("interface-bottom")) {
			setTimeout(inject, 300,  "js/services.js", [], function(){
				setTimeout(inject, 300,  "js/ready.js", ["js/services.js"], function(){
					setTimeout(inject, 300,  "js/database.js", ["js/ready.js"], function(){
						setTimeout(inject, 300,  "js/utils.js", ["js/database.js"], function(){
							setTimeout(inject, 300,  "js/builderWindow.js", ["js/utils.js"], function(){
								setTimeout(inject, 300,  "js/headquarter.js", ["js/builderWindow.js"], function(){
									setTimeout(inject, 300,  "js/alert.js", ["js/builderWindow.js"], function(){
										setTimeout(inject, 300,  "js/recon.js", ["js/builderWindow.js"], function(){
											setTimeout(inject, 300,  "js/spy.js", ["js/builderWindow.js"], function(){
												setTimeout(inject, 300,  "js/attack.js", ["js/builderWindow.js"], function(){
													setTimeout(inject, 300,  "js/defense.js", ["js/builderWindow.js"], function(){
														setTimeout(inject, 300,  "js/recruit.js", ["js/builderWindow.js"], function(){
															setTimeout(inject, 300,  "js/deposit.js", ["js/builderWindow.js"], function(){
																setTimeout(inject, 300,  "js/farm.js", ["js/builderWindow.js"], function(){
																	setTimeout(inject, 300,  "js/services_queue.js", ["js/builderWindow.js"], function(){
																		setTimeout(inject, 300,  "js/main.js", ["js/services_queue.js"], function(){
																			setTimeout(inject, 300, "init_main.js", ["js/main.js"], function(){
																			});	
																		});	
																	});	
																});	
															});	
														});	
													});	
												});
											});
										});	
									});	
								});	
							});			
						});			
					});		
				});	
			});

		} else {
			setTimeout(check, 1000);
		}
	}
	check();
}