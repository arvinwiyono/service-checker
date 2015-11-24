var hipchat = require('./hipchat-notification.js');

hipchat.sendAlert("Hello, this is not Arvin", "2194818", "U6dlQzULC4cwQLiCH2zrp7d9kxZQOBxatKWr4dk5", function(){
	console.log("End of Request!");
});