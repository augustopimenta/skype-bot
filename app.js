require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var Swagger = require('swagger-client');
var Promise = require('bluebird');
var url = require('url');
let https = require('https');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
	console.log('%s listening to %s', server.name, server.url);
});

let subscriptionKey = process.env.SEARCH_API_TOKEN;

let host = 'api.cognitive.microsoft.com';
let path = '/bing/v7.0/images/search';

let times = 1;
let imageType = 'png,jpeg';

let bing_image_search = function (text, session) {

    let search = text;
    if (/\!gif/.test(text)) {
        search = text.replace(/\!gif/, '').trim();
        imageType = 'gif';
    }
    if (/[x|X]\d{0,}$/.test(text)) {
        const parts = search.toLowerCase().split('x');
        search = parts[0].trim();
        times = Math.max(Math.min(10, parts[1]), 1);     
    } else {
        search = text.trim();
    }

    let request_params = {
        method: 'GET',
        hostname: host,
        path: path + '?safeSearch=Off&count=50&q=' + encodeURIComponent(search + ' imagetype:' + imageType),
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
        }
    };

    console.log(path + '?safeSearch=Off&count=50&q=' + encodeURIComponent(search + ` imagetype:${imageType}`));

    let req = https.request(request_params, response => {
        let body = '';
        response.on('data', function (d) {
            body += d;
        });
        response.on('end', function () {
            body = JSON.parse(body);

            if (body.value.length > 0) {
                for (let i = 0; i < times; i++) {
                    const randomIndex = Math.floor(Math.random() * body.value.length);

                    session.send({
                        attachments: [
                            {
                                contentType: 'image/' + body.value[randomIndex].encodingFormat,
                                contentUrl: body.value[randomIndex].contentUrl,
                                name: body.value[randomIndex].name
                            }
                        ]
                    });
                }
            } else {
                session.send('Não encontrei nada!');
            }
        });
        response.on('error', function (e) {
            console.log('Error: ' + e.message);
        });
    });
    req.end();
}

var connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var inMemoryStorage = new builder.MemoryBotStorage();

var bot = new builder.UniversalBot(connector, function(session) {
    var text = session.message.text;

    session.sendTyping();
    bing_image_search(text, session);
}).set('storage', inMemoryStorage);