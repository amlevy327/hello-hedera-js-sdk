console.clear();
require("dotenv").config();
const {
	AccountId,
	PrivateKey,
	Client,
	TokenCreateTransaction,
	TokenType,
	TokenSupplyType,
	TransferTransaction,
	AccountBalanceQuery,
	TokenAssociateTransaction,
  AccountCreateTransaction,
  Hbar
} = require("@hashgraph/sdk");

// Configure accounts and client, and generate needed keys
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();

async function createFungibleToken() {
  ///// CREATE TREASURY ACCOUNT
  // Create new keys
  const newTreasuryPrivateKey = PrivateKey.generateED25519();
  const newTreasuryPublicKey = newTreasuryPrivateKey.publicKey;

  console.log("\nnewTreasuryPrivateKey: " + newTreasuryPrivateKey);
  console.log("\nnewTreasuryPublicKey: " + newTreasuryPublicKey);

  // Create a new account with 1,000 tinybar starting balance
  const newTreasuryAccount = await new AccountCreateTransaction()
    .setKey(newTreasuryPublicKey)
    .setInitialBalance(Hbar.fromTinybars(1000))
    .execute(client);

  // Get the new account ID
  const getTreasuryReceipt = await newTreasuryAccount.getReceipt(client);
  const newTreasuryAccountId = getTreasuryReceipt.accountId;

  console.log("\nNew treasury account ID: " + newTreasuryAccountId);

  const treasuryId = newTreasuryAccountId;
  const treasuryKey = newTreasuryPrivateKey;
  /////

  ///// CREATE ALICE ACCOUNT
  // Create new keys
  const newAlicePrivateKey = PrivateKey.generateED25519();
  const newAlicePublicKey = newAlicePrivateKey.publicKey;

  console.log("\nnewAlicePrivateKey: " + newAlicePrivateKey);
  console.log("\nnewAlicePublicKey: " + newAlicePublicKey);

  // Create a new account with 1,000 tinybar starting balance
  const newAliceAccount = await new AccountCreateTransaction()
    .setKey(newAlicePublicKey)
    .setInitialBalance(Hbar.fromTinybars(1000))
    .execute(client);

  // Get the new account ID
  const getAliceReceipt = await newAliceAccount.getReceipt(client);
  const newAliceAccountId = getAliceReceipt.accountId;

  console.log("\nNew Alice account ID: " + newAliceAccountId);

  const aliceId = newAliceAccountId;
  const aliceKey = newAlicePrivateKey;
  /////

	//CREATE FUNGIBLE TOKEN (STABLECOIN)
	let tokenCreateTx = await new TokenCreateTransaction()
		.setTokenName("USD Bar")
		.setTokenSymbol("USDB")
		.setTokenType(TokenType.FungibleCommon)
		.setDecimals(2)
		.setInitialSupply(10000)
		.setTreasuryAccountId(treasuryId)
		.setSupplyType(TokenSupplyType.Infinite)
		.setSupplyKey(supplyKey)
		.freezeWith(client);

	let tokenCreateSign = await tokenCreateTx.sign(treasuryKey);
	let tokenCreateSubmit = await tokenCreateSign.execute(client);
	let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
	let tokenId = tokenCreateRx.tokenId;
	console.log(`- Created token with ID: ${tokenId} \n`);

	//TOKEN ASSOCIATION WITH ALICE's ACCOUNT
	let associateAliceTx = await new TokenAssociateTransaction()
		.setAccountId(aliceId)
		.setTokenIds([tokenId])
		.freezeWith(client)
		.sign(aliceKey);
	let associateAliceTxSubmit = await associateAliceTx.execute(client);
	let associateAliceRx = await associateAliceTxSubmit.getReceipt(client);
	console.log(`- Token association with Alice's account: ${associateAliceRx.status} \n`);

	//BALANCE CHECK
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(treasuryId).execute(client);
	console.log(`- Treasury balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(aliceId).execute(client);
	console.log(`- Alice's balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);

	//TRANSFER STABLECOIN FROM TREASURY TO ALICE
	let tokenTransferTx = await new TransferTransaction()
		.addTokenTransfer(tokenId, treasuryId, -2500)
		.addTokenTransfer(tokenId, aliceId, 2500)
		.freezeWith(client)
		.sign(treasuryKey);
	let tokenTransferSubmit = await tokenTransferTx.execute(client);
	let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);
	console.log(`\n- Stablecoin transfer from Treasury to Alice: ${tokenTransferRx.status} \n`);

	//BALANCE CHECK
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(treasuryId).execute(client);
	console.log(`- Treasury balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(aliceId).execute(client);
	console.log(`- Alice's balance: ${balanceCheckTx.tokens._map.get(tokenId.toString())} units of token ID ${tokenId}`);
}
createFungibleToken();