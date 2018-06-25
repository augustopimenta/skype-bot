require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var Swagger = require('swagger-client');
var Promise = require('bluebird');
var url = require('url');

var connectorApiClient = new Swagger({
    url: 'https://raw.githubusercontent.com/Microsoft/BotBuilder/master/CSharp/Library/Microsoft.Bot.Connector.Shared/Swagger/ConnectorAPI.json',
    usePromise: true
});

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
	console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function(session) {
    var message = session.message.text;

    console.log(session.message);

    if (message.indexOf('?') <= 0) {
        session.send('Eu só respondo perguntas...');
        return;
    }

    var parts = message.split('?').filter(p => !!p);
    if (parts.length < 2) {
        session.send('Ta.... mais e as opções?');
        return;
    }

    session.sendTyping();
    setTimeout(function() {
        session.send('A com certeza é o ...');
    }, 2000);   
});

