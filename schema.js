const { gql } = require('apollo-server-express');

const typeDefs = gql`
    type Query {
      currentNumber: Int
    }

    type Subscription {
      numberIncremented: Int
    }
`;

module.exports = { typeDefs };
