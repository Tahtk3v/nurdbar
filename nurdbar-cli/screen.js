var _ = require('underscore');
var blessed = require('blessed');

var config = require('./settings.json');

// Create a screen object.
screen = blessed.screen({
  autoPadding: true,
  smartCSR: true,
  tput: true,
  log: './debug.ui.log'
});

screen.title = 'Nrdbr';


require('./ddp.js')



var logo = blessed.box({
  top: '0',
  right: '0',
  align: 'right',
  width: '50%',
  height: '20%',
  content: asciiWrite('harkbar'),
  tags: true,
  keys: true,
  input: true,
  style: {
    fg: '#333333',
    focus: {
      bg: 'gray'
    },
    hover: {
      fg: 'yellow'
    }
  }
})

screen.append(logo);

screen.on('resize', function() {
  logo.setContent(screen.width > 120 ? logoImg.join('\n') : 'HarkBar');
});




// Create a box perfectly centered horizontally and vertically.
var ircbox = blessed.box({
  top: '25%',
  left: '0',
  width: '65%',
  height: '75%',
  content: '',
  scrollable: true,
  // alwaysScroll:true,
  // baseLimit:16,
  // childBase:16,
  // tags: true,
  // input:true,
  border: {
    type: 'line'
  },
  padding: {
    top: 1,
    left: 1,
    right: 1,
    bottom: 4
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#222222'
    },
    focus: {
      bg: 'gray'
    },
    hover: {
      bg: 'green'
    }
  }
});
screen.append(ircbox);


var ircboxlist = blessed.list({
  parent: ircbox,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  interactive: false,
  padding: 1,
  shrink: true,
  style: {
    bg: 'white',
    fg: 'black'
  }
})


renderIrc = function() {
  ircboxlist.clearItems();
  var items = _.sortBy(ddpclient.collections.ircfeed, function(item) {
    return item.date
  })
  _.each(items, function(item, index) {

    var msg = '' + index + ' ' + item.from + ': ' + item.message;
    ircboxlist.addItem(msg);
    // screen.log(msg);
    ircbox.scrollTo(ircboxlist.items.length);
  })
  //screen.log(ircboxlist.items.length);
  screen.render();
}

setInterval(renderIrc, 500);






// // If box is focused, handle `enter`/`return` and give us some more content.
// ircbox.key('enter', function(ch, key) {
//   ircbox.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
//   screen.render();
// });





var ircform = blessed.form({
  title: 'ircform',
  // input:true,
  keys: true,
  left: 0,
  bottom: 0,
  width: '65%',
  height: 3,
  bg: '#111111',
  fg: 'white',
  content: '>>>'
});
ircform.on('submit', function(data) {
  screen.log(JSON.stringify(data, null, 2));
  ddpclient.call(
    'ircMessage', [{
      message: data.textarea
    }],
    function(err, result) {
      screen.log('irc message send: ', result);
    },
    function() {
      screen.log('send');
    }
  )
  ircform.reset();
  irctextarea.clearValue();
  screen.render();
})
screen.append(ircform);
// ircform.on('focus',function(){
//   // ircform.enableInput();
//   // irctextarea.enableInput();
//   irctextarea.readInput(function(cn,ch){
//     screen.log(cn,ch);
//   });
//   screen.log('focused')
// })

var ircinput = blessed.textbox({
  title: 'ircinput',
  parent: ircform,
  // keys: true,
  // input:true,
  // shrink: true,
  left: 0,
  bottom: 0,
  right: 0,
  top: 0,
  // width:'100%',
  style: {
    bg: 'blue',
    focus: {
      bg: 'red'
    },
    hover: {
      bg: 'red'
    }
  }
})

var irctextarea = blessed.textarea({
  title: 'irctextarea',
  parent: ircinput,
  inputOnFocus: true,
  padding: 0,
  width: '100%',
  border: {
    type: 'line'
  },
  style: {
    fg: 'orange',
    bg: 'black',
    focus: {
      fg: 'white',
      bg: 'black'
    },
    hover: {
      bg: '#444444',
      borderFg: 'red'
    }
  }
})
irctextarea.key(['enter'], function() {
  screen.log('ircinput:', ircinput.value);
  screen.log('irctextarea:', irctextarea.value);
  ircform.submit();
})
irctextarea.key(['escape', 'C-c'], function(ch, key) {
  return process.exit(0);
});
irctextarea.key(['tab'], function(ch, key) {
  screen.log('tabbed irctextarea');
  // screen.focusNext();
});


// var irctextbox = blessed.textbox({
//   parent: irctextarea
// })
// irctextbox.key(['enter'],function(){
//   screen.log('irctextbox:',irctextbox.getValue());
// })












