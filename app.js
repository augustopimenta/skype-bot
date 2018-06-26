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

var inMemoryStorage = new builder.MemoryBotStorage();

var bot = new builder.UniversalBot(connector, function(session) {
    var text = session.message.text;
    var message = session.message;

    var conversationId = message.address.conversation.id;

    addTokenToClient(connector, connectorApiClient).then(function (client) {
        var serviceUrl = url.parse(message.address.serviceUrl);
        var serviceScheme = serviceUrl.protocol.split(':')[0];
        client.setSchemes([serviceScheme]);
        client.setHost(serviceUrl.host);

        return client.Conversations.Conversations_GetConversationMembers({ conversationId: conversationId })
            .then(function (res) {
                printMembersInChannel(message.address, res.obj);
            });
    }).catch(function (error) {
        console.log('Error retrieving conversation members', error);
    });

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

    var mentions = message.entities
        .filter(m => (m.type === 'mention') && (m.mentioned.id !== botId) && (m.mentioned.id !== '*'));

    var hasAllMention = message.entities.find(m => m.id === '*');

    if (hasAllMention) {
        mentions = [];
    }

    if (mentions.length == 1) {
        session.send('Acho que você já sabe a resposta não é?');
        return;
    }

    if (mentions.length == 0) {

    }

    session.sendTyping();
    setTimeout(function() {
        var mention = mentions[Math.floor(Math.random() * mentions.length)];
        session.send('O(a) ' + mention.text + ' com certeza!');
    }, 4000);   
}).set('storage', inMemoryStorage);

function addTokenToClient(connector, clientPromise) {
    // ask the connector for the token. If it expired, a new token will be requested to the API
    var obtainToken = Promise.promisify(connector.getAccessToken.bind(connector));
    return Promise.all([obtainToken(), clientPromise]).then(function (values) {
        var token = values[0];
        var client = values[1];
        client.clientAuthorizations.add('AuthorizationBearer', new Swagger.ApiKeyAuthorization('Authorization', 'Bearer ' + token, 'header'));
        return client;
    });
}

// Create a message with the member list and send it to the conversationAddress
function printMembersInChannel(conversationAddress, members) {
    if (!members || members.length === 0) return;

    var memberList = members.map(function (m) { return '* ' + m.name + ' (Id: ' + m.id + ')'; })
        .join('\n ');

    var reply = new builder.Message()
        .address(conversationAddress)
        .text('These are the members of this conversation: \n ' + memberList);
    bot.send(reply);
}