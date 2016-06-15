// code to run on server at startup
var irc_params = {
  server: Meteor.settings.server,
  port: 6667,
  nick: Meteor.settings.nickname,
  password: false,
  realname: Meteor.settings.realname,
  username: Meteor.settings.nickname,
  channels: Meteor.settings.channels,
  debug: true,
  stripColors: true
};

insertIrcMessage = function(x) {
  IrcFeed.insert(x);
}

changeNick = function(name) {
  var nick = name ? Meteor.settings.nickname + '-' + name : Meteor.settings.nickname;
  irc.send('NICK', nick);
  CURRENT_BAR_NAME = nick;
}

capIrcMessages = function() {
  IrcFeed.find({}, {
    sort: {
      date: -1
    },
    skip: 32
  }).forEach(function(item) {
    IrcFeed.remove(item._id);
  })
}

Meteor.startup(function() {
  irc = new IRC(irc_params);
  
  // clear old messages (quickfix)
  IRCMessages.find().forEach(function(message){
    IRCMessages.remove(message._id);
  })

  irc.connect();
  var query = IRCMessages.find({}, {
    sort: {
      date_time: -1
    }
  });
  var handle = query.observeChanges({
    added: function(id, ircMessageObject) {
      console.log("message added: ", ircMessageObject);

      var from    = ircMessageObject.handle;
      var to      = ircMessageObject.channel;
      var message = ircMessageObject.text;
      var action  = ircMessageObject.action;

      capIrcMessages();

      insertIrcMessage({
        date: new Date().getTime(),
        from: from,
        to: to,
        message: message,
        action: action
      });

      console.log('from %j to %j : %j', from, to, message)

      if (message) {
        var args = message.split(' ');
        var user = from;
        if (args && args.length === 1) {

          if (args[0] === '~help') {
            Meteor.call('help')
          }

          if (args[0] === '~stock') {
            Meteor.call('productList', message)
          }

          if (args[0] === '~balance') {
            getBalance([user]);
          }

          if (args[0] === '~aliases') {
            Meteor.call('userAliases', user);
          }

          if (args[0] === '~barusers') {
            Meteor.call('userList')
          }

          if (args[0] === '~shame') {
            Meteor.call('hallOfShame')
          }

          if (args[0] === '~transactions') {
            Meteor.call('listTransactions', user)
          }
        }

        if (args && args.length > 1) {

          if (args[0] === '~stock' && args[1]) {
            var queryList = message.replace('~stock ', '').split(',');
            console.log('query:', args[1], queryList);
            getStock(queryList);
          }

          if (args[0] === '~search' && args[1]) {
            var query = message.replace('~search ', '')
            Meteor.call('productSearch',query)
          }

          if (args[0] === '~balance' && args[1]) {
            var queryList = message.replace('~balance ', '').toLowerCase().split(',');
            console.log('balance query:', queryList);
            getBalance(queryList);
          }

          if (args[0] === '~buy' && args[1]) {
            var username = getUserWithName(user)
            if (!username) {
              log(user + ' is not a baruser.');
              return;
            }
            var productCount = 0
            var productName = null
            if (!!parseInt(args[1])) {
              // multiple items: ~buy 2 Club-Mate Cola
              productCount = parseInt(args[1])
              productName = _.rest(args,2).join(" ")

            } else {
              // one item: ~buy Club-Mate Cola
              productCount = 1
              productName = _.rest(args,1).join(" ")
            }
            Meteor.call('registerSell',productName, username.name, productCount)
          }

          if (args[0] === '~aliasadd' && args[1]) {
            var alias = args[1];
            if (alias) {
              Meteor.call('userAliasAdd',user,alias)
            }
          }

          if (args[0] === '~aliasremove' && args[1]) {
            var alias = args[1];
            if (alias) {
              Meteor.call('userAliasRemove',user,args[1])
            }
          }

          if (args[0] === '~productadd' && args[1] && args[2]) {
            if (!getUserWithName(user)) {
              log(user + ' is not a baruser.');
              return;
            }
            var productBarcode = args[1];
            var productName = _.rest(args,2).join(" ");
            if (productBarcode && productName) {
              Meteor.call('productAdd', productBarcode, productName);
            }
          }

          if (args[0] === '~sell' && args[1] && args[2] && args[3]) {
            var username = getUserWithName(user)
            if (!username) {
              log(user + ' is not a baruser.');
              return;
            }
            var productCount = parseInt(args[1]);
            var productPrice = parseFloat(args.pop());
            var productBarcode = _.rest(args,2).join(" ");

            Meteor.call('registerBuy', productBarcode, username.name, productCount, productPrice);

          }


        }
      }
    }
  })
});
