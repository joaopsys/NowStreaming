$(document).ready(function () {
	$("#followCurrentButton").hide();
	$("#unfollowCurrentButton").hide();
	$("#noFollowing").hide();
	$("#noStreams").hide();
	$("#streamersTable").hide();
	$("#loadingFollowing").show();
	$("#loadingStreams").show();

	$("#forceUpdate").bind("click", onForceUpdate);

	chrome.storage.local.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		var defaulticon = "icon";
		var defaulticonpath = "gameicons/";
		var defaulticontype = ".png";
		var nfollowing=0;
		var nstreams=0;
		for (var key in streamers){
			nfollowing++;
			$("#followingDiv").append("<div id=\""+key+"\">"+key+"<span style=\"float:right;\"><a id=\"unfollow-"+key+"\" href=\"#\"><img src=\"cross.png\" width=\"15\" height=\"15\"/></a></span></div><br>");
			$("#unfollow-"+key+"").bind("click", {name: key, remove: 1,nfollowing:nfollowing,nstreams:nstreams},followCurrent);
			if (streamers[key].flag){
				nstreams++;
				$("#streamersTable").show();
				$("#streamersTable").append("<tr id=\"row"+key+"\" align=\"center\"><td><img src=\""+(imageExists(defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype)?defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype:defaulticon+defaulticontype)+"\" width=\"19\" height=\"19\"/></td><td><a href=\""+streamers[key].url+"\" target=\"_blank\">"+key+"</a></td><td>"+streamers[key].viewers+"<td></tr>");
			}
		}
		$("#loadingFollowing").hide();
		$("#loadingStreams").hide();

		if (nfollowing <= 0){
			$("#noFollowing").show();
		}

		if (nstreams <= 0){
			$("#noStreams").show();
		}

		chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
			tabUrl = arrayOfTabs[0].url;

			if (tabUrl.indexOf("twitch.tv/") != -1){
				var parts = tabUrl.split('/');
				var name = parts[3];

				/* Check if name is a streamer */
					if (isAStreamer(name)){
						if (streamers[name]){
							remove = 1;
							$("#unfollowCurrentButton").show();
							$("#unfollowCurrentButton").html("Unfollow "+name);
							$("#unfollowCurrentButton").bind("click", {name: name, remove: remove, nfollowing:nfollowing, nstreams:nstreams},followCurrent);
						}
						else{
							remove=0;
							$("#followCurrentButton").show();
							$("#followCurrentButton").html("Follow "+name);
							$("#followCurrentButton").bind("click", {name: name, remove: remove, nfollowing:nfollowing, nstreams:nstreams},followCurrent);
						}
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
		backgroundPage.addToStorage(event.data.name,event.data.remove,function(){
			location.reload();
			//Tentativa fail de runtime reload
			/*if (event.data.remove){
				alert(event.data.nfollowing);
				$("#unfollowCurrentButton").hide();
				$("#followCurrentButton").show();
				$("#followCurrentButton").html("Follow "+event.data.name);
				$("#followCurrentButton").bind("click", {name: event.data.name, remove: 0, nfollowing:event.data.nfollowing-1, nstreams:event.data.nstreams-1},followCurrent);
				$("#"+event.data.name).fadeOut( "slow",function(){$("#"+event.data.name).remove();});
				$("#row"+event.data.name).fadeOut( "slow",function(){$("#row"+event.data.name).remove();});
				if (event.data.nfollowing-1 == 0){
					$("#noFollowing").show();
				}
				if (event.data.nstreams-1 == 0){
					$("#noStreams").show();
					$("#streamersTable").hide();
				}
			}
			else{
				$("#followCurrentButton").hide();
				$("#unfollowCurrentButton").show();
				$("#unfollowCurrentButton").html("Unfollow "+event.data.name);
				$("#unfollowCurrentButton").bind("click", {name: event.data.name, remove: 1, nfollowing:event.data.nfollowing, nstreams:event.data.nstreams},followCurrent);
				$("#noFollowing").hide();
				$("#followingDiv").append("<div id=\""+event.data.name+"\">"+event.data.name+"<span style=\"float:right;\"><a id=\"unfollow-"+event.data.name+"\" href=\"#\"><img src=\"cross.png\" width=\"15\" height=\"15\"/></a></span></div><br>");
				$("#unfollow-"+event.data.name+"").bind("click", {name: event.data.name, remove: 1,nfollowing:event.data.nfollowing,nstreams:event.data.nstreams},followCurrent);
				$("#"+event.data.name).fadeIn( "slow",null);
			}*/
		});
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
