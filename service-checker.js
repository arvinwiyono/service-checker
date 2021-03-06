var https = require('follow-redirects').https;
var querystring = require('querystring');
var fs = require('fs');
var hipchat = require('./hipchat-notification.js');

exports.handler = function(event, context){

	var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
	
	var errorCallback = function(message){
		context.fail(message);
	};

	var alertHipChat = function(message){
		hipchat.sendAlert(message, config.room_id, config.hipchat_auth_token, errorCallback);
	};

	// Initialize environment to DEV
	var environment = ((config.env) ? config.env : 'dev');
	// Define URL
	if (environment == 'prod'){
		var url = 'login.myob.com';
	}
	else{
		var url = environment + '.login.myob.com';
	}

	var requestType = config.request_type;
	switch(requestType){
		case 'login_page':
			hitLoginPage(url);
			break;

		case 'access_token':
			getAccessToken(url, config.resource_id, config.auth);
			break;
		default:
			context.fail(JSON.stringify({status: 400, message: "ERR: 'request_type' IS NOT SUPPORTED OR NOT PROVIDED!"}));
	}

// ****************************************************************** //
	function hitLoginPage(url){
		// Request setup
		var loginPath = '/account/login';	
		var loginSetting = {
			host: url,
			path: loginPath,
			port: '443'
		};
		
		var loginCallback = function(response){
			console.log("Sending HTTPS /GET request to " + url + loginPath);
			
			// Analyze response code
			var status = response.statusCode;
			
			response.on('data', function(chunk){
			 	var body = '';
			 	body += chunk;
			 	var returned_value = JSON.stringify({status: status});
			 	if(status != 200){
			 		var msg = JSON.stringify({status: status, message: "ERR: " + loginSetting.host + loginSetting.path + " IS NOT RESPONDING!"});
			 		console.log(msg);
			 		alertHipChat(msg);
			 	}
			 	else{
			 		context.succeed(returned_value);
			 	}
			});
		};

		// Hitting login page
		var loginRequest = https.get(loginSetting, loginCallback).on('error', function(err){
			console.log("Host is not found!");
			// Return error if host url is not found
			alertHipChat(JSON.stringify({status: 404, message: "ERR: HOST " + url + " IS NOT FOUND!"}));
		});
		loginRequest.end();
	};

// ****************************************************************** //
	
	function getAccessToken(url, resource_id, auth){
		//Accesss token request setup
		var tokenPath = '/oauth2/token';
		var messageBody =  querystring.stringify({
			'grant_type': 'client_credentials',
			'resource': resource_id
		});

		var getAccessTokenSetting = {
			host: url,
			path: tokenPath,
			port: '443',
			method: 'POST',
			headers: {
				'Authorization': auth,
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		};

		// Getting access token
		var getTokenCallback = function(response){
			console.log("Sending HTTPS /POST request to " + url + tokenPath + " to get client access token");
			
			var status = response.statusCode;

			response.on('error', function(err){
				context.fail(err);
			});

			if(status == 401){
				var msg = JSON.stringify({status: 401, message: "ERR: UNAUTHORIZED ACCESS! CHECK 'Authorization' HEADER"});
				console.log(msg);
				// Send hipchat alert
			 	alertHipChat(msg);
			}
			response.on('data', function(chunk){
				var token = '';
				try{
					token += JSON.parse(chunk).access_token;
				}
				catch (e){
					console.log("WARNING: CANNOT PARSE ACCESS TOKEN!");
				}
				if(token && status == 200){
					context.succeed(JSON.stringify({status: status, access_token: (token.substring(0,20)+"...")}));
				}
				else{
					var msg = JSON.stringify({status: status, message: "ERR: NO ACCESS TOKEN RETURNED!"});
					console.log(msg);
					// Send hipchat alerts
			 		alertHipChat(msg);
				}
			});
		};

		var getTokenRequest = https.request(getAccessTokenSetting, getTokenCallback).on('error', function(err){
			console.log("Host is not found!");
			// Return error if host url is not found
			alertHipChat(JSON.stringify({status: 404, message: "ERR: HOST " + url + " IS NOT FOUND!"}));
		});

		getTokenRequest.write(messageBody);
		getTokenRequest.end();
	};
};