console.clear();
require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  TopicCreateTransaction,
  TopicMessageQuery,
  TopicMessageSubmitTransaction,
} = require("@hashgraph/sdk");

// Grab the OPERATOR_ID and OPERATOR_KEY from the .env file
const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = process.env.MY_PRIVATE_KEY;

// Build Hedera testnet and mirror node client
const client = Client.forTestnet();

// Set the operator account ID and operator private key
client.setOperator(myAccountId, myPrivateKey);

async function submitMessages() {
  // Create a new public topic
  let txResponse = await new TopicCreateTransaction().execute(client);

  // Grab the newly generated topic ID
  let receipt = await txResponse.getReceipt(client);
  let topicId = receipt.topicId;
  console.log(`Your topic ID is: ${topicId}`);

  // Submit messages
  await new TopicMessageSubmitTransaction({
    topicId: topicId,
    message: "Message 1",
  }).execute(client);

  await new TopicMessageSubmitTransaction({
    topicId: topicId,
    message: "Message 2",
  }).execute(client);

  await new TopicMessageSubmitTransaction({
    topicId: topicId,
    message: "Message 3",
  }).execute(client);
}

submitMessages();