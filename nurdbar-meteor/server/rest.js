/// REST

Router.route('/check/:name', {where: 'server'})
  .get(function () {
    console.log('check')
    var name = this.params.name.toString();
    if (name) {
      console.log('API: checking for name: ' + name)
      this.response.end(JSON.stringify(Barusers.findOne({name:name},{fields:{_id:0}}),null,2));
    } else {
      this.response.end({status:"fail",message:"no name given"});
    }
  })

// returns
/*

{
  "name": "nooitaf",
  "barcode": "nooitaf",
  "cash": 12
}

*/


Router.route('/book/:name', {where: 'server'})
  .get(function () {
    console.log('check')
    var name = this.params.name.toString();
    if (name) {
      console.log('API: checking for name: ' + name)
      var user = Barusers.findOne({name:name});
      var transactions = Book.find({userId:user._id},{sort:{date:-1}, fields:{_id:0, userId:0}, limit: 10}).fetch();
      var transactionsWithProducts = _.map(transactions, function(item){
        var product = Products.findOne({_id:item.productId});
        item.price = s.sprintf('%.2f',item.price||0.0);
        item['product'] = product;
        return item;
      })

      var output = {
        user: _.omit(user,'_id'),
        transactions: transactionsWithProducts
      }
      this.response.end(
        JSON.stringify(output,null,2)
      );
    } else {
      this.response.end({status:"fail",message:"no name given"});
    }
  })
