if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

const express = require('express');
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
 