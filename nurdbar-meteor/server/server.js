CURRENT_BAR_NAME = 'nurdbar';

Products = new Mongo.Collection('products');
Barusers = new Mongo.Collection('barusers');
Book = new Mongo.Collection('book');
IrcFeed = new Mongo.Collection('ircfeed', { capped : true, size : 10000, max : 5 });
BarLog = new Mongo.Collection('barlog');

Meteor.publish('book',function(){
  return Book.find({},{sort:{date:-1},limit:10});
})

Meteor.publish('barlog',function(){
  return BarLog.find({},{sort:{date:-1},limit:10});
})

Meteor.publish('ircfeed',function(limit){
  return IrcFeed.find({},{sort:{date:-1},limit:limit||32});
})

Meteor.absoluteUrl('',{secure:true});

var irc;
var irc_server   = Meteor.settings.server;
var irc_channels = Meteor.settings.channels;
var irc_nickname = Meteor.settings.nickname;
var irc_realname = Meteor.settings.realname;

var Future = Npm.require('fibers/future');
var Fiber = Npm.require('fibers');

IRCVar = new Meteor.EnvironmentVariable;

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

Bar = {
  action: null,
  user: null,
  timeout: null,

  logout: function(msg, silent){
    var self = this;
    if (this.timeout) {
      clearTimeout(self.timeout);
      log(msg || '\x0309o/\x03')
    }
    this.timeout = null;
    this.action = null;
    this.user = null;
    changeNick();
  },

  reset: function(msg, silent){
    var self = this;
    this.timeout = null;
    this.action = null;
  },

  timeoutRefresh: function(silent){
    var self = this;
    if (this.timeout) clearTimeout(self.timeout);
    this.timeout = setTimeout(function(){self.logout()},60000);
    if (!silent) {
      log('\x0309ya?\x03')
    }
  }
};

Bon = {
  list: [],
  timeout: null,

  add: function(addItem) {
    var self = this;
    var exists = false;
    var list = this.list;
    _.each(list, function(item, index){
        if (item.productName === addItem.productName) {
            list[index].amount = item.amount + addItem.amount;
            exists = true;
        }
    });
    if (exists === false)
      list.push(addItem);
    this.list = list;
  },

  reset: function(msg, silent){
    var self = this;
    this.timeout = null;
    this.list= [];
  },

  timeoutRefresh: function(silent){
    var self = this;
    if (this.timeout) clearTimeout(self.timeout);
    this.timeout = setTimeout(function(){self.reset()},60000);
  }
}

