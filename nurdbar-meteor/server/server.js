
// Meteor.absoluteUrl('',{secure:true});

Meteor.methods({
  ircMessage: function(data){
    var scan = data.message.replace(/\r\n/g,'').replace(/\n/g,'').toString();
    var args = scan.split(" ");
    Bar.timeoutRefresh(true);
    if ( args.length > 1 ) {
      if ( args[0] === "/nick" ) {
        var user = getUserWithName(args[1]);

        if (user) {
          Bar.user = user;
          Bar.action = "";
          //log('Hi ' + user.name + '!');
          changeNick(user.name);

        } else {
          Bar.user = true;
          changeNick(args[1]);
        }
        return true;
      }
    }

    if (!Bar.user) {
      var user = getUserWithName(scan);

      if (user) {
        Bar.user = user;
        Bar.action = "";
        // log('Hi ' + user.name + '!');
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

  getBarName: function(){
    return CURRENT_BAR_NAME;
  },

  barLog: function(data){
    console.log('Barlog:'.yellow, data);
    BarLog.insert({date:new Date().getTime(),data:data});
  },

  //Send items on the receipt to the client
  getBon: function(data){
    return Bon.list; 
  },

  // reset the user timeout on interaction
  barTimeoutRefresh: function(){
    Bar.timeoutRefresh(true);
  },

  //Incomming messages from bar console
  barMessage: function(data){
    Bar.timeoutRefresh(true);

    var scan = data.message.replace(/\r\n/g,'').replace(/\n/g,'').toString();

    log('\x0304Scanned\x03 ' + scan, true);
    console.log('scan',scan);

    var user = getUserWithName(scan);;
    var product = Products.findOne({$or:[{barcode:scan},{name:scan}]});

    if (Bar.user === true) {
        log("Login with valid user",1);
    }
    if (scan === 'barusers') {
      Meteor.call('userList')
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
            Meteor.call('registerSell',item.productName, Bar.user.name, item.amount, 1);
            Bon.list[index].userName = Bar.user.name;
          }
        });
        if (guestItemCount === 0) Bon.reset();
        else {
          var total = Bon.total();
          Bon.add({price: total, amount: 0, type:'Total', userName: Bar.user.name, productName: 'Total'});
          Bar.logout();
        }
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
        if (scanSplit.length === 4) {
          Meteor.call('registerBuy', scanSplit[1], Bar.user.name, parseInt(scanSplit[2]), parseFloat(scanSplit[3]));
          Bar.reset();
        }

      } else if (scan.slice(0,7) === "useradd") {
        var name = scan.split(" ")[1];
        Meteor.call("userAdd", name); 
        Bar.reset();

      } else if (scan.slice(0,10) === "productadd") {
        var product = scan.split(" ");
        var productBarcode = product[1];
        var productName = _.rest(product,2).join(" ");
        if (productBarcode && productName) {
          Meteor.call('productAdd', productBarcode, productName);
        }

      } else if (scan === 'balance') {
        Meteor.call("userBalance", Bar.user.name);
        
      } else if (scan.slice(0,7) === 'deposit') {
        Bar.action = 'deposit'
        var scanSplit = scan.split(" ")
        var cash = parseFloat(scanSplit[1])
        //Check if the command need a extra action
        if (scanSplit.length === 2 && cash && cash > 0) {
          Meteor.call('userDeposit', Bar.user.name, cash);
          Bar.reset();
        }

      } else if (scan.slice(0,4) === 'take') {
        Bar.action = 'take';
        var scanSplit = scan.split(" ")
        var cash = parseFloat(scanSplit[1])
        //Check if the command need a extra action
        if (scanSplit.length === 2 && cash && cash > 0) {
          Meteor.call('userTake', Bar.user.name, cash);
          Bar.reset();
        }

      } else if (scan.slice(0,4) === 'give') {
        Bar.action = 'give';
        var scanSplit = scan.split(" ")
        var cash = parseFloat(scanSplit[2])
        var receiver = String(scanSplit[1])
        //Check if the command need a extra action
        if (scanSplit.length === 3 && cash && cash > 0 ) {
          Meteor.call('userGive', Bar.user.name, receiver, cash);
          Bar.reset();
        }

      } else if (product){
        Meteor.call('registerSell', product.barcode, Bar.user.name, 1);
        Bar.reset();
      }

    } else if (Bar.user && Bar.action) {
      //User is logged in and a second action is required
      if (Bar.action === 'deposit'){
        scan = parseFloat(scan)
        if (scan && scan > 0) {
          Meteor.call('userDeposit', Bar.user.name, scan);
          Bar.reset();
        }
      }
      if (Bar.action === 'take'){
        scan = parseFloat(scan)
        if (scan && scan > 0) {
          Meteor.call('userTake', Bar.user.name, scan);
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

  productAdd : function(barcode, name){
    var item = Products.findOne({barcode:barcode});
    if (!item) {
      if (Products.insert({barcode:barcode,stock:0,price:0.0,name:name||'unnamed'})) {
        log(s.sprintf('Product "%s" added with barcode %s', name, barcode));
      };
    }
  },

  productRemove: function(barcode){
    var item = Products.findOne({barcode:barcode});
    if (item) Products.remove(item._id);
  },

  productUpdate: function(barcode,name){
    var item = Products.findOne({barcode:barcode});
    if (item) Products.update(item._id,{$set:{barcode:barcode,name:name||'unnamed'}});
  },

  productStock: function(barcode){
    barcode = barcode && barcode.trim() || "";
    var product = Products.findOne({$or:[{barcode:barcode},{name:barcode}] });
    if (product){
      log(s.sprintf('%d of "%s" in stock for %.2f euro a piece.',product.stock,product.name, product.price))
      return product && product.stock;
    } else {
      log('\x0309meh.\x03')
      return false;
    }
  },

  productList: function(){
    console.log('Populating ProductList');

    Products.find({stock:{$gt:0}},{sort:{name:1, stock:1}}).forEach(function(item){
      var row = '';
      row += s.lpad(item.stock, 4, " ");
      row += ' | ';
      row += s.lpad(s.sprintf('%.2f',item.price), 6, " ");
      row += ' | ';
      row += s.rpad(item.name, 15, " ");

      log(row);
    });
  },

  productSearch: function(userQuery){
    var query = new RegExp(userQuery,'i')
    Products.find({$or:[{name:query}]}).forEach(function(item){
      var row = '';
      row += s.lpad(item.stock, 4, " ");
      row += ' | ';
      row += s.lpad(s.sprintf('%.2f',item.price), 6, " ");
      row += ' | ';
      row += s.rpad(item.name, 15, " ");

      log(row);
    });
  },

  userList: function(){
    console.log('Populating UsersList');
    log(_.pluck(Barusers.find({},{sort:{cash:1}}).fetch(),'name').join(', '));
    return _.pluck(Barusers.find({},{sort:{cash:1}}).fetch(),'name');
  },

  userAdd: function(name, barcode){
    if (!name) return;
    name = name.toLowerCase();
    barcode = barcode || name;
    var item = getUserWithName(name);
    if (!item) {
      if ( Barusers.insert({name:name,barcode:barcode,cash:0,aliases:[]}) ) {
        log('User added: ' + name);
      }
    }
  },

  userRemove: function(name){
    var item = getUserWithName(name);
    if (item) Barusers.remove(item._id);
  },

  userUpdate: function(name,options){
    var item = getUserWithName(name);
    var _options = _.omit(options,['name','barcode']);
    if (item && _options) Barusers.update(item._id,{$set:_options});
  },

  userAliases: function(name){
    var user = getUserWithName(name);
    var aliases = user.aliases && user.aliases.length ? user.aliases : false;
    if (user && aliases){
      if (aliases.length === 1) {
        log(s.sprintf("User %s has aliases: %s", user.name, aliases[0]));
      } else if (aliases.length === 2) {
        var aliasListString = aliases.join(', ');
        log(s.sprintf("User %s has aliases: %s", user.name, aliasListString));
      } 
    } else if (user) {
      log(s.sprintf("User %s has no aliases.", user.name));
    } else {
      log(s.sprintf("No user?"));
    }
  },

  userAliasAdd: function(name,alias){
    var item = getUserWithName(name);
    var aliasuser = getUserWithName(alias);
    if (!aliasuser) {
      if (!item.aliases) item['aliases'] = [];
      item.aliases.push(alias);
      Barusers.update(item._id,{$set:_.omit(item,'_id')})
      log('alias "' + alias + '" added.');
    } else {
      log('sry, alias base belong to ' + aliasuser.name);
    }
  },

  userAliasRemove: function(name,alias){
    var item = getUserWithName(name);
    item.aliases = _.without(item.aliases,alias);
    Barusers.update(item._id,{$set:_.omit(item,'_id')})
    log('alias removed.');
  },

  userBalance: function(name){
    console.log('userBalance: '+name);
    var user = getUserWithName(name);
    if (user) {
      log(s.sprintf("User %s has %.2f euro cash.", user.name, user.cash))
    }
  },

  userDeposit: function(name,amount){
    var deposit = parseFloat(amount);
    var user = getUserWithName(name);
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

  userTake: function(name,amount){
    var withdrawal = parseFloat(amount);
    var user = getUserWithName(name);
    if (user) {
      user.cash = user.cash - withdrawal;
      Barusers.update(user._id,{$set:{cash:user.cash}});
      Book.insert({
          type:'withdraw', 
          date:new Date().getTime(), 
          amount:withdrawal, 
          productId:0, 
          userId:user._id,
          price:1
      })
      log(s.sprintf("Withdrew %.2f euro for %s.", parseFloat(amount), user.name));
      Meteor.call('userBalance',user.name);
    }
  },

  userGive: function(sender,receiver,amount){
    amount = parseFloat(amount);
    sender = getUserWithName(sender);
    receiver = getUserWithName(receiver);

    if (!amount){
      log(s.sprintf("Amount not a valid float."));
      return;
    }
    if (!sender || !receiver){
      if (!receiver) {
        log(s.sprintf("Receiver unknown."));
      }
      return;
    }
    if (sender.cash < amount) {
      log(s.sprintf("User %s only has %.2f euro.", sender.name, sender.cash));
      return;
    }

    sender.cash = sender.cash - amount;
    receiver.cash = receiver.cash + amount;
    Barusers.update(sender._id,{$set:{cash:sender.cash}});
    Barusers.update(receiver._id,{$set:{cash:receiver.cash}});

    Book.insert({
        type:'withdraw', 
        date:new Date().getTime(), 
        amount:amount, 
        productId:0, 
        userId:sender._id,
        price:1
    })

    Book.insert({
        type:'deposit', 
        date:new Date().getTime(), 
        amount:amount, 
        productId:0, 
        userId:receiver._id,
        price:1
    })

    log(s.sprintf("%s (%.2f) gave %.2f euro to %s (%.2f)", sender.name, sender.cash, amount, receiver.name, receiver.cash));
  },

  hallOfShame: function(){
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

  registerSell: function(barcode, username, amount, nobon){

    if (amount === false) var amount = 1;

    var product = Products.findOne({$or:[{barcode:barcode},{name:barcode}]});
    var user = getUserWithName(username);
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
          log(s.sprintf('!espeak %s shame on you. Debt is %.2f', user.name, user.cash));
        }
      }
      if (!nobon) {
        Bon.timeoutRefresh(true);
        Bon.add({
          price: product.price,
          productName: product.name,
          amount: 1,
          type: 'sell',
          userName: Bar.user.name
        });
      }
    } else {
      log('\x0309meh.\x03')
    }
  },

  registerBuy: function(barcode, username, amount, price){
    var product = Products.findOne({$or:[{barcode:barcode},{name:barcode}]});
    var user = getUserWithName(username);
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
        log(s.sprintf('The bar bought %d x %s for %.2f euro from %s',amount,product.name,product.price, user.name));
      }
    }
  },

  listTransactions: function(from){
    console.log('Populating Transactions');
    Book.find({},{sort:{date:-1}, limit:10}).forEach(function(item){
      var row = '';
      var delimiter = ' : ';
      row += moment(item.date).format('DD/MM HH:mm:ss');
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
      // answer to user in pm
      irc.say(from, row);
    })
  },

  help: function(internal){
    log("No help yet you can read the code (https://github.com/nooitaf/nurdbar/)",internal);
  },

  oldDataAddMembers: function(){
    _.each(oldData.members, function(member){
      Meteor.call('userAdd', member.nick, member.barcode);
    })
  },

  oldDataAddProducts: function(){
    _.each(oldData.items, function(product){
      _.each(oldData.barcodedesc, function(desc){
        if (desc.barcode === product.barcode){
          Meteor.call('productAdd', product.barcode, desc.name);
        }        
      })
    })
  }
});

