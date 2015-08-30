# Setup

---

## Solution 1
##### Server 1
* MongoDB

##### Server 2
* Meteor Server

##### Client (Bar)
* Boot System
* Autologin
* Autostart Browser:  `chromium --kiosk http://localhost:3000`

---

## Solution 2
##### Server
* MongoDB

##### Client (Bar)
* Boot System
* Autologin
* Autostart Meteor
* Point Meteor's Mongo_url to MongoServer
* Autostart Browser:  `chromium --kiosk http://localhost:3000`

---

## Solution 3
##### Server
* Meteor server
* MongoDB

##### Client (Bar)
* Boot System
* Autologin
* Autostart Browser:  `chromium --kiosk http://server.url`

---

## Solution 4 (current)
##### Server
* nurdbar-server
* MongoDB

##### Client (Bar)
* Autostart nurdbar-cli

---


##### ExtraInfos:
http://superuser.com/questions/368439/fullscreen-browser  
