# NurdBar
Barsystem build in Meteor and NodeJS  

## Overview
##### Server
* nurdbar-server
* MongoDB

##### Client/Bar
* nurdbar-cli



### Server install:
Dependencies: meteor, mongodb
> note: you could also deploy your meteor app as a nodejs app. In that case you would not need meteor, but nodejs and npm. You could also make use of meteors build in mongodb and skip the mongodb install, but running mongo externaly is recommended :P

```bash
git clone https://github.com/nooitaf/nurdbar
cd nurdbar/nurdbar-meteor
cp settings.json.example settings.json
```
Edit `settings.json`:
```json
{
  "server": "irc.oftc.net", 
  "channels": [
    "#nurdbottest"
  ], 
  "nickname": "nurbarbot", 
  "realname": "nurbarbot"
}
```
Start the server
- option 1, using meteors build-in mongodb
```bash
meteor --settings settings.json
```
- option 2, using your own mongodb
```bash
export MONGO_URL=mongodb://localhost:27017/myapp; meteor --settings settings.json
```




### Client install:
Dependencies: nodejs, npm 
```bash
git clone https://github.com/nooitaf/nurdbar
cd nurdbar/nurdbar-cli
npm install
cp settings.json.example settings.json
```
Edit `settings.json` and set your scanner serialport and server ip
```json
{
  "serialport": "/dev/ttySCAN",
  "server": "10.208.10.15"
}
```
Start the bar
```bash
node main.js
```
