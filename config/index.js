var path = require('path'),
	_ = require('lodash');

// process.env.NODE_ENV = 'production';


var config = require(path.join(__dirname, 'def'));
if (process.env.NODE_ENV && process.env.NODE_ENV == 'production') {
	config = _.merge(config, require('./pro'));
	config.isproduction = true;
}
module.exports = config;