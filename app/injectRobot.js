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
					scr.src = url + '?' + r;
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
scr.setAttribute("src", "'" + chrome.extension.getURL(url) + "'");
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
"view/main.html", 
"view/headquarter.html", 
"view/farm.html",
"view/alert.html",
"view/recruit.html",
"view/attack.html",
"view/attackcompletion.html",
"view/defense.html"
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
			setTimeout(inject, 300, urlServer + "js/ready.js", ["js/services.js"], function(){
				setTimeout(inject, 300, urlServer + "js/database.js", ["js/ready.js"], function(){
					setTimeout(inject, 300, urlServer + "js/utils.js", ["js/database.js"], function(){
						setTimeout(inject, 300, urlServer + "js/builderWindow.js", ["js/utils.js"], function(){
							setTimeout(inject, 300, urlServer + "js/headquarter.js", ["js/builderWindow.js"], function(){
								setTimeout(inject, 300, urlServer + "js/alert.js", ["js/builderWindow.js"], function(){
									setTimeout(inject, 300, urlServer + "js/recon.js", ["js/builderWindow.js"], function(){
										setTimeout(inject, 300, urlServer + "js/spy.js", ["js/builderWindow.js"], function(){
											setTimeout(inject, 300, urlServer + "js/attack.js", ["js/builderWindow.js"], function(){
												setTimeout(inject, 300, urlServer + "js/defense.js", ["js/builderWindow.js"], function(){
													setTimeout(inject, 300, urlServer + "js/recruit.js", ["js/builderWindow.js"], function(){
														setTimeout(inject, 300, urlServer + "js/deposit.js", ["js/builderWindow.js"], function(){
															setTimeout(inject, 300, urlServer + "js/farm.js", ["js/builderWindow.js"], function(){
																setTimeout(inject, 300, urlServer + "js/services_queue.js", ["js/builderWindow.js"], function(){
																	setTimeout(inject, 300, urlServer + "js/main.js", ["js/services_queue.js"], function(){
																		setTimeout(inject, 300, urlServer + "init_main.js", ["js/main.js"], function(){
//																			setTimeout(inject, 300, urlServer + "twtwotools.js", [], function(){
//
//																			});
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
