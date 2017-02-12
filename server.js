'use strict';

var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');

var port = process.env.PORT || 3000;

var router = express.Router();


app.get('/webhook', function(req, res) {
	if (req.query['hub.mode'] === 'subscribe' &&
		req.query['hub.verify_token'] === 'this_is_my_token') {
		console.log('Validating webhook');
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error('Failed validation. Make sure the validation tokens match.');
		res.sendStatus(403);
	}
});

app.listen(port);
console.log('Magic happens on port ' + port);