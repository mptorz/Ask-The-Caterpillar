'use strict';

const functions = require('firebase-functions');
const DialogflowApp = require('actions-on-google').DialogflowApp;
const request = require('request');
const introduction = 'Hello I am a harm reduction assistant. Ask me questions about drugs!'

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
    if (request.body.result) {
        processV1Request(request, response);
    } else if (request.body.queryResult) {
        processV2Request(request, response);
    } else {
        console.log('Invalid Request');
        return response.status(400).end('Invalid Webhook Request (expecting v1 or v2 webhook request)');
    }
});

function processV1Request (request, response) {
    let action = request.body.result.action;
    let userQuery = request.body.result.resolvedQuery;
    const app = new DialogflowApp({request: request, response: response});
    const actionHandlers = {
        'input.welcome': () => {
            sendGoogleResponse(introduction);
            sendResponse(introduction);
        },
        'input.unknown': () => {
            apiHandler(userQuery).then((output) => {
            
                if (output.includes("ask")) {
                    app.ask(output);
                }else{
                    app.tell(output);  
                }
                
                sendResponse(output);
            }).catch((error) => {
                app.tell("There was an error. sorry " + error);
                sendResponse("There was an error. sorry " + error);
            });
        }
    };
    if (!actionHandlers[action]) {
        action = 'input.welcome';
    }
    actionHandlers[action]();

    function sendGoogleResponse (responseToUser) {
        if (typeof responseToUser === 'string') {
            app.ask(responseToUser);
        } else {
            let googleResponse = app.buildRichResponse().addSimpleResponse({
                speech: responseToUser.speech || responseToUser.displayText,
                displayText: responseToUser.displayText || responseToUser.speech
            });
            app.ask(googleResponse);
        }
    }
    function sendResponse (responseToUser) {
        if (typeof responseToUser === 'string') {
            let responseJson = {};
            responseJson.speech = responseToUser;
            responseJson.displayText = responseToUser;
            response.json(responseJson);
        } else {
            let responseJson = {};
            responseJson.speech = responseToUser.speech || responseToUser.displayText;
            responseJson.displayText = responseToUser.displayText || responseToUser.speech;
            response.json(responseJson);
        }
    }
}


function processV2Request (request, response) {
    let action = (request.body.queryResult.action) ? request.body.queryResult.action : 'input_unknown';
    let userQuery = request.body.queryResult.queryText;
    const actionHandlers = {
        'input.welcome': () => {
            sendResponse(introduction);
        },
        'input.unknown': () => {
            apiHandler(userQuery).then((output) => {
                sendResponse(output);
            }).catch((error) => {
                sendResponse("There was an error. sorry " + error);
            });
        },
    };
    if (!actionHandlers[action]) {
        action = 'input.welcome';
    }
    actionHandlers[action]();
    function sendResponse (responseToUser) {
        if (typeof responseToUser === 'string') {
            let responseJson = {fulfillmentText: responseToUser};
            response.json(responseJson);
        } else {
            let responseJson = {};
            responseJson.fulfillmentText = responseToUser.fulfillmentText;
            response.json(responseJson);
        }
    }
}

function apiHandler(query) {
    return new Promise((resolve, reject) => {
        request.post(
            {url:'https://www.askthecaterpillar.com/query', form: {query: query}},
            function(error,httpResponse,body){
                if (error) {
                    console.log(error);
                    reject(error);
                }
                console.log(body);
                var parsedBody = JSON.parse(body);
                let toReturn = parsedBody["data"]["messages"][0]["content"];
                console.log("returner: " + toReturn);
                resolve(toReturn);
            });
    });
}
