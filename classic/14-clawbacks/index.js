const {
  Keypair,
  Server,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
  Account,
} = require("stellar-sdk");

const { config } = require("dotenv");

config();

/**
 * https://quest.stellar.org/learn/series/3/quest/4
 */
const main = async () => {
  const questKeypair = Keypair.fromSecret(process.env.SK);
  const destinationKeypair = Keypair.random();

  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());

  const transactionFund = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.createAccount({
        destination: destinationKeypair.publicKey(),
        startingBalance: "1000",
      })
    )
    .setTimeout(30)
    .build();

  transactionFund.sign(questKeypair);

  try {
    let res = await server.submitTransaction(transactionFund);
    console.log(`Transaction Successful! Hash: ${res.hash}`);
  } catch (error) {
    console.log(
      `${error}. More details:\n${JSON.stringify(
        error.response.data.extras,
        null,
        2
      )}`
    );
  }
  /**
   *
   *
   *
   */

  // Authorization Revocable (2) + Clawback Enabled (8) = 10
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.setOptions({
        setFlags: 10,
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(questKeypair);

  try {
    let res = await server.submitTransaction(transaction);
    console.log(`Transaction Successful! Hash: ${res.hash}`);
  } catch (error) {
    console.log(
      `${error}. More details:\n${JSON.stringify(
        error.response.data.extras,
        null,
        2
      )}`
    );
  }

  const clawbackAsset = new Asset(
    (code = "CLAWBACK"),
    (issuer = questKeypair.publicKey())
  );

  const paymentTransaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: clawbackAsset,
        source: destinationKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.payment({
        destination: destinationKeypair.publicKey(),
        asset: clawbackAsset,
        amount: "500",
      })
    )
    .setTimeout(30)
    .build();

  paymentTransaction.sign(questKeypair, destinationKeypair);

  await server.submitTransaction(paymentTransaction);

  const clawbackTransaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.clawback({
        asset: clawbackAsset,
        amount: "250",
        from: destinationKeypair.publicKey(),
      })
    )
    .setTimeout(30)
    .build();

  clawbackTransaction.sign(questKeypair);
  await server.submitTransaction(clawbackTransaction);
};

main();
