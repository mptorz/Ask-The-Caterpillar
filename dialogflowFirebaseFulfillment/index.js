'use strict';

const functions = require('firebase-functions');
const DialogflowApp = require('actions-on-google').DialogflowApp;
const request = require('request');

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
    if (request.body.result) {
        processRequest(request, response);
    } else {
        console.log('Invalid Request');
        return response.status(400).end('Invalid Webhook Request (expecting v1 or v2 webhook request)');
    }
});

function processRequest (request, response) {
    let action = request.body.result.action;
    const app = new DialogflowApp({request: request, response: response});
    let userQuery = app.getRawInput();
    const actionHandlers = {
        'input.welcome': () => {
            let response = 'Hello, I am a harm reduction assistant. Disclaimer: The information provided by the app' +
                ' is not a substitute for advice from a medical professional. The content of the app may be inappropriate' +
                ' for general audience. If you want to continue, ask me questions about drugs! ';
            app.ask(response);
        },
        'input.unknown': () => {
            apiHandler(userQuery).then((response) => {

                if (response.includes("ask")) {
                    app.ask(response);
                }else if (response.includes("Sorry, but I couldn't determine what substance you were inquiring about")
                    || response.includes("Sorry, I know you want to know about mixing something with")) {
                    app.ask(response + " Please ask again or say quit.")
                }else if (userQuery.trim() === '') {
                    app.ask("Sorry, I didn't catch anything. Please ask a question or say quit.")
                }else{
                    app.tell(response);
                }
            }).catch((error) => {
                app.tell("There was an error. sorry " + error);
            });
        }
    };
    if (!actionHandlers[action]) {
        action = 'input.unknown';
    }
    actionHandlers[action]();
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
                let parsedBody = JSON.parse(body);
                let toReturn = parsedBody["data"]["messages"][0]["content"];
                console.log("api returned: " + toReturn);
                resolve(toReturn);
            });
    });
}
