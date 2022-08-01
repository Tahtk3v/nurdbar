Package.describe({
  summary: "NodeJS IRC client library",
  version: "2.0.0",
  name: "nooitaf:irc"
});

Npm.depends({
    "irc": "0.3.9"
});

Package.onUse(function (api, where) {
  api.versionsFrom('METEOR@1.0');
  api.addFiles('irc.js', 'server');
  if(api.export) api.export('IRC', 'server');
});
 