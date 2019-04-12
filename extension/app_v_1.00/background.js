var check_interval = undefined

function checkTime() {
	if(!check_interval){
		check_interval = setInterval(function(){
			chrome.tabs.query({}, function (tab){
				tab.forEach(n_tab => {
					if (n_tab.url && n_tab.url.indexOf('.tribalwars2.com/game.php') > -1) {
						chrome.tabs.executeScript(n_tab.id, { file: "contentScripts.js" }, result => {
							const lastErr = chrome.runtime.lastError;
							if (lastErr) console.log('tab: ' + n_tab.id + ' lastError: ' + JSON.stringify(lastErr));
						});
					}
				});
			})
		}, 300000)
	}
};

chrome.tabs.onCreated.addListener(checkTime);
chrome.tabs.onRemoved.addListener(checkTime);
chrome.windows.onCreated.addListener(checkTime);

