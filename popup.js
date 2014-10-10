$(document).ready(function () {
	$("#followCurrentButton").hide();
	$("#unfollowCurrentButton").hide();
	$("#noFollowing").hide();
	$("#noStreams").hide();
	$("#streamersTable").hide();
	$("#loadingFollowing").show();
	$("#loadingStreams").show();
	$("#inputTwitchUser").hide();
	$("#unfollowAll").show();
	$("#textBox").hide();
	$("#importDiv").hide();
	//$("#followingDiv").hide();

	//$("#forceUpdate").bind("click", onForceUpdate);
	$("#syncTwitchButton").bind("click", showTwitchForm);
	$("#submitButton").bind("click", function(){
		chrome.storage.local.get({
			add: true
		}, function(items) {
			syncWithTwitch(50,0,0,null,items.add);
		});
	});
	$("#unfollowAllButton").bind("click", unfollowAll);
	$("#exportFollowingButton").bind("click", exportFollowing);
	$("#importFollowingButton").bind("click",importFollowing);
	$("#submitData").bind("click", importData);

	$("#versionDiv").append(chrome.app.getDetails().version);

	chrome.storage.local.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		var defaulticon = "icon";
		var defaulticonpath = "gameicons/";
		var defaulticontype = ".png";
		var nfollowing=0;
		var nstreams=0;
		for (var key in streamers){
			nfollowing++;
			$("#followingDiv").append("<div id=\""+key+"\">"+key+"<a id=\"unfollow-"+key+"\" href=\"#\"><img title=\"Unfollow "+key+"\" src=\"cross.png\"/></a></div><br>");
			$("#unfollow-"+key+"").bind("click", {name: key, remove: 1,nfollowing:nfollowing,nstreams:nstreams},followCurrent);
			if (streamers[key].flag){
				nstreams++;
				$("#streamersTable").show();
				$("#streamersTable").append("<tr id=\"row"+key+"\"><td><img src=\""+(imageExists(defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype)?defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype:defaulticon+defaulticontype)+"\" title=\""+streamers[key].game+"\" width=\"30\" height=\"30\"/></td><td><a href=\""+streamers[key].url+"\" target=\"_blank\">"+key+"</a></td><td>"+streamers[key].viewers+"<td></tr>");
			}
		}
		$("#loadingFollowing").hide();
		$("#loadingStreams").hide();

		if (nfollowing <= 0){
			$("#noFollowing").show();
			$("#unfollowAll").hide();
		}

		if (nstreams <= 0){
			$("#noStreams").show();
		}

		chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
			tabUrl = arrayOfTabs[0].url;

			if (tabUrl.indexOf("www.twitch.tv/") != -1){
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

$(window).keydown(function(event){
    if(event.keyCode == 13 && !$("#inputTwitchUser").is(':hidden')) {
      event.preventDefault();
		chrome.storage.local.get({
			add: true
		}, function(items) {
			syncWithTwitch(50,0,0,null,items.add);
		});
      return false;
    }
});

function showTwitchForm(){
	$("#inputTwitchUser").show();
}

function syncWithTwitch(limit, offset, done, following, add){
	var user = document.getElementById("twitchuser").value;
	var url = "https://api.twitch.tv/kraken/users/"+user+"/follows/channels?limit="+limit+"&offset="+offset;
	if (following == null && add){
		chrome.storage.local.get({streamers:{}}, function (result) {
			var streamers_temp = result.streamers;
			syncWithTwitch(limit,offset,done,streamers_temp);
		});
	}
	else{
		if (following == null)
			following={};
		var json;
		var xhr = new XMLHttpRequest();
		xhr.open('get', url,true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200){
				json = JSON.parse(xhr.responseText);
				for (var i=0;i<json.follows.length;i++){
					following[json.follows[i].channel.name] = {flag:1,game:"null",viewers:-1,url:"null"};
				}
				if (json.follows.length+done >= json._total){
					chrome.storage.local.set({'streamers': following}, function () {
						onForceUpdate();
					});
				}
				else{
					syncWithTwitch(limit, offset+limit,json.follows.length+done,following,add);
				}
			}
		}
		xhr.send();
	}
}

function exportFollowing(){
	chrome.storage.local.get({streamers:{}}, function (result) {
		$("#textBox").show();
		var streamers = result.streamers;
		$("#exportBox").val(JSON.stringify(streamers));
	});
}

function importFollowing(){
	$("#importDiv").show();
}

function importData(){
	var data = document.getElementById("importData").value;
	try{
		var streamers = JSON.parse(data);
		chrome.storage.local.set({'streamers': streamers}, function () {
			chrome.runtime.getBackgroundPage(function(backgroundPage) {
				backgroundPage.updateCore(1,function(){location.reload();});
			});
		});
	}catch(e){
		alert("Invalid data format!");
	}
}

function unfollowAll(){
	chrome.storage.local.set({'streamers': {}}, function () {});
	onForceUpdate();
}

function imageExists(url) {	
	var response = jQuery.ajax({
		url: url,
		type: 'HEAD',
		async: false
	}).status;	
	
	return (response != "200") ? false : true;
}

function onForceUpdate(){
	chrome.runtime.getBackgroundPage(function(backgroundPage) {
		backgroundPage.updateCore(1,function(){location.reload();});
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
