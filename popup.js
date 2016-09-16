$(document).ready(function () {
	$("#optionsDiv").hide();
	$("#followCurrentButton").hide();
	$("#unfollowCurrentButton").hide();
	$("#noFollowing").hide();
	$("#noStreams").hide();
	$("#streamersTable").hide();
	$("#streamersTableDiv").hide();
	$("#loadingFollowing").show();
	$("#loadingStreams").show();
	$("#inputTwitchUser").hide();
	$("#unfollowAll").show();
	$("#textBox").hide();
	$("#importDiv").hide();
	$("#fastFollowMessage").hide();
	$(".importTwitchLoading").hide();
	$("#importDataFailMessage").hide();
	$("#importTwitchFailMessage").hide();
	$(".currentMessage").hide();
	$(".manageFollowingMessage").hide();
	$("#manageFollowingButton").on({
		mouseenter: function () {
	        $(".manageFollowingMessage").show();
	    },
	    mouseleave: function () {
	        $(".manageFollowingMessage").hide();
		},
		click: function(){
			window.open("following.html");
			return false;
		}
	});
	$("#toggleOptions").on({
		click: function(){
			if ($("#optionsDiv").css('display') == 'none'){
				$("#optionsDiv").show();
				$(".currentMessageOptions").html(" Hide Options");
			}
			else{
				$("#optionsDiv").hide();
				$(".currentMessageOptions").html(" Show Options");
			}
		}
	});
	$("#followingTable").hide();

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
		$("#streamersTable").append("<tbody>");
		for (var key in streamers){
			nfollowing++;
			$("#followingTable").show();
			if (nfollowing%2==0)
				$("#followingTable").append("<tr id=\""+key+"\"><td><a class=\"streamerpage\" href=\""+(streamers[key].url==null?(defaultpage+key):streamers[key].url=="null"?(defaultpage+key):streamers[key].url)+"\" target=\"_blank\">"+key+"</a></td>"+(streamers[key].flag?"<td><span style=\"color:#29CC29\">Online</span></td>":"<td><span style=\"color:#CC2929\">Offline</span></td>")+"<td><a title=\"Unfollow "+key+"\" class=\"fa fa-times fa-lg masterTooltip unfollowstreamer\" id=\"unfollow-"+key+"\" href=\"#\"></a></td></tr>");
			else
				$("#followingTable").append("<tr class=\"pure-table-odd\" id=\""+key+"\"><td><a class=\"streamerpage\" href=\""+(streamers[key].url==null?(defaultpage+key):streamers[key].url=="null"?(defaultpage+key):streamers[key].url)+"\" target=\"_blank\">"+key+"</a></td>"+(streamers[key].flag?"<td><span style=\"color:#29CC29\">Online</span></td>":"<td><span style=\"color:#CC2929\">Offline</span></td>")+"<td><a title=\"Unfollow "+key+"\" class=\"fa fa-times fa-lg masterTooltip unfollowstreamer\" id=\"unfollow-"+key+"\" href=\"#\"></a></td></tr>");
			$("#unfollow-"+key+"").bind("click", {name: key, remove: 1},followCurrent);
			if (streamers[key].flag){
				nstreams++;
				$("#streamersTableDiv").show();
				$("#streamersTable").show();
				if (nstreams % 2 == 0)
					$("#streamersTable").append("<tr id=\"row"+key+"\"><td><a title=\""+(streamers[key].title==null?"?":streamers[key].title=="null"?"?":streamers[key].title)+"\" class=\"streamerpage masterTooltip\" href=\""+(streamers[key].url==null?(defaultpage+key):streamers[key].url=="null"?(defaultpage+key):streamers[key].url)+"\" target=\"_blank\">"+key+"</a></td><td><img src=\""+(imageExists(defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype)?defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype:defaulticon+defaulticontype)+"\" title=\""+streamers[key].game+"\" class=\"masterTooltip\" width=\"30\" height=\"30\"/></td><td><span class=\"viewersclass\">"+streamers[key].viewers+"</span></td><td><a href=\"#\" title=\"Popout this stream\" class=\"masterTooltip popout fa fa-share-square-o fa-lg\"></a></td></tr>");
				else
					$("#streamersTable").append("<tr class=\"pure-table-odd\" id=\"row"+key+"\"><td><a title=\""+(streamers[key].title==null?"?":streamers[key].title=="null"?"?":streamers[key].title)+"\" class=\"streamerpage masterTooltip\" href=\""+(streamers[key].url==null?(defaultpage+key):streamers[key].url=="null"?(defaultpage+key):streamers[key].url)+"\" target=\"_blank\">"+key+"</a></td><td><img src=\""+(imageExists(defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype)?defaulticonpath+streamers[key].game.replace(/\:| /g,'')+defaulticontype:defaulticon+defaulticontype)+"\" title=\""+streamers[key].game+"\" class=\"masterTooltip\" width=\"30\" height=\"30\"/></td><td><span class=\"viewersclass\">"+streamers[key].viewers+"</span></td><td><a href=\"#\" title=\"Popout this stream\" class=\"masterTooltip popout fa fa-share-square-o fa-lg\"></a></td></tr>");

			}
		}
		$("#streamersTable").append("</tbody>");


		$(".masterTooltip").bind("mouseenter", showTooltip);

		$(".masterTooltip").bind("mouseleave", hideTooltip);
		$(".masterTooltip").bind("mousemove", updateTooltip);

		$(".popout").bind("click",popoutStream);


		$("#loadingFollowing").hide();
		$("#loadingStreams").hide();

		if (nfollowing <= 0){
			$("#noFollowing").show();
			$("#unfollowAll").hide();
			$("#manageFollowingButton").hide();
		}

		if (nstreams <= 0){
			$("#noStreams").show();
			$("#streamersTableDiv").hide();
			$("#streamersTable").hide();
		}

		chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
			tabUrl = arrayOfTabs[0].url;

			if (tabUrl.indexOf("www.twitch.tv/") != -1){
				var parts = tabUrl.split('/');
				var name = parts[3];
				name = name.toLowerCase();

				/* Check if name is a streamer */
					if (isAStreamer(name)){
						if (streamers[name]){
							remove = 1;
							$("#unfollowCurrentButton").show();
							$(".currentMessage").html(" Unfollow "+name);
							$("#unfollowCurrentButton").bind("click", {name: name, remove: remove},followCurrent);
							$("#unfollowCurrentButton").on({
							    mouseenter: function () {
							        $(".currentMessage").show();
							    },
							    mouseleave: function () {
							        $(".currentMessage").hide();
    							}
							});
						}
						else{
							remove=0;
							$("#followCurrentButton").show();
							$(".currentMessage").html(" Follow "+name);
							$("#followCurrentButton").bind("click", {name: name, remove: remove},followCurrent);
							$("#followCurrentButton").on({
							    mouseenter: function () {
							        $(".currentMessage").show();
							    },
							    mouseleave: function () {
							        $(".currentMessage").hide();
    							}
							});
						}
						//addToStorage(name);
					}
			}
		});

	});
});

function popoutStream(e){
	var url = $(this).parent().prev().prev().prev().children().first().attr('href');
	window.open(url+"/popout", url, "height=600,width=850");
	return false;
}

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
	var mousey = e.pageY - 50 - $('.tooltip').height(); //Get Y coordinates\
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
	user = user.toLowerCase();
	if (isAStreamer(user)){
		directFollow(user,0);
	}
	else{
		$("#fastFollowMessage").html("<br>Cannot find "+user);
		$("#fastFollowMessage").css("font-weight","bold");
		$("#fastFollowMessage").css("color","red");
		$("#fastFollowMessage").show();
	}
}

function showTwitchForm(){
	$("#inputTwitchUser").show();
}

function syncWithTwitch(limit, offset, done, following, add){
	var user = document.getElementById("syncWithTwitchInput").value;
	user = user.toLowerCase();
	if (user == "mlg360noscope420blazeit")
		window.open("http://youtu.be/kHYZDveT46c");
	if (!isAStreamer(user)){
		$("#importTwitchFailMessage").html("<br>Invalid Twitch username!");
		$("#importTwitchFailMessage").css("font-weight","bold");
		$("#importTwitchFailMessage").css("color","red");
		$("#importTwitchFailMessage").show();
		return;
	}
	var url = "https://api.twitch.tv/kraken/users/"+user+"/follows/channels?limit="+limit+"&offset="+offset;
	var appClientID = "tn2qigcd7zaj1ivt1xbhw0fl2y99c4y";
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
		xhr.setRequestHeader('Client-ID', appClientID)
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200){
				$(".importTwitchLoading").show();
				$("#submitButton").hide();
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
		$("#importDataFailMessage").html("<br>Invalid data format!");
		$("#importDataFailMessage").css("font-weight","bold");
		$("#importDataFailMessage").css("color","red");
		$("#importDataFailMessage").show();
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
	var appClientID = "tn2qigcd7zaj1ivt1xbhw0fl2y99c4y";
	xhr.open('get', 'https://api.twitch.tv/kraken/channels/'+channel,false);
	xhr.setRequestHeader('Client-ID', appClientID)
	xhr.send();
	if (xhr.status == "404" || xhr.status == "422")
		return false;
	else
		return true;
}
