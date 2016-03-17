var express = require('express');
var app = express();

var ONEDAY = 86400000;

app.use('/public', express.static(__dirname + '/public', { maxAge: ONEDAY }));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/index.html');
});


app.listen(5000, function () {
  console.log('Example app listening on port 5000!');
});