$(document).ready(function () {
	$("#streamersDiv").show();
	$("#followCurrentButton").hide();
	
	$("#forceUpdate").bind("click", onForceUpdate);
	
	chrome.storage.local.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		
		for (var key in streamers){
			$("#followingDiv").append(key+"\t\t\t&bull; \tUnfollow<br>");
			if (streamers[key].flag)
				$("#streamersDiv").append("<div id=\""+key+"\"><img src=\"gameicons/"+streamers[key].game.replace(/\:| /g,'')+".png\" width=\"19\" height=\"19\"/></a><a href=\""+streamers[key].url+"\"target=\"_blank\">"+key+"<br></div>");
		}
		
		chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
			tabUrl = arrayOfTabs[0].url;
			
			if (tabUrl.indexOf("twitch.tv/") != -1){
				var parts = tabUrl.split('/');
				var name = parts[3];
				
				/* Check if name is a streamer */
					if (isAStreamer(name)){
						if (streamers[name])
							remove = 1;
						else
							remove = 0;
						$("#followCurrentButton").show();
						$("#followCurrentButton").html((remove==1?"Unfollow ":"Follow ")+name);
						$("#followCurrentButton").bind("click", {name: name, remove: remove},followCurrent);
						//addToStorage(name);
					}
			}
		});
		
	});
});

function onForceUpdate(){
	chrome.runtime.getBackgroundPage(function(backgroundPage) {
		backgroundPage.updateCore(1,function(){location.reload()});
		//location.reload();
	});
}

function followCurrent(event){
	chrome.runtime.getBackgroundPage(function(backgroundPage) {
		backgroundPage.addToStorage(event.data.name,event.data.remove,function(){location.reload();});
		//location.reload();
		/*if (event.data.isOnline){
			$("#\""+event.data.name+"\"").remove();
			//Update o numero?
		}*/
	});
}

function isAStreamer(channel){
	var json;
	var xhr = new XMLHttpRequest();
	xhr.open('get', 'https://api.twitch.tv/kraken/channels/'+channel,false);
	xhr.send();
	if (xhr.status == "404")
		return false;
	else
		return true;
}