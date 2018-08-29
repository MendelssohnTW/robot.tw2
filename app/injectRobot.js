if(!window.loadedJs){
	window.loadedJs = []
}

var urlServer = "https://mendelssohntw.github.io/robot.tw2/app/";
var i = 0;
if (!window.inject){
	window.inject = function (url, dependencies, callback) {
		try {
			var dependencies_loaded = true;

			if(dependencies.length){
				for (var d in dependencies) {
					if(dependencies.hasOwnProperty(d)){
						if (!loadedJs.some(f => f.toLowerCase() == dependencies[d].toLowerCase())) {
							dependencies_loaded = false;
							if (i <= 60) {
								i++;
								setTimeout(inject, 1000, dependencies[d], [], callback);
							} else {
								return;
							}
						}
					}
				}
			}
			if (dependencies_loaded) {
				var scr = document.createElement("script");
				scr.type = "text/javascript";
				scr.src = url;
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
				scr.setAttribute("src", "'" + url + "'");
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
		if (document.getElementById("interface-bottom")) {var scr = document.createElement("link");
		scr.setAttribute("rel", "stylesheet");
		scr.setAttribute("type", "text/css");
		scr.setAttribute("href", "https://mendelssohntw.github.io/robot.tw2/app/css/mainrobot.css");

			document.head.appendChild(scr)
			
			injectHTML([
				urlServer + "view/main.html", 
				urlServer + "view/headquarter.html", 
				urlServer + "view/farm.html",
				urlServer + "view/alert.html",
				urlServer + "view/recruit.html",
				urlServer + "view/attack.html",
				urlServer + "view/defense.html"
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
			setTimeout(inject, 1000, urlServer + "js/json.js", [], function(){
				setTimeout(inject, 1000, urlServer + "js/services.js", [], function(){
					setTimeout(inject, 1000, urlServer + "js/ready.js", [urlServer + "js/services.js"], function(){
						setTimeout(inject, 1000, urlServer + "js/database.js", [urlServer + "js/ready.js"], function(){
							setTimeout(inject, 1000, urlServer + "js/utils.js", [urlServer + "js/database.js"], function(){
								setTimeout(inject, 1000, urlServer + "js/builderWindow.js", [urlServer + "js/utils.js"], function(){
									setTimeout(inject, 1000, urlServer + "js/headquarter.js", [urlServer + "js/builderWindow.js"], function(){
										setTimeout(inject, 1000, urlServer + "js/alert.js", [urlServer + "js/builderWindow.js"], function(){
											setTimeout(inject, 1000, urlServer + "js/recon.js", [urlServer + "js/builderWindow.js"], function(){
												setTimeout(inject, 1000, urlServer + "js/spy.js", [urlServer + "js/builderWindow.js"], function(){
													setTimeout(inject, 1000, urlServer + "js/attack.js", [urlServer + "js/builderWindow.js"], function(){
														setTimeout(inject, 1000, urlServer + "js/defense.js", [urlServer + "js/builderWindow.js"], function(){
															setTimeout(inject, 1000, urlServer + "js/recruit.js", [urlServer + "js/builderWindow.js"], function(){
																setTimeout(inject, 1000, urlServer + "js/deposit.js", [urlServer + "js/builderWindow.js"], function(){
																	setTimeout(inject, 1000, urlServer + "js/farm.js", [urlServer + "js/builderWindow.js"], function(){
																		setTimeout(inject, 1000, urlServer + "js/services_queue.js", [urlServer + "js/builderWindow.js"], function(){
																			setTimeout(inject, 1000, urlServer + "js/main.js", [urlServer + "js/services_queue.js"], function(){
																				setTimeout(inject, 1000, urlServer + "init_main.js", [urlServer + "js/main.js"], function(){

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
			});

		} else {
			setTimeout(check, 1000);
		}
	}
	check();
}
