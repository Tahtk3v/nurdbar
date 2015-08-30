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