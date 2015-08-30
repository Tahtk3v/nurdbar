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

