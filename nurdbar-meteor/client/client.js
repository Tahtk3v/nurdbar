Products = new Mongo.Collection('products');
Barusers = new Mongo.Collection('barusers');
Book = new Mongo.Collection('book');
BarLog = new Mongo.Collection('barlog');


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
    return Book.find()
  },
  barlog: function(){
    return Barlog.find()
  }
})