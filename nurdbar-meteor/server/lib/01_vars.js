Bar = {
  action: null,
  user: null,
  timeout: null,

  logout: function(msg, silent) {
    var self = this;
    if (self.timeout) {
      clearTimeout(self.timeout);
    }
    self.timeout = null;
    self.action = null;
    self.user = null;
    changeNick();
  },

  reset: function(msg, silent) {
    var self = this;
    self.timeout = null;
    self.action = null;
  },

  timeoutRefresh: function(silent) {
    var self = this;
    if (self.timeout) clearTimeout(self.timeout);
    self.timeout = setTimeout(function() {
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
    var list = self.list;
    _.each(list, function(item, index) {
      if (item.productName === addItem.productName) {
        list[index].amount = item.amount + addItem.amount;
        exists = true;
      }
    });
    if (exists === false)
      list.push(addItem);
    self.list = list;
  },

  total: function() {
    var self = this;
    var total = 0;
    _.each(self.list, function(item, index) {
        total = total + (item.amount * item.price);
    });
    return total;
  },

  reset: function(msg, silent) {
    var self = this;
    self.timeout = null;
    self.list = [];
  },

  timeoutRefresh: function(silent) {
    var self = this;
    if (self.timeout) clearTimeout(self.timeout);
    self.timeout = setTimeout(function() {
      self.reset()
    }, 60000);
  }
}

