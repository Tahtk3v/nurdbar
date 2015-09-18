CURRENT_BAR_NAME = 'nurdbar';

Products = new Mongo.Collection('products');
Barusers = new Mongo.Collection('barusers');
Book = new Mongo.Collection('book');
IrcFeed = new Mongo.Collection('ircfeed', {
  capped: true,
  size: 10000,
  max: 5
});
BarLog = new Mongo.Collection('barlog');

Meteor.publish('barusers', function() {
  return Barusers.find({}, {
    sort: {
      name: 1
    }
  });
})

Meteor.publish('products', function() {
  return Products.find({}, {
    sort: {
      name: 1
    }
  });
})

Meteor.publish('book', function() {
  return Book.find({}, {
    sort: {
      date: -1
    },
    limit: 10
  });
})

Meteor.publish('barlog', function() {
  return BarLog.find({}, {
    sort: {
      date: -1
    },
    limit: 10
  });
})

Meteor.publish('ircfeed', function(limit) {
  return IrcFeed.find({}, {
    sort: {
      date: -1
    },
    limit: limit || 32
  });
})