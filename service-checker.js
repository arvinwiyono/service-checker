var https = require('follow-redirects').https;
var querystring = require('querystring');

exports.handler = function(event, context){

	// Define URL
	var url = 'dev.login.myob.com';

	var requestType = event.request_type;
	switch(requestType){
		case 'get':
			hitLoginPage(url);
			break;

		case 'post':
			getAccessToken(url);
			break;
		default:
			context.fail(constructGeneralError("ERR: 'request_type' IS NOT SUPPORTED OR NOT PROVIDED!"));
	}

// ****************************************************************** //
	function hitLoginPage(url){
		var loginPath = '/account/login';	
		var loginSetting = {
			host: url,
			path: loginPath,
			port: '443'
		};
		
		//Hitting login page
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

		var loginRequest = https.get(loginSetting, loginCallback).on('error', function(err){
			context.fail(err);
		});
		loginRequest.end();
	};

// ****************************************************************** //
	
	function getAccessToken(url){
		//Accesss token request setup
		var tokenPath = '/common/oauth2/token';
		var messageBody =  querystring.stringify({
			'grant_type': 'client_credentials',
			'resource': '00000002-0000-0000-c000-000000000000'
		});

		var getAccessTokenSetting = {
			host: url,
			path: tokenPath,
			port: '443',
			method: 'POST',
			headers: {
				'Authorization': 'Basic N2I3NDVlZjktN2RhMS00MDc0LWIzMmEtNzZlNjZhZTJlYzU1OmYyOGQyYTFmLTQ1MDAtNDg3Zi04MDhmLWY2ZDg0MDY0ZTlkZg==',
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		};

		// Getting access token
		var getTokenCallback = function(response){
			console.log("Sending HTTPS /POST request to " + url + tokenPath + " to get client access token");
			
			response.on('data', function(chunk){
				try{
					var token = JSON.parse(chunk).access_token;
					if(token){
						context.succeed(JSON.stringify({status: response.statusCode, access_token: (token.substring(0,20)+"...")}));
					}
					else{
						context.fail("ERR: NO ACCESS TOKEN RETURNED!");
					}
				}
				catch (e){
					context.fail(e);
				}
			});
			response.on('error', function(err){
				context.fail(err);
			});
		};

		var getTokenRequest = https.request(getAccessTokenSetting, getTokenCallback).on('error', function(err){
			context.fail(err);
		});

		getTokenRequest.write(messageBody);
		getTokenRequest.end();
	};

};