
irc = null;
irc_server   = Meteor.settings.server;
irc_channels = Meteor.settings.channels;
irc_nickname = Meteor.settings.nickname;
irc_realname = Meteor.settings.realname;

insertIrcMessage = function(){
  IrcFeed.insert(IRCVar.get());
}

changeNick = function(name){
  var nick = name ? irc_nickname+'-' + name : irc_nickname;
  irc.send('NICK', nick);
  CURRENT_BAR_NAME = nick;
} 

capIrcMessages = function(){
  new Fiber(function(){
    IrcFeed.find({},{sort:{date:-1},skip:32}).forEach(function(item){
      IrcFeed.remove(item._id);
    })
  }).run();
}

Meteor.startup(function(){

   irc = new IRC.Client(irc_server, irc_nickname, {
    userName: irc_nickname,
    realName: irc_realname,
    debug: true,
    showErrors: true,
    autoRejoin: true,
    autoConnect: true,
    channels: irc_channels,
    secure: false,
    selfSigned: false,
    certExpired: false,
    floodProtection: true,
    floodProtectionDelay: 1000,
    stripColors: true,
    messageSplit: 400
  });
 
  irc.addListener('message#nodebottest', function (from, message) {
  });

  //This listener is for all the messages comming from irc
  irc.addListener('message', function (from, to, message) {

    capIrcMessages();
  
    new Fiber(function(){
      IRCVar.withValue({date:new Date().getTime(),from:from,to:to,message:message},insertIrcMessage);
    }).run();

    console.log('from %j to %j : %j',from, to, message)

    if (message){
      var args = message.split(' ');
      if (args && args.length === 1) {

        if (args[0] === '~help') {
          new Fiber(function(){
            Meteor.call('help')
          }).run();
        }

        if (args[0] === '~stock') {
          new Fiber(function(){
            Meteor.call('productList')
          }).run();
        }

        if (args[0] === '~balance') {
          new Fiber(function(){
            IRCVar.withValue([from.toLowerCase()],getBalance);
          }).run();
        }

        if (args[0] === '~barusers') {
          new Fiber(function(){
            Meteor.call('userList')
          }).run();
        }

        if (args[0] === '~shame') {
          new Fiber(function(){
            Meteor.call('hallOfShame')
          }).run();
        }

        if (args[0] === '~transactions') {
          new Fiber(function(){
            Meteor.call('listTransactions')
          }).run();
        }
      }

      if (args && args.length > 1) {

        if (args[0] === '~stock' && args[1]) {
          var queryList = message.replace('~stock ','').split(',');
          console.log('query:',args[1],queryList);
          new Fiber(function(){
            IRCVar.withValue(queryList,getStock);
          }).run();
        }

        if (args[0] === '~balance' && args[1]) {
          var queryList = message.replace('~balance ','').toLowerCase().split(',');
          console.log('balance query:',queryList);
          new Fiber(function(){
            IRCVar.withValue(queryList,getBalance);
          }).run();
        }

        if (args[0] === '~buy' && args[1]) {
          var queryList = message.replace('~buy ','').split(',');
          console.log('buy query:',queryList);
          new Fiber(function(){
            IRCVar.withValue({name:from,query:queryList},getBuy);
          }).run();
        }
      }
    }
  });

})
