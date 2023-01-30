const {
  Keypair,
  Server,
  TransactionBuilder,
  Networks,
  TimeoutInfinite,
  Operation,
  Asset,
  BASE_FEE,
} = require("stellar-sdk");

const { config } = require("dotenv");
const { submitTtransaction, fundAddress } = require("../_shared");

config();

/**
 * https://quest.stellar.org/learn/series/2/quest/2
 * Accounts are the backbone of Stellar applications and are part of any action you take on the network. One class of actions, and it's an important one, involves setting, modifying, or deleting data entries within an account's metadata. Data entries are key/value pairs and can be used to attach arbitrary, application-specific data to an account on the Stellar network. Each data entry increases the account's minimum balance by one base reserve (0.5 XLM).
 * In this quest, you will add a data entry to the Quest Account using the Manage Data operation.
 */
const main = async () => {
  // We'll need two keypairs for this transaction: our quest keypair (the one trusting the asset), and an issuer keypair (the one issuing the asset).
  const questKeypair = Keypair.fromSecret(process.env.SK);

  // We set up the server and account that will be used to build and submit the transaction.
  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());

  // Now, we are ready to build a transaction with a single manageData operation. The available options for this operation are:
  // name: The string value name of your key/value pair; must be less than or equal to 64 characters.
  // value: The value that will be assigned to the data[name] entry. This can be supplied as a string or as a Buffer. Both methods are demonstrated below. Supply null to delete a data entry.
  // source: (optional) The account you want to add, remove, or edit data entries for. Defaults to transaction's source account.
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        name: "HelloString",
        value: "World",
      })
    )
    .addOperation(
      Operation.manageData({
        name: "Hello",
        value: Buffer.from("Stellar Quest!"),
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
};

main();
