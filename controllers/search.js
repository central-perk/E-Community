exports.index = function (req, res, next) {
  var q = req.query.q;
  q = encodeURIComponent(q);
  res.redirect('http://www.baidu.com/s?q6='+encodeURIComponent('club.echuadan.com')+'&q1=' + q);
};
