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
							setTimeout(function(){inject(dependencies[d], [], callback)}, 1000);
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
//					scr.src = url + '?' + r;
					scr.src = url;
				} else {
					scr.src = chrome.extension.getURL(url);
				}
				(document.head || document.body || document.documentElement).appendChild(scr);
				loadedJs.push(url);
				callback()
			}
		} catch (error) {
			setTimeout(function(){inject(url, dependencies, callback)}, 1000);
		}
	};
}

if (!window.check){
	window.check = function () {
		if (document.getElementById("interface-bottom")) {
			var scr = document.createElement("link");
			scr.setAttribute("rel", "stylesheet");
			scr.setAttribute("type", "text/css");
			scr.setAttribute("href", urlServer + "css/robotTW2.css");
			document.head.appendChild(scr);
			
			inject(urlServer + "twtwotools.js", [], function(){});

		} else {
			setTimeout(check, 1000);
		}
	}
	check();
}
