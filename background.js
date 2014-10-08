//chrome.browserAction.onClicked.addListener(click);
chrome.alarms.create({periodInMinutes: 1});

function addToStorage(channel, remove, callback){
	var streamers;
	chrome.storage.sync.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		console.log("vem da sync");
		console.log(streamers);
		if (remove){
			delete streamers[channel];
		}
		else
			streamers[channel] = {flag:1};
		console.log("vou meter");
		console.log(streamers);
		/* Follow or unfollow? Update both sync and local */
		chrome.storage.sync.set({'streamers': streamers}, function () {
		});
	});

	chrome.storage.local.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		if (remove){
			delete streamers[channel];
		}
		else
			streamers[channel] = {flag:0,url:"null",game:"null",viewers:-1};
		chrome.storage.local.set({'streamers': streamers}, function () {
			var opt;
			if (remove){
				opt = {
				  type: "basic",
				  title: "NowStreaming",
				  message: "You unfollowed "+channel+"!",
				  iconUrl: "cross.png"
				}
			}
			else{
				opt = {
				  type: "basic",
				  title: "NowStreaming",
				  message: "You are now following "+channel+"!",
				  iconUrl: "check.png"
				}
			}
			chrome.notifications.clear(remove==1?"un":"" + "follow"+channel, function(wasCleared) {});
			chrome.notifications.create(remove==1?"un":"" + "follow"+channel, opt, function(id) {updateCore(0,function(){callback();}); });
		});
	});
}

function isEmpty(map) {
   for(var key in map) {
      if (map.hasOwnProperty(key)) {
         return false;
      }
   }
   return true;
}

chrome.runtime.onStartup.addListener(function() {
	chrome.storage.local.clear();
	/* Get followers from sync, put them on local */
	chrome.storage.sync.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		for (var key in streamers){
			streamers[key] = {flag:1,game:"null",viewers:-1,url:"null"};
		}
		//console.log(streamers);
		chrome.storage.local.set({'streamers': streamers}, function () {
			//console.log("Meti isto ^ no local ");
			updateCore(1,function(){});
		});
	});
});

chrome.runtime.onUpdateAvailable.addListener(function (){
	chrome.storage.sync.clear();
	chrome.runtime.reload();
});

chrome.runtime.onInstalled.addListener(function () {
	chrome.storage.local.clear();
	//chrome.storage.sync.clear();
	/* Get followers from sync, put them on local */
	chrome.storage.sync.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		for (var key in streamers){
			streamers[key] = {flag:1,game:"null",viewers:-1,url:"null"};
		}
		//console.log(streamers);
		chrome.storage.local.set({'streamers': streamers}, function () {
			//console.log("Meti isto ^ no local ");
			updateCore(1,function(){});
		});
	});
});

chrome.notifications.onClicked.addListener(function(notificationId) {
	if (notificationId.split("-")[1] == "nstreaming"){
		window.open("popup.html");
	}
	else
		window.open(notificationId.split('-')[1]);
});

chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
	if (btnIdx === 0) {
		addToStorage(notifId.split('-')[0],1,function(){});
	}
});

chrome.alarms.onAlarm.addListener(function() {
	updateCore(0,function(){});
});

function getFollowing(){
	chrome.storage.local.get({streamers:{}}, function (result) {
		streamers = result.streamers;
	});
}

function updateCore(is_first_run,callback) {
	var json;
	var xhr = new XMLHttpRequest();
	var streamers = {};
	var url = "https://api.twitch.tv/kraken/streams?channel=";
	temp = "";

	/*Load streamers*/
	chrome.storage.local.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		console.log(streamers);

		/* Not following anyone? Don't do anything */

		if (isEmpty(streamers)){
			chrome.browserAction.setBadgeText({"text": ""});
			callback();
			return;
		}

		/* Add streamers to URL so we can send them all in one request */
		for (var key in streamers){
			url+=key+",";
		}
			xhr.open('get', url,true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200){
					json = JSON.parse(xhr.responseText);
					var onlineStreams=0;
					/* If anyone is streaming then this loop will run */
					console.log(json);
					console.log("Length: "+json.streams.length+" e "+json._total);
					for (i=0;i<json.streams.length;i++){
						/* We will need this temp so we can check which streamers are NOT streaming in the end */
						temp = temp.concat(json.streams[i].channel.name);
						onlineStreams++;
						/* If stream is up and notification has not been sent, then send it */
						if (streamers[json.streams[i].channel.name].flag == 0){
							console.log("A mandar not do "+json.streams[i].channel.name);
							tmpname = json.streams[i].channel.name;
							tmpurl = json.streams[i].channel.url;
							var opt = {
							  type: "basic",
							  title: "NowStreaming: "+json.streams[i].channel.display_name,
							  message: "Game: "+(json.streams[i].game!=null?json.streams[i].game:"N/A")+"\n"+"Viewers: "+json.streams[i].viewers,
							  contextMessage: "Click here to watch the stream",
							  buttons:[{title:"Unfollow "+json.streams[i].channel.display_name,iconUrl:"cross.png"}],
							  iconUrl: json.streams[i].channel.logo!=null?json.streams[i].channel.logo:"icon.png",
							  isClickable: true
							}
							chrome.notifications.clear(tmpname+"-"+tmpurl, function(wasCleared) {});
							chrome.notifications.create(tmpname+"-"+tmpurl, opt, function(id){});

							/* Notification sent, update values on storage */
							streamers[json.streams[i].channel.name].flag = 1;
						}
						streamers[json.streams[i].channel.name].game = json.streams[i].game;
						streamers[json.streams[i].channel.name].viewers = json.streams[i].viewers;
						streamers[json.streams[i].channel.name].url = json.streams[i].channel.url;
					}

					/* Check which ones were not streaming so we reset values */
					for (var key in streamers){
						if (temp.indexOf(key) == -1){
							console.log("Meti alguem a 0 -"+key);
							streamers[key].flag = 0;
						}
					}
					chrome.storage.local.set({'streamers': streamers}, function () {
						if (is_first_run){
							if (onlineStreams > 0){
								var opt = {
								  type: "basic",
								  title: "NowStreaming",
								  message: "There "+(onlineStreams==1?"is":"are")+" currently "+onlineStreams+(onlineStreams==1?" streamer":" streamers")+" online.",
								  contextMessage: "Click here for more details.",
								  iconUrl: "icon.png",
								  isClickable: true
								}
								chrome.notifications.clear(onlineStreams+"-nstreaming", function(wasCleared) {});
								chrome.notifications.create(onlineStreams+"-nstreaming", opt, function(id){});
							}
						}
						chrome.browserAction.setBadgeBackgroundColor({"color": (onlineStreams==0?"#CC0000":onlineStreams==1?"#FF7519":"#00CC00")});
						chrome.browserAction.setBadgeText({"text": ""+onlineStreams});
					callback();
					});
				}
			}
			//console.log(streamers);
			xhr.send();
	});
}
