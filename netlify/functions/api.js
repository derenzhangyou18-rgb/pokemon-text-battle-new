const serverless = require("serverless-http");
const { connectLambda } = require("@netlify/blobs");
const app = require("../../server");
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // serverless-http runs in Lambda compatibility mode, so connect the
  // Netlify Blobs context before the application opens its store.
  connectLambda(event);
  return handler(event, context);
};
