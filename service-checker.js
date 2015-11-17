var https = require('follow-redirects').https;
var querystring = require('querystring');

exports.handler = function(event, context){

	// Define URL
	var url = 'dev.login.myob.com';

	var requestType = event.request_type;
	switch(requestType){
		case 'login_page':
			hitLoginPage(url);
			break;

		case 'access_token':
			getAccessToken(url, event.resource_id, event.auth);
			break;
		default:
			context.fail("ERR: 'request_type' IS NOT SUPPORTED OR NOT PROVIDED!");
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
			
			//Extract response
			var status = response.statusCode;
			
			response.on('data', function(chunk){
			 	var body = '';
			 	body += chunk;
			 	var returned_value = JSON.stringify({status_code: status});
			 	if(status != 200){
			 		console.log("ERR: " + loginSetting.host + loginSetting.path + " IS NOT RESPONDING!");
			 		context.fail(returned_value);
			 	}
			 	else{
			 		context.succeed(returned_value);
			 	}
			});
		};

		//Hitting login page
		var loginRequest = https.get(loginSetting, loginCallback).on('error', function(err){
			// Return error if host url is not found
			context.fail(err);
		});
		loginRequest.end();
	};

// ****************************************************************** //
	
	function getAccessToken(url, resource_id, auth){
		//Accesss token request setup
		var tokenPath = '/common/oauth2/token';
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
				context.fail("ERR: UNAUTHORIZED ACCESS! CHECK 'Authorization' HEADER");
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
					context.fail(JSON.stringify({status: status, message: "ERR: NO ACCESS TOKEN RETURNED!"}));
				}
			});
		};

		var getTokenRequest = https.request(getAccessTokenSetting, getTokenCallback).on('error', function(err){
			// Return error if host url is not found
			context.fail(err);
		});

		getTokenRequest.write(messageBody);
		getTokenRequest.end();
	};
};