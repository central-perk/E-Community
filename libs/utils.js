var crypto = require('crypto');
/**
 * Encipher the data
 * @return {String}
 */
exports.encipher = function(text) {
	var cipher = crypto.createCipher('aes-128-cbc', "mailcrypto");
	var crypted = cipher.update(text, 'utf8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
};
/**
 * Decipher the data
 * @return {String}
 */
exports.decipher = function(crypted) {
	var decipher = crypto.createDecipher('aes-128-cbc', 'mailcrypto');
	var dec = decipher.update(crypted, 'hex', 'utf8');
	dec += decipher.final('utf8');
	return dec;
};

exports.addAnchorTarget = function(str, target) {
	if (!str || !target) {
		return str;
	}
	str = str.replace(/<a\shref/, '<a target="' + target + '" href');
	return str;
};