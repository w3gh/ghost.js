'use strict';

var BNet = require('./lib/BNet');
var bn = new BNet('server.eurobattle.net', 'eurobattle', 6112);

bn.run();
