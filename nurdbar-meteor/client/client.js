Products = new Mongo.Collection('products');
Barusers = new Mongo.Collection('barusers');
BarLog = new Mongo.Collection('barlog');
Book = new Mongo.Collection('book');

Meteor.subscribe('barusers');
Meteor.subscribe('products');
Meteor.subscribe('books');
Meteor.subscribe('barlog');
Meteor.subscribe('ircfeed');

Router.route('/', function () {
  this.render('page');
});


Template.page.helpers({
  products: function(){
    return Products.find({},{sort:{name:1}})
  },
  barusers: function(){
    return Barusers.find({},{sort:{name:1}})
  },
  book: function(){
    return Book.find({},{sort:{date:-1}})
  }
})