// Create a box perfectly centered horizontally and vertically.
var barbox = blessed.box({
  top: '25%',
  left: '65%',
  width: '35%',
  height: '75%',
  content: '...transactions...',
  padding: 2,
  // tags: true,
  // input:true,
  // border: {
  //   type: 'line'
  // },
  border: {
    type: 'bg'
  },
  style: {
    fg: '#cccccc',
    bg: '#111111',
    border: {
      fg: '#222222'
    },
    focus: {
      bg: 'gray'
    },
    hover: {
      bg: 'green'
    }
  }
});

// Append our box to the screen.
screen.append(barbox);




var barform = blessed.form({
  name: 'barform',
  // parent:barbox,
  // input:true,
  keys: true,
  left: '65%',
  bottom: 0,
  width: '35%',
  height: 2,
  style: {
    fg: 'white',
    bg: '#111111',
    focus: {
      bg: '#222222'
    },
    hover: {
      bg: '#444444'
    }
  }
});
screen.append(barform);

barform.on('submit', function(data) {
  screen.log(JSON.stringify(data, null, 2));
  ddpclient.call(
    'barMessage', [{
      message: data.textarea
    }],
    function(err, result) {
      screen.log('irc message send: ', result);
    },
    function() {
      screen.log('send');
    }
  )
  barform.reset();
  bartextarea.clearValue();
  screen.render();
})

var barinput = blessed.textbox({
  parent: barform,
  // keys: true,
  // input:true,
  // shrink: true,
  left: 0,
  bottom: 0,
  width: '100%',
  height: 3,
})

var bartextarea = blessed.textarea({
  title: 'bartextarea',
  parent: barinput,
  inputOnFocus: true,
  width: '100%',
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: '#111111',
    focus: {
      bg: '#222222'
    },
    hover: {
      bg: '#444444'
    }
  }
})
bartextarea.key(['enter'], function() {
  screen.log('barinput:', barinput.value);
  screen.log('bartextarea:', bartextarea.value);
  barform.submit();
})
bartextarea.key(['escape', 'C-c'], function(ch, key) {
  return process.exit(0);
});

function scan(data) {
  screen.log(JSON.stringify(data, null, 2));
  ddpclient.call(
    'barMessage', [{
      message: data
    }],
    function(err, result) {
      screen.log('irc message send: ', result);
    },
    function() {
      screen.log('send');
    }
  )
}














// Create a box perfectly centered horizontally and vertically.
var ddpbox = blessed.box({
  top: 0,
  left: 0,
  width: '50%',
  height: '25%',
  scrollable: true,
  alwaysScroll: true,
  scrollbar: true,
  baseLimit: 0,
  childBase: 0,
  padding: 1,
  style: {
    fg: 'gray',
    bg: 'clear',
    border: {
      fg: '#111111'
    },
    focus: {
      bg: 'gray'
    },
    hover: {
      bg: 'green'
    }
  }
});
screen.append(ddpbox);

var ddplist = blessed.list({
  parent: ddpbox,
  top: 0,
  left: 0,
  width: '50%',
  height: '100%',
  interactive: false
});


renderDDP = function() {
  ddplist.clearItems();
  _.each(ddpclient.collections.barlog, function(item) {
    ddplist.addItem(JSON.stringify(item.data));
    ddpbox.scrollTo(ddplist.items.length);
  })
  screen.render();

}


setInterval(renderDDP, 1000);







//
// // Add a PNG icon to the box (X11 only)
// var icon = blessed.image({
//   parent: box,
//   top: 0,
//   left: 0,
//   width: 'shrink',
//   height: 'shrink',
//   file: __dirname + '/my-program-icon.png'
// });

// If our box is clicked, change the content.
// box.on('click', function(data) {
//   box.setContent('{center}Some different {red-fg}content{/red-fg}.{/center}');
//   screen.render();
// });

// If box is focused, handle `enter`/`return` and give us some more content.
// box.key('enter', function(ch, key) {
//   box.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
//   box.setLine(1, 'bar');
//   box.insertLine(1, 'foo');
//   screen.render();
// });

screen.key(['tab'], function(ch, key) {
  switchFocus();
});

switchFocus = function(){
  screen.log('tabbed screen : switchFocus');
  if (screen.currentFocus === bartextarea) {
    screen.currentFocus = irctextarea;
    irctextarea.focus();
  } else {
    screen.currentFocus = bartextarea;
    bartextarea.focus();
  }
}

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});


// Focus our element.
bartextarea.focus();
screen.currentFocus = bartextarea;

// Render the screen.
screen.render();


// ========================
// SERIAL 
// ========================
var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort(config.serialport, {
    baudrate: 9600
  },
  false, // this is the openImmediately flag [default is true]
  function(error) {
    console.log(error);
  }
);

serialPort.open(function(error) {
  if (error) {
    console.log('failed to open: ' + error);
  } else {
    console.log('open');
    serialPort.on('data', function(data) {
      scan(new Buffer(data).toString('ascii'))
    });
  }
});