var DDPClient = require("ddp");

var config = require('./settings.json');

ddpclient = new DDPClient({
  // All properties optional, defaults shown 
  host: config.server,
  port: 3000,
  ssl: false,
  autoReconnect: true,
  autoReconnectTimer: 500,
  maintainCollections: true,
  ddpVersion: '1', // ['1', 'pre2', 'pre1'] available 
  // uses the SockJs protocol to create the connection 
  // this still uses websockets, but allows to get the benefits 
  // from projects like meteorhacks:cluster 
  // (for load balancing and service discovery) 
  // do not use `path` option when you are using useSockJs 
  useSockJs: true,
  // Use a full url instead of a set of `host`, `port` and `ssl` 
  // do not set `useSockJs` option if `url` is used 
  // url: 'wss://example.com/websocket'
});



ddplog = function(str) {
  //screen.log(str);
}



/*
 * Connect to the Meteor Server
 */
ddpclient.connect(function(error, wasReconnect) {
  // If autoReconnect is true, this callback will be invoked each time 
  // a server connection is re-established 
  if (error) {
    ddplog('DDP connection error!');
    return;
  }

  if (wasReconnect) {
    ddplog('Reestablishment of a connection.');
  }

  ddplog('connected!');

  // setTimeout(function () {
  //   /*
  //    * Call a Meteor Method
  //    */
  //   ddpclient.call(
  //     'deletePosts',             // name of Meteor Method being called 
  //     ['foo', 'bar'],            // parameters to send to Meteor Method 
  //     function (err, result) {   // callback which returns the method call results 
  //       ddplog('called function, result: ' + result);
  //     },
  //     function () {              // callback which fires when server has finished 
  //       ddplog('updated');  // sending any updated documents as a result of 
  //       ddplog(ddpclient.collections.posts);  // calling this method 
  //     }
  //   );
  // }, 3000);

  /*
   * Call a Meteor Method while passing in a random seed.
   * Added in DDP pre2, the random seed will be used on the server to generate
   * repeatable IDs. This allows the same id to be generated on the client and server
   */
  var Random = require("ddp-random"),
    random = Random.createWithSeeds("randomSeed"); // seed an id generator 

  // ddpclient.callWithRandomSeed(
  //   'createPost',              // name of Meteor Method being called 
  //   [{ _id : random.id(),      // generate the id on the client 
  //     body : "asdf" }],
  //   "randomSeed",              // pass the same seed to the server 
  //   function (err, result) {   // callback which returns the method call results 
  //     ddplog('called function, result: ' + result);
  //   },
  //   function () {              // callback which fires when server has finished 
  //     ddplog('updated');  // sending any updated documents as a result of 
  //     ddplog(ddpclient.collections.posts);  // calling this method 
  //   }
  // );


  // if (IrcInterval) clearInterval(IrcInterval);
  // IrcInterval = setInterval(function () {
  //   ddpclient.call(
  //     'ircFeedFetch',              // name of Meteor Method being called 
  //     [],
  //   //     function (err, result) {   // callback which returns the method call results 
  //   //       ddplog('called function, result: ' + result);
  //   //     },
  //     function (err, result) {   // callback which returns the method call results 
  //       //ddplog('called function, result: ' , result);
  //       //IrcFeed = result;
  //     },
  //     function () {              // callback which fires when server has finished 
  //       ddplog('irc updated');  // sending any updated documents as a result of 
  //       //ddplog(ddpclient.collections.posts);  // calling this method 
  //     }
  //   )
  // },1000);


  ddpclient.subscribe(
    'ircfeed', // name of Meteor Publish function to subscribe to 
    [IRCFEED_LIMIT], // any parameters used by the Publish function 
    function() { // callback when the subscription is complete 
      //ddplog('barlog:');
      // listBookings(ddpclient.collections.barlog);
      //ddplog(ddpclient.collections.book);
    }
  );


  ddpclient.subscribe(
    'barlog', // name of Meteor Publish function to subscribe to 
    [], // any parameters used by the Publish function 
    function() { // callback when the subscription is complete 
      //ddplog('barlog:');
      // listBookings(ddpclient.collections.barlog);
      //ddplog(ddpclient.collections.book);
    }
  );

  setInterval(function() {
    ddpclient.call(
      'getBarName', // name of Meteor Method being called 
      [],
      function(err, result) { // callback which returns the method call results 
        var nick = result;
        if (nick.split('-').length > 1) {
          nick = nick.split('-')[1];
        }
        logo.setContent(screen.width > 120 ? asciiText(nick) : nick);
      },
      function() { // callback which fires when server has finished 
      }
    )
  }, 1000);

  setInterval(function() {
    ddpclient.call(
      'getBon', // name of Meteor Method being called 
      [],
      function(err, result) { // callback which returns the method call results 
        updateBarboxlist(result);
      },
      function() { // callback which fires when server has finished 
      }
    )
  }, 1000);

  //   ddpclient.subscribe(
  //     'ircfeed',                  // name of Meteor Publish function to subscribe to 
  //     [],                       // any parameters used by the Publish function 
  //     function () {             // callback when the subscription is complete 
  //       ddplog('ircfeed:');
  //       ddplog(ddpclient.collections.ircfeed);
  //     }
  //   );

  //   /*
  //    * Observe a collection.
  //    */
  //   var observer = ddpclient.observe("ircfeed");
  //   observer.added = function(id) {
  //     ddplog("[ADDED] to " + observer.name + ":  " + id);
  //   };
  //   observer.changed = function(id, oldFields, clearedFields, newFields) {
  //     ddplog("[CHANGED] in " + observer.name + ":  " + id);
  //     ddplog("[CHANGED] old field values: ", oldFields);
  //     ddplog("[CHANGED] cleared fields: ", clearedFields);
  //     ddplog("[CHANGED] new fields: ", newFields);
  //   };
  //   observer.removed = function(id, oldValue) {
  //     ddplog("[REMOVED] in " + observer.name + ":  " + id);
  //     ddplog("[REMOVED] previous value: ", oldValue);
  //   };
  //   setTimeout(function() { observer.stop() }, 6000);
});

/*
 * Useful for debugging and learning the ddp protocol
 */
ddpclient.on('message', function(msg) {
  // ddplog("ddp message: " + msg);
  //screen.log(msg);
});

/*
 * Close the ddp connection. This will close the socket, removing it
 * from the event-loop, allowing your application to terminate gracefully
 */
//ddpclient.close();

/*
 * If you need to do something specific on close or errors.
 * You can also disable autoReconnect and
 * call ddpclient.connect() when you are ready to re-connect.
 */
ddpclient.on('socket-close', function(code, message) {
  ddplog("Close: %s %s", code, message);
});

ddpclient.on('socket-error', function(error) {
  ddplog("Error: %j", error);
});

/*
 * You can access the EJSON object used by ddp.
 */
var oid = new ddpclient.EJSON.ObjectID();