Meteor.methods({
  'ircMessage': function(data){
    var scan = data.message.replace(/\r\n/g,'').replace(/\n/g,'').toString();
    var args = scan.split(" ");
    Bar.timeoutRefresh(true);
    if ( args.length > 1 ) {
      if ( args[0] === "/nick" ) {
        var user = Barusers.findOne({name:args[1].toLowerCase()});

        if (user) {
          Bar.user = user;
          Bar.action = "";
          log('Hi ' + user.name + '!');
          changeNick(user.name);

        } else {
          Bar.user = true;
          changeNick(args[1]);
        }
        return true;
      }
    }

    if (!Bar.user) {
      var user = Barusers.findOne({name:scan.toLowerCase()});

      if (user) {
        Bar.user = user;
        Bar.action = "";
        log('Hi ' + user.name + '!');
        changeNick(user.name);
        return true;
      }

      else { 
        Bar.user = {};
        Bar.user.name = 'anonymous';
        changeNick(Bar.user.name);
      }
    }
    log(data.message);
    return true;
  },

  'getBarName': function(){
    return CURRENT_BAR_NAME;
  },

  'barLog': function(data){
    console.log('Barlog:'.yellow, data);
    BarLog.insert({date:new Date().getTime(),data:data});
  },

  //Send items on the receipt to the client
  'getBon': function(data){
    return Bon.list; 
  },

  //Incomming messages from bar console
  'barMessage': function(data){
    Bar.timeoutRefresh(true);

    var scan = data.message.replace(/\r\n/g,'').replace(/\n/g,'').toString();

    log('\x0304Scanned\x03 ' + scan, true);
    console.log('scan',scan);

    var user = Barusers.findOne({name:scan});
    var product = Products.findOne({$or:[{barcode:scan},{name:scan}]});

    if (Bar.user === true) {
        log("Login with valid user",1);
    }

    if (scan === 'cancel') {
      Bar.logout();
      Bon.reset();

    } else if (scan === 'shame') {
      Meteor.call("hallOfShame");

    } else if (user) {
      Bar.user = user;
      Bar.action = "";
      log('Hi ' + user.name + '!');
      changeNick(user.name);
      Bon.timeoutRefresh(true);
      var guestItemCount = 0;
      if (Bon.list.length > 0) {
        _.each(Bon.list, function(item, index) {
          if  (item.userName === "Guest") {
            guestItemCount++;
            Meteor.call('registerSell',item.productName, Bar.user.name, item.amount);
            Bon.list[index].userName = Bar.user.name;
          }
        });
        if (guestItemCount === 0) Bon.reset();
        else Bar.logout();
      }

    } else if (product && !Bar.action && !Bar.user) {
      // Show stock if product is scanned and not logged in
      //Meteor.call('productStock',product.barcode);
      //Bar.reset();
      Bon.timeoutRefresh(true);
      Bon.add({
        price: product.price,
        productName: product.name,
        amount: 1,
        type: 'sell',
        userName: 'Guest'
      });

    } else if (Bar.user && !Bar.action) {
      //Used is logged in
      if (scan.slice(0,4) === 'sell') {
        Bar.action = scan;
        scanSplit = scan.split(' ');
        if (scanSplit.length == 4) {
          Meteor.call('registerBuy', scanSplit[1], Bar.user.name, parseInt(scanSplit[2]), parseFloat(scanSplit[3]));
          Bar.reset();
	    }

      } else if (scan.slice(0,7) === "useradd") {
        var name = scan.split(" ")[1];
        Meteor.call("userAdd", name); 
        Bar.reset();

      } else if (scan.slice(0,10) === "productadd") {
        var product = scan.split(" ");
        if (product[1] && product[2]) {
          Meteor.call('productAdd', product[1], product[2]);
        }

      } else if (scan === 'balance') {
        Meteor.call("userBalance", Bar.user.name);
        
      } else if (scan.slice(0,7) === 'deposit') {
        Bar.action = scan;
        actionSplit = scan.split(' ')

        //Check if the command need a extra action
        if (actionSplit.length == 2 && parseInt(actionSplit[1])) {
          Meteor.call('userDeposit', Bar.user.name, actionSplit[1]);
          Bar.reset();
        }

      } else if (scan.slice(0,4) === 'take') {
        Bar.action = scan;
        actionSplit = scan.split(' ')

        //Check if the command need a extra action
        if (actionSplit.length == 2 && parseInt(actionSplit[1])) {
          Meteor.call('userTake', Bar.user.name, actionSplit[1]);
          Bar.reset();
        }

      } else if (product){
        Meteor.call('registerSell', product.barcode, Bar.user.name, 1);
        Bon.timeoutRefresh(true);
        Bon.add({
          price: product.price,
          productName: product.name,
          amount: 1,
          type: 'sell',
          userName: Bar.user.name
        });
        Bar.reset();
      }

    } else if (Bar.user && Bar.action) {
      //User is logged in and a second action is required
      if (Bar.action === 'deposit'){
        if (parseInt(scan)) {
          Meteor.call('userDeposit', Bar.user.name, scan);
          Bar.reset();
        }
      }

      if (Bar.action === 'sell'){
        scanSplit = scan.split(' ');
        if (scanSplit.length !== 3) {
          Bar.reset('Canceled. needed "barcode amount(int) price(float)"');    
        } else {
          Meteor.call('registerBuy', scanSplit[0], Bar.user.name, parseInt(scanSplit[1]), parseFloat(scanSplit[2]));
          Bar.reset();
        }
      }

    } else {
      log('Meh. something went wrong',true);
      Bar.reset();
    }
    return true;
  },

  'productAdd' : function(barcode, name){
    var item = Products.findOne({barcode:barcode});
    if (!item) {
      if (Products.insert({barcode:barcode,stock:0,price:0.0,name:name||'unnamed'})) {
        log(s.sprintf("Product %s added with barcode %s", name, barcode));
      };
    }
  },

  'productRemove': function(barcode){
    var item = Products.findOne({barcode:barcode});
    if (item) Products.remove(item._id);
  },

  'productUpdate': function(barcode,name){
    var item = Products.findOne({barcode:barcode});
    if (item) Products.update(item._id,{$set:{barcode:barcode,name:name||'unnamed'}});
  },

  'productStock': function(barcode){
    barcode = barcode && barcode.trim() || "";
    var product = Products.findOne({$or:[{barcode:barcode},{name:barcode}] });
    if (product){
      log(s.sprintf('%d of %s in stock for %.2f euro a piece.',product.stock,product.name, product.price))
      return product && product.stock;
    } else {
      log('\x0309meh.\x03')
      return false;
    }
  },

  'productList': function(){
    console.log('Populating ProductList');

    Products.find({},{sort:{name:1, stock:1}}).forEach(function(item){
      var row = '';
      row += s.lpad(item.stock, 4, " ");
      row += ' | ';
      row += s.rpad(item.name, 15, " ");

      log(row);
    });
  },

  'userList': function(){
    console.log('Populating UsersList');
    log(_.pluck(Barusers.find({},{sort:{cash:1}}).fetch(),'name').join(', '));
    return _.pluck(Barusers.find({},{sort:{cash:1}}).fetch(),'name');
  },

  'userAdd': function(name, barcode){
    if (!name) return;
    name = name.toLowerCase();
    barcode = barcode || name;
    var item = Barusers.findOne({$or:[{name:name},{barcode:barcode}]});
    if (!item) {
      if ( Barusers.insert({name:name,barcode:barcode,cash:0}) ) {
        log('User added: ' + name);
      }
    }
  },

  'userRemove': function(name){
    var item = Barusers.findOne({name:name.toLowerCase()});
    if (item) Barusers.remove(item._id);
  },

  'userUpdate': function(name,options){
    var item = Barusers.findOne({name:name.toLowerCase()});
    var _options = _.omit(options,['name','code']);
    if (item && _options) Barusers.update(item._id,{$set:_options});
  },

  'userBalance': function(name){
    console.log('userBalance: '+name);
    var user = Barusers.findOne({name:name.toLowerCase()});
    if (user) {
      log(s.sprintf("User %s has %.2f euro cash.", user.name, user.cash))
    }
  },

  'userDeposit': function(name,amount){
    var deposit = parseFloat(amount);
    var user = Barusers.findOne({name:name.toLowerCase()});
    if (user) {
      user.cash = user.cash + deposit;
      Barusers.update(user._id,{$set:{cash:user.cash}});
      Book.insert({
          type:'deposit', 
          date:new Date().getTime(), 
          amount:deposit, 
          productId:0, 
          userId:user._id,
          price:1
      })
      log(s.sprintf("Deposited %.2f euro for %s.", deposit, user.name));
      Meteor.call('userBalance',user.name);
    }
  },

  'userTake': function(name,amount){
    var deposit = parseFloat(amount) * -1;
    var user = Barusers.findOne({name:name.toLowerCase()});
    if (user) {
      user.cash = user.cash + deposit;
      Barusers.update(user._id,{$set:{cash:user.cash}});
      Book.insert({
          type:'deposit', 
          date:new Date().getTime(), 
          amount:deposit, 
          productId:0, 
          userId:user._id,
          price:1
      })
      log(s.sprintf("Widthdraw %.2f euro for %s.", parseFloat(amount), user.name));
      Meteor.call('userBalance',user.name);
    }
  },

  'hallOfShame': function(){
    var shames = Barusers.find({cash:{$lt:0}},{sort:{cash:-1}});
    shames.forEach(function(item){
      var row = '';
      row += s.lpad(s.sprintf("%.2f",item.cash), 8, " ");
      row += ' | ';
      row += s.rpad(item.name, 15, " ");
      log(row);
    });
    console.log("Shames: "+shames.count());
    if (shames.count() === 0) {
      log("W0000T no Shames");
    }
  },

  'registerSell': function(barcode, username, amount){

    if (amount === false) var amount = 1;

    var product = Products.findOne({$or:[{barcode:barcode},{name:barcode}]});
    var user = Barusers.findOne({name:username.toLowerCase()});
    if (  product
      &&  product.stock >= amount 
      &&  user
      //&&  user.cash >= product.price 
      ) {
      
      product.stock = product.stock - amount;
      user.cash = user.cash - (product.price * amount);

      if ( 
            Products.update(product._id,{$set:_.omit(product,'_id')})
        &&  Barusers.update(user._id,{$set:_.omit(user,'_id')}) 
        &&  Book.insert({
          type:'sell', 
          date:new Date().getTime(), 
          amount:amount, 
          productId:product._id, 
          userId:user._id,
          price:product.price
        })
        )
      {
        log(s.sprintf("Sold %s x %s to %s for %.2f euro.",amount, product.name, user.name, product.price * amount))
        if (user.cash < 0.0) {
          log('!speak ' + user.name + ' has no moneyz!');
        }
      }
    } else {
      log('\x0309meh.\x03')
    }
  },

  'registerBuy': function(barcode, username, amount, price){
    var product = Products.findOne({$or:[{barcode:barcode},{name:barcode}]});
    var user = Barusers.findOne({name:username.toLowerCase()});
    if (  product &&  user ) {
      
      product.stock = product.stock + amount;
      product.price = price;
      user.cash = user.cash + amount * product.price;
      Book.insert({
        type:'buy', 
        date:new Date().getTime(), 
        amount:amount, 
        productId:product._id, 
        userId:user._id,
        price:price
      })

      if ( Products.update(product._id,{$set:_.omit(product,'_id')}) &&  Barusers.update(user._id,{$set:_.omit(user,'_id')}) ){
        log(s.sprintf('The bar bought %d x %s for %.2f €uro from %s',amount,product.name,product.price, user.name));
      }
    }
  },

  'listTransactions': function(){
    console.log('Populating Transactions');
    Book.find({},{sort:{date:1}}).forEach(function(item){
      var row = '';
      var delimiter = ' : ';
      row += moment(item.date).format('DD/MM hh:mm:ss');
      row += delimiter;
      row += s.rpad(item.type, 8, " ");
      row += delimiter;
      row += s.rpad(item.amount, 3, " ");
      row += delimiter;
      product = Products.findOne({_id:item.productId});
      if (product)
        row += s.rpad(product.name, 12, " ");
      else
        row += s.rpad("", 12, " ");
      row += delimiter;
      row += s.pad(Barusers.findOne({_id:item.userId}).name, 12, " ","right");
      row += delimiter;
      row += s.sprintf('%.2f',item.price||0.0);

      log(row);
    })
  },

  'help': function(){
    log("No help yet you can read the code (https://github.com/nooitaf/nurdbar/)",internal);
  },

  'oldDataAddMembers': function(){
    _.each(oldData.members, function(member){
      Meteor.call('userAdd', member.nick, member.barcode);
    })
  },

  'oldDataAddProducts': function(){
    _.each(oldData.items, function(product){
      _.each(oldData.barcodedesc, function(desc){
        if (desc.barcode === product.barcode){
          Meteor.call('productAdd', product.barcode, desc.name);
        }        
      })
    })
  }
});




/// REST

// Global API configuration
var Api = new Restivus({
  apiPath: 'api/',
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  prettyJson: true,
  useDefaultAuth: true,
  version: 'v1'
});


Api.addRoute('ping', {authRequired: false}, {
  get: function() {
    console.log('piiiiiiiing')
    return {
      status:"success",
      message:"pong"
    };
  }
});

Api.addRoute('check/:name', {authRequired: false}, {
  get: function() {
    console.log('check')
    var name = this.urlParams.name;
    if (name) {
      console.log('API: checking for name: ' + name)
      return Barusers.findOne({name:name});
    } else {
      return {status:"fail",message:"no name given"};
    }
  }
});



