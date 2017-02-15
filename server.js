'use strict';

var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var request    = require('request');
var messages   = require('./messages');

var port = process.env.PORT || 3000;

var router = express.Router();

var index = 1;
var state = 'q';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function callSendAPI(messageData) {
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
		method: 'POST',
		json: messageData

	}, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			console.log('Successfully sent generic message with id %s to recipient %s',  messageId, recipientId);
		} else {
			console.error('Unable to send message.');
			console.error(response);
			console.error(error);
		}
	});
}

function sendTextMessage(recipientId, messageText) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: messageText
		}
	};

	callSendAPI(messageData);
}

function receivedMessage(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	console.log('Received message for user %d and page %d at %d with message:', senderID, recipientID, timeOfMessage);
	console.log(JSON.stringify(message));

	var messageId = message.mid;

	var newMessage = messages[index];
	var messageText = '';
	if (state === 'q') {
		sendTextMessage(senderID, newMessage.q);
	} else if (state === 'a') {
		newMessage.answer(message.text, function(id, prevId, callback){
			sendTextMessage(senderID, newMessage.reply);
		});
		
	}
	
}

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


app.post('/webhook', function (req, res) {
	
	var data = req.body;
	// Make sure this is a page subscription
	if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
		data.entry.forEach(function(entry) {
			var pageID = entry.id;
			var timeOfEvent = entry.time;

			// Iterate over each messaging event
			entry.messaging.forEach(function(event) {
				if (event.message) {
					receivedMessage(event);
				} else {
					console.log('Webhook received unknown event: ', event);
				}
			});
		});

		// Assume all went well.
		//
		// You must send back a 200, within 20 seconds, to let us know
		// you've successfully received the callback. Otherwise, the request
		// will time out and we will keep trying to resend.
		res.sendStatus(200);
	}
});



app.listen(port);
console.log('Magic happens on port ' + port);