Bar = {
  action: null,
  user: null,
  timeout: null,

  logout: function(msg, silent) {
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

  reset: function(msg, silent) {
    var self = this;
    this.timeout = null;
    this.action = null;
  },

  timeoutRefresh: function(silent) {
    var self = this;
    if (this.timeout) clearTimeout(self.timeout);
    this.timeout = setTimeout(function() {
      self.logout()
    }, 60000);
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
    _.each(list, function(item, index) {
      if (item.productName === addItem.productName) {
        list[index].amount = item.amount + addItem.amount;
        exists = true;
      }
    });
    if (exists === false)
      list.push(addItem);
    this.list = list;
  },

  total: function() {
    var Bon = this;
    var total = 0;
    _.each(Bon.list, function(item, index) {
        total = total + (item.amount * item.price);
    });
    return total;
  },

  reset: function(msg, silent) {
    var self = this;
    this.timeout = null;
    this.list = [];
  },

  timeoutRefresh: function(silent) {
    var self = this;
    if (this.timeout) clearTimeout(self.timeout);
    this.timeout = setTimeout(function() {
      self.reset()
    }, 60000);
  }
}

