if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

const express = require('express');
const Sentry = require('@sentry/node');
const compression = require('compression');
const morgan  = require('morgan');
const { ApolloServer } = require('apollo-server-express');
const { ApolloGateway } = require("@apollo/gateway");

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'profiles', url: 'https://api.test.datacite.org/people/graphql' }
    // more services
  ],
});
 
const server = new ApolloServer({
  gateway,
  subscriptions: false,
  introspection: true,
  playground: true
});

let app = express();

Sentry.init({ dsn: '__SENTRY_DSN__' });

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// compress responses
app.use(compression());

// logging
app.use(morgan('combined'));

server.applyMiddleware({ app });

if (typeof(PhusionPassenger) !== 'undefined') {
  app.listen('passenger');
} else {
  app.listen(3000);
}
 