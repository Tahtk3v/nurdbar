//File with functions

//Output to clients / IRC
log = function(str, internal) {

  console.log(str);

  if (internal != true) 
		irc.send('NOTICE',Meteor.settings.channels[0], ' ' + str);

  str = str.replace(/(\x03\d{0,2}(,\d{0,2})?|\u200B)/g, '');

  if (Bar.user && Bar.user.name) {
    IrcFeed.insert({
      date: new Date().getTime(),
      from: Meteor.settings.nickname + '-' + Bar.user.name,
      to: '*',
      message: str
    });
  } else {
    IrcFeed.insert({
      date: new Date().getTime(),
      from: Meteor.settings.nickname,
      to: '*',
      message: str
    });
  }

  capIrcMessages();

}

getStock = function(names) {
  _.each(names, function(name) {
    Meteor.call('productStock', name)
  })
}

getBalance = function(names) {
  _.each(names, function(name) {
    Meteor.call('userBalance', name)
  })
}

getBuy = function(obj) { // {name:"",items:[]}
  _.each(obj.items, function(item) {
    Meteor.call('registerSell', item, obj.name)
  })
}

getUserWithName = function(query) {
  query = String(query);
  if (!query) return false;
  return Barusers.findOne({
    $or: [{
      name: new RegExp(query,"i")
    }, {
      barcode: query
    },{
      aliases: {
        $in: [query]
      }
    }]
  });
}