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
    var text = session.message.text;
    var message = session.message;

    if (text.indexOf('?') <= 0) {
        session.send('Eu só respondo perguntas...');
        return;
    }

    var parts = text.split('?').filter(p => !!p);
    if (parts.length < 2) {
        session.send('Ta... mais e as opções?');
        return;
    }

    var botId = message.address.bot.id;

    //&& (m.mentioned.id === botId)

    console.log(botId);

    var mentions = message.entities
        .filter(m => m.type === 'mention');

    console.log(mentions[0]);

    if (mentions.length < 2) {
        session.send('Acho que você já sabe a resposta não é?');
        return;
    }

    session.sendTyping();
    setTimeout(function() {
        var mention = mentions[Math.floor(Math.random() * mentions.length)];

        session.send('A com certeza é o(a) <at>@' + mention.name + '</at>!');
    }, 4000);   
});

