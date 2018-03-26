'use strict';

const express = require('express');
const util = require('util');
const http = require('http');
const Bot  = require('@kikinteractive/kik');
const request = require('request');

const app = express();

const bot = new Bot({
	username: 'askcaterpillar',
	apiKey: 'MYSECRETAPIKEY',
	baseUrl: 'WEBHOOK_IP'
});

bot.updateBotConfiguration();

bot.onTextMessage((message) => {
	console.log('user message: ', message);
	apiHandler(message.body).then( (response) => {
		message.reply(response);
	});

});

const nonTextMsg = function(message) {
  message.reply("I can only handle text messages. Just ask me questions about drugs!");
};


const startChatAndScanData = function(message) {
  bot.getUserProfile(message.from)
        .then((user) => {
            message.reply(`Hey ${user.firstName}!  I am a harm reduction assistant. Ask me question about psychoactive substances!` +
            	` I have info about effects, toxicity, dose information, purity testing, tolerance, safety or drug interactions.`);
        });
};

bot.onStartChattingMessage(startChatAndScanData);
bot.onScanDataMessage(startChatAndScanData);
bot.onLinkMessage(nonTextMsg);
bot.onPictureMessage(nonTextMsg);
bot.onVideoMessage(nonTextMsg);
bot.onStickerMessage(nonTextMsg);


function apiHandler(query) {
    return new Promise((resolve, reject) => {
        request.post(
            {url: 'https://www.askthecaterpillar.com/query', form: {query: query}},
            function (error, httpResponse, body) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                console.log(body);
                let parsedBody = JSON.parse(body);
                let toReturn = parsedBody["data"]["messages"][0]["content"];
                console.log("api returned: " + toReturn);
                resolve(toReturn);
            });
    });
}


app.get('/', function(req, res){
	res.send('Hello. Check out askthecaterpillar.com');
});
 
app.use(bot.incoming());

app.listen(process.env.PORT || 8080, function(){
	console.log('Server started on port ' + (process.env.PORT || 8080));
});
