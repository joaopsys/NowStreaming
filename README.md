NowStreaming
============

Get instant notifications when your favorite streamers start streaming!


Changelog
============

0.4:
- Many core changes to how/what data is stored
- Popup window got a facelift (added css, game, viewers, unfollow options)
- Some minor bug fixes
- Added some error/help messages that were missing

0.3:
- Badge text added to the icon, now it shows the number of online streamers
- Alpha popup page (not to say ugly) when user clicks icon, showing current streamers and follows
- Full refresh when user follows or unfollows

0.2:
- 'background' permission removed - This was non-sense
- Notifications are now awesome
- Sync storage is only used at start and on follow/unfollow, everything else is local
- 1 request to twitch API per minute (instead of 1 per follow)
- Updates and notifies when user starts chrome
- LOTS of bug fixes

0.1:
- First Alpha version
- Notifications 'kinda' working (super ugly, 2 buttons, urls not matching notification)
- Lots of bugs in sync and local storages
- Follow/Unfollow working but totally out of sync
- Lots of requests, lots of storage writes
- Lots of nulls everywhere