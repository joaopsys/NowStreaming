$(document).ready(function () {
	$("#notifications").bind("click", check_notifications);
	$("#checkadd").bind("click", check_sync);
	$("#checkreplace").bind("click", check_sync);
});

document.addEventListener('DOMContentLoaded', restore_options);

function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.local.get({
    notifications: true,
    add: true
  }, function(items) {
    document.getElementById('notifications').checked = items.notifications;
    document.getElementById('checkadd').checked = items.add;
    document.getElementById('checkreplace').checked = !(items.add);
  });
}

function check_notifications(){
	if(document.getElementById("notifications").checked) {
    	chrome.storage.local.set({'notifications': true}, function () {});
	}
	else{
		chrome.storage.local.set({'notifications': false}, function () {});
	}
}

function check_sync(){
	if(document.getElementById("checkadd").checked){
		chrome.storage.local.set({add: true}, function () {});
	}
	else{
		chrome.storage.local.set({add: false}, function () {});
	}
}