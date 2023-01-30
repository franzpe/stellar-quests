const {
  Keypair,
  Server,
  TransactionBuilder,
  Networks,
  Operation,
  BASE_FEE,
} = require("stellar-sdk");

const { config } = require("dotenv");

config();

/**
 * https://quest.stellar.org/learn/series/2/quest/3
 */
const main = async () => {
  const questKeypair = Keypair.fromSecret(process.env.SK);
  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());

  // Now, we build a transaction with a single setOptions operation. This particular operation is very powerful, and has many different options available to us. We won't focus on too many for now (the next quest will dive into even more of them). For this quest, the relevant options for this operation are:
  // homeDomain: The domain that will be linked to the account. This home domain is useful for asset issuers, federation lookups, validators, and some wallets. Domain names used here must be less than 32 characters.
  // source: (optional) The source account we are setting options for. Defaults to transaction source.
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.setOptions({
        homeDomain: "5uq9ztkrouav.runkit.sh",
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
