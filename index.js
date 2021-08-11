const { createServer } = require('http');
const express = require('express');
const { execute, subscribe } = require('graphql');
const { ApolloServer } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { typeDefs } = require('./schema');

(async () => {
  const PORT = 6969;
  const pubsub = new PubSub();
  const app = express();
  const httpServer = createServer(app);
  let currentNumber = 0;
  const resolvers = {
    Query: {
      currentNumber() {
        return currentNumber;
      },
    },
    Subscription: {
      numberIncremented: {
        subscribe: () => pubsub.asyncIterator(['NUMBER_INCREMENTED']),
      },
    },
  };

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const server = new ApolloServer({ schema, stopOnTerminationSignals: true });
  await server.start();
  server.applyMiddleware({ app });

  const subscriptionServer = SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: server.graphqlPath },
  );
  ['SIGINT', 'SIGTERM'].forEach(async (signal) => {
    process.on(signal, () => {
      subscriptionServer.close();
      process.exit(0);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`,
    );
    console.log(
      `🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`,
    );
  });

  function incrementNumber() {
    currentNumber += 1;
    pubsub.publish('NUMBER_INCREMENTED', { numberIncremented: currentNumber });
    setTimeout(incrementNumber, 10000);
  }
  // Start incrementing
  incrementNumber();
})();
