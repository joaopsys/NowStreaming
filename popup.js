$(document).ready(function () {
	$("#streamersDiv").show();
	$("#followCurrentButton").hide();

	$("#forceUpdate").bind("click", onForceUpdate);

	chrome.storage.local.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		var defaulticon = "icon";
		var defaulticonpath = "gameicons/";
		var defaulticontype = ".png";
		for (var key in streamers){
			$("#followingDiv").append("<div id=\""+key+"\">"+key+"<span style=\"float:right;\"><a id=\"unfollow-"+key+"\" href=\"#\"><img src=\"cross.png\" width=\"15\" height=\"15\"/></a></span></div><br>");
			$("#unfollow-"+key+"").bind("click", {name: key, remove: 1},followCurrent);
			if (streamers[key].flag){
				$("#streamersTable").append("<tr align=\"center\"><td><img src=\""+(imageExists(defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype)?defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype:defaulticon+defaulticontype)+"\" width=\"19\" height=\"19\"/></td><td><a href=\""+streamers[key].url+"\" target=\"_blank\">"+key+"</a></td><td>"+streamers[key].viewers+"<td></tr>");
			}
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

function imageExists(url)
{
    if(url){
				try{
	        var req = new XMLHttpRequest();
	        req.open('GET', url, false);
	        req.send();
	        return req.status==200;
				} catch(e){
					return 0;
				}
    } else {
        return false;
    }
}

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
