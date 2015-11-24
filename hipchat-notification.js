var https = require("https");
var querystring = require("querystring");

exports.sendAlert = function(message, room_id, auth_token, callback){

	var messageBody =  querystring.stringify({
		'message': "@all - " + message,
		'message_format': 'html',
		'from': 'AWS Lambda',
		'notify': true,
		'color': 'red'
	});

	var path = '/v2/room/' + room_id + '/notification?auth_token=' + auth_token;
	var notificationSetting = {
		host: 'api.hipchat.com',
		path: path,
		port: '443',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(messageBody)
		}
	};

	var req = https.request(notificationSetting, function(res){
		if(res){
			console.log("A NOTIFICATION ALERT HAS BEEN SENT TO THE HIPCHAT ROOM!");
			callback(message);
		}
	}).on('error', function(err){
		// Return error if host url is not found
		console.log(err);
	});

	req.write(messageBody);
	req.end();
}