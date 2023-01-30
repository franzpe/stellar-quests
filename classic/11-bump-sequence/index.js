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
 * https://quest.stellar.org/learn/series/2/quest/5
 */
const main = async () => {
  const questKeypair = Keypair.fromSecret(process.env.SK);

  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());

  // First, we will create a transaction containing only a single operation: bumpSequence. The available options for this operation are:
  // bumpTo: The sequence number we want our account bumped to. It's like we're traveling forward in time!
  // source: (optional) The source account that will have its sequence number affected. As normal, you can ignore this option to have the operation default to the transaction's source account.
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.bumpSequence({
        bumpTo: (parseInt(questAccount.sequence) + 100).toString(),
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(questKeypair);

  try {
    let res = await server.submitTransaction(transaction);
    console.log(`Transaction Successful! Hash: ${res.hash}`);
  } catch (error) {
    console.log(`${error}. More details:\n${JSON.stringify(error, null, 2)}`);
  }

  // Now, we can build a new transaction starting from the bumped-to sequence number with the Quest Account as the source account. Below, we show a manageData operation, but you can use any operation you'd like for this second transaction.
  /* We are adding 99 here (instead of 100) because the `build()` method in
   * the first transaction has already incremented the sequence by one. */
  const bumpedAccount = new Account(
    questKeypair.publicKey(),
    (parseInt(questAccount.sequence) + 99).toString()
  );
  const nextTransaction = new TransactionBuilder(bumpedAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        name: "sequence",
        value: "bumped",
      })
    )
    .setTimeout(30)
    .build();

  nextTransaction.sign(questKeypair);
  const nextRes = await server.submitTransaction(nextTransaction);
  console.log(`Transaction Successful! Hash: ${nextRes.hash}`);
};

main();
