// url de rappel ou callback
// localhost:1337/webhook?hub.verify_token=soudure&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe
// lancer ngrok.exe ce qui donne une adresse local protégé et accessible par l'app facebokk  https://494741ad.ngrok.io -> http://localhost:1337
// ainsi l'url final est : https://91c22c36.ngrok.io/webhook?hub.verify_token=soudure&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe
// pour que le webhook de l'app facebook soit vérifier il faut que le webhook soit activé avec node index.js en local
// curl -H "Content-Type: application/json" -X POST "localhost:1337/webhook" -d '{"object": "page", "entry": [{"messaging": [{"message": "TEST_MESSAGE"}]}]}'
//  avec clever-cloud url fixe https://mathmaths.cleverapps.io/webhook?hub.verify_token=soudure&hub.challenge=CHALLENGE_ACCEPTED&hub.mode=subscribe

'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
	// Construct the message body
	let request_body = {
		"recipient": {
		"id": sender_psid
		},
    "message": response
	}
  
	// Send the HTTP request to the Messenger Platform
	request({
		"uri": "https://graph.facebook.com/v2.6/me/messages",
		"qs": { "access_token": "EAAH4r8j8jTIBACJ07dACZCx7P9ltyBHII3kB9Q6PVvZBYvq3eA9zR582wxqHLNUOzrVtFoNvYNFz0hWEg2nVSPiVucMrZB3kNzlWXxZAYg4sriQODdWYG9fZCa6cHZAjKbZA1H4Pm5gfccZBkbwcKKoNxWT7SBlo3VCfxvZBdvto8BiFg6Xh6ihh1yKPN7moc4TEZD" },
		"method": "POST",           
		"json": request_body
	}, (err, res, body) => {
		if (!err) {
			console.log('message sent!')
		} else {
			console.error("Unable to send message:" + err);
		}
	}); 
}

// Handles messages events
function handleMessage(sender_psid, received_message) {
	let response;
	//Check if the message contains text
	if (received_message.text) {    
    // Create the payload for a basic text message
		response = {
			"text": 'You sent the message: "${received_message.text}". Now send me an image!'
		}
	}    
	// Sends the response message
	callSendAPI(sender_psid, response);    
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
	let response = {"text" : 'pouet'};
	callSendAPI(sender_psid, response);
}


// Webhook est un messager entre votre chatbot et une source d’information fourni par le client
// les nouveaux messages, sont envoyées en tant qu’évènements à votre webhook
// This endpoint is where the Messenger Platform will send all webhook events.
// the end-point URL provided by the client-side application
// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;
  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
		 // Gets the message. entry.messaging is an array, but 
		 // will only ever contain one message, so we get index 0
		let webhook_event = entry.messaging[0];
		console.log(webhook_event);
		 
		// Get the sender PSID
		let sender_psid = webhook_event.sender.id;
		console.log('Sender PSID: ' + sender_psid);
			
		// Check if the event is a message or postback and
		// pass the event to the appropriate handler function
		if (webhook_event.message) {
			handleMessage(sender_psid, webhook_event.message);        
		} else if (webhook_event.postback) {
			handlePostback(sender_psid, webhook_event.postback);
		} 
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
	} else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
	}
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "soudure"
	
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
	
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {  
	// Checks the mode and token sent is correct
	if (mode === 'subscribe' && token === VERIFY_TOKEN) {      
		// Responds with the challenge token from the request
		console.log('WEBHOOK_VERIFIED');
		res.status(200).send(challenge);    
	} else {
		// Responds with '403 Forbidden' if verify tokens do not match
		res.sendStatus(403);      
	}
  }
});


















