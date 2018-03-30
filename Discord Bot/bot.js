const Discord = require("discord.js");
const client = new Discord.Client();
const request = require('request');

client.on("ready", () => {
    console.log("Bot is ready!");
});

client.on("message", (message) => {
    let userQuery = message.content;
    if (userQuery.startsWith("caterpillar") && !message.author.bot) {
        let query = (/^\s*$/.test(userQuery.substr(11))) ? "Hi" : userQuery.substr(11);
        apiHandler(query).then((response) => {
            message.channel.send(response);
        });
    } else if (userQuery.startsWith("ctp") && !message.author.bot) {
        let query = (/^\s*$/.test(userQuery.substr(3))) ? "Hi" : userQuery.substr(3);
        apiHandler(query).then((response) => {
            message.channel.send(response);
        });
    }else if (message.channel.type === "dm" && !message.author.bot) {
        apiHandler(userQuery).then((response) => {
            message.channel.send(response);
        });
    }
});


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

client.login("SECRETKEY");