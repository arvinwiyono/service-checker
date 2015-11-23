var https = require("https");
var querystring = require("querystring");

exports.sendAlert = function(message, room_id, auth_token){

	var messageBody =  querystring.stringify({
		'message': message,
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
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};

	var req = https.request(notificationSetting, function(response){
		console.log(response.statusCode);
	}).on('error', function(err){
		// Return error if host url is not found
		console.log(err);
	});

	req.write(messageBody);
	req.end();
}