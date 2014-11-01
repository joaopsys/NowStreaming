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
	$("#submitFastFollow").bind("click", fastFollow);

	$("#versionDiv").append(chrome.app.getDetails().version);

	chrome.storage.local.get({streamers:{}}, function (result) {
		streamers = result.streamers;
		var defaulticon = "icon";
		var defaulticonpath = "gameicons/";
		var defaulticontype = ".png";
		var defaultpage = "http://twitch.tv/";
		var nfollowing=0;
		var nstreams=0;
		for (var key in streamers){
			nfollowing++;
			$("#followingDiv").append("<div id=\""+key+"\"><a class=\"streamerpage\" href=\""+(streamers[key].url=="null"?(defaultpage+key):streamers[key].url)+"\" target=\"_blank\">"+key+"</a><a class=\"unfollowstreamer\" id=\"unfollow-"+key+"\" href=\"#\"><img title=\"Unfollow "+key+"\" src=\"cross.png\"/></a></div><br>");
			$("#unfollow-"+key+"").bind("click", {name: key, remove: 1},followCurrent);
			if (streamers[key].flag){
				nstreams++;
				$("#streamersTable").show();
				$("#streamersTable").append("<tr id=\"row"+key+"\"><td><img src=\""+(imageExists(defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype)?defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype:defaulticon+defaulticontype)+"\" title=\""+streamers[key].game+"\" class=\"masterTooltip\" width=\"30\" height=\"30\"/></td><td><a title=\""+streamers[key].title+"\" class=\"streamerpage masterTooltip\" href=\""+streamers[key].url+"\" target=\"_blank\">"+key+"</a></td><td><span class=\"viewersclass\">"+streamers[key].viewers+"</span><td></tr>");
			}
		}


		$(".masterTooltip").bind("mouseenter", showTooltip);

		$(".masterTooltip").bind("mouseleave", hideTooltip);
		$(".masterTooltip").bind("mousemove", updateTooltip);


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
							$("#unfollowCurrentButton").bind("click", {name: name, remove: remove},followCurrent);
						}
						else{
							remove=0;
							$("#followCurrentButton").show();
							$("#followCurrentButton").html("Follow "+name);
							$("#followCurrentButton").bind("click", {name: name, remove: remove},followCurrent);
						}
						//addToStorage(name);
					}
			}
		});

	});
});

function showTooltip(e){
	var title = $(this).attr('title');
	$(this).data('tipText', title).removeAttr('title');
	$('<p class="tooltip"></p>')
	.text(title)
	.appendTo('body')
	.fadeIn('slow');
	var mousex = e.pageX - 20; //Get X coordinates
	var mousey = e.pageY - 50 - $('.tooltip').height(); //Get Y coordinates
	$('.tooltip')
	.css({ top: mousey, left: mousex })
}

function hideTooltip(e){
	$(this).attr('title', $(this).data('tipText'));
	$('.tooltip').remove();
}

function updateTooltip(e){
	var mousex = e.pageX - 20; //Get X coordinates
	var mousey = e.pageY - 50 - $('.tooltip').height(); //Get Y coordinates
	$('.tooltip')
	.css({ top: mousey, left: mousex })
}


$(window).keydown(function(event){
	if(event.keyCode == 13){
		event.preventDefault();

		if($("#fastFollowInput").is(":focus")){
			fastFollow();
		}
		else if($("#syncWithTwitchInput").is(":focus")){
			chrome.storage.local.get({
				add: true
			}, function(items) {
				syncWithTwitch(50,0,0,null,items.add);
			});
		}
		else if($("#importDataInput").is(":focus")){
			importData();
		}
		return false;
	}
});

function fastFollow(){
	var user = document.getElementById("fastFollowInput").value;
	if (isAStreamer(user)){
		directFollow(user,0);
	}
	else{
		alert("desconheço");
	}
}

function showTwitchForm(){
	$("#inputTwitchUser").show();
}

function syncWithTwitch(limit, offset, done, following, add){
	var user = document.getElementById("syncWithTwitchInput").value;
	if (user == "mlg360noscope420blazeit")
		window.open("http://youtu.be/kHYZDveT46c");
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
					following[json.follows[i].channel.name] = {flag:1,game:"null",viewers:-1,url:"null",created_at:"null",title:"null"};
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
	var data = document.getElementById("importDataInput").value;
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
	directFollow(event.data.name,event.data.remove);
}

function directFollow(user,remove){
	chrome.runtime.getBackgroundPage(function(backgroundPage) {
		backgroundPage.addToStorage(user,remove,function(){
			location.reload();
		});
	});
}

function isAStreamer(channel){
	var json;
	var xhr = new XMLHttpRequest();
	xhr.open('get', 'https://api.twitch.tv/kraken/channels/'+channel,false);
	xhr.send();
	if (xhr.status == "404" || xhr.status == "422")
		return false;
	else
		return true;
}
