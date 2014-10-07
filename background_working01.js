chrome.browserAction.onClicked.addListener(click);
chrome.alarms.create({periodInMinutes: 0.166});

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

function click(e){
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		tabUrl = arrayOfTabs[0].url;
		
		if (tabUrl.indexOf("twitch.tv/") != -1){
			var parts = tabUrl.split('/');
			var name = parts[3];
			
			/* Check if name is a streamer */
				if (isAStreamer(name))
					addToStorage(name);
				/*else
					console.log("NOT A STREAMER");*/
		}
	});
}

function addToStorage(channel){
	var remove = 0;
	var streamers;
	chrome.storage.sync.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		console.log(streamers);
		if (streamers[channel] == 0 || streamers[channel] == 1){
			delete streamers[channel];
			remove = 1;
		}
		else
			streamers[channel] = 0;
			
		chrome.storage.sync.set({'streamers': streamers}, function () {
			var opt;
			if (remove == 1){
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
			chrome.notifications.create(remove==1?"un":"" + "follow"+channel, opt, function(id) {});
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

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.clear();
	chrome.storage.sync.clear();
});

chrome.notifications.onClicked.addListener(function(notificationId) {
	window.open(notificationId.split('-')[1]);
});

chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
	if (btnIdx === 0) {
		addToStorage(notifId.split('-')[0]);
	}
});

chrome.alarms.onAlarm.addListener(function() {
	var json;
	var xhr = new XMLHttpRequest();
	var streamers = {};
	var url = "https://api.twitch.tv/kraken/streams?channel=";
	temp = "";
	
	/*Load streamers*/
	chrome.storage.sync.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		
		/* Not following anyone? Don't do anything */
		
		if (isEmpty(streamers))
			return;
		
		/* Add streamers to URL so we can send them all in one request */
		for (var key in streamers){
			url+=key+",";
		}
			xhr.open('get', url,true);
			xhr.onload = function() {
				json = JSON.parse(xhr.responseText);

				/* If anyone is streaming then this loop will run */
				for (i=0;i<json.streams.length;i++){
					/* We will need this temp so we can check which streamers are NOT streaming in the end */
					temp = temp.concat(json.streams[i].channel.name);
					/* If stream is up and notification has not been sent, then send it */
					if (streamers[json.streams[i].channel.name] == 0){
						console.log(json.streams[i].channel.logo);
						tmpname = json.streams[i].channel.name;
						tmpurl = json.streams[i].channel.url;
						var opt = {
						  type: "basic",
						  title: "NowStreaming: "+json.streams[i].channel.display_name,
						  message: "Game: "+(json.streams[i].game!=null?json.streams[i].game:"N/A")+"\n"+"Viewers: "+json.streams[i].viewers+"\nClick here to watch the stream",
						  buttons:[{title:"Unfollow "+json.streams[i].channel.display_name,iconUrl:"cross.png"}],
						  iconUrl: json.streams[i].channel.logo!=null?json.streams[i].channel.logo:"icon.png",
						  isClickable: true
						}
						chrome.notifications.clear(tmpname+"-"+tmpurl, function(wasCleared) {});
						chrome.notifications.create(tmpname+"-"+tmpurl, opt, function(id){});
						
						/* Notification sent, update values on storage */
						streamers[json.streams[i].channel.name] = 1;
					}
				}
				
				/* Check which ones were not streaming so we reset values */
				for (var key in streamers){
					if (temp.indexOf(key) == -1){
						console.log("Meti alguem a 0 -"+key);
						streamers[key] = 0;
					}
				}
				chrome.storage.sync.set({'streamers': streamers}, function () {
					console.log(streamers);
				});
			}
			xhr.send();
	});
});