//File with functions

//Output to clients / IRC
log = function(str,internal){

  console.log(str);

  if (internal != true)
    irc.say(irc_channels[0],str);

  str = str.replace(/(\x03\d{0,2}(,\d{0,2})?|\u200B)/g, '');

  if (Bar.user && Bar.user.name) {
    new Fiber(function(){
      // IRCVar.withValue({date:Date(),from:from,to:to,message:message},insertIrcMessage);
      IrcFeed.insert({date:new Date().getTime(),from:irc_nickname+'-'+Bar.user.name,to:'*',message:str});
    }).run();
  } else {
    new Fiber(function(){
      IrcFeed.insert({date:new Date().getTime(),from:irc_nickname,to:'*',message:str});
    }).run();
  }

  capIrcMessages();

}

getStock = function(name){
  _.each(IRCVar.get(), function(query){
    Meteor.call('productStock',query)
  })
}

getBalance = function(name,cb){
  _.each(IRCVar.get(), function(query){
    Meteor.call('userBalance',query)
  })
}

getBuy = function(name,cb){
  var data = IRCVar.get();
  _.each(data.query, function(query){
    Meteor.call('registerSell',query,data.name)
  })
}

