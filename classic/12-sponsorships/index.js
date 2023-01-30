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
 * https://quest.stellar.org/learn/series/3/quest/2
 */
const main = async () => {
  const questKeypair = Keypair.fromSecret(process.env.SK);
  const sponsorKeypair = Keypair.fromSecret(process.env.SK_SPONSOR);

  const server = new Server("https://horizon-testnet.stellar.org");
  const sponsorAccount = await server.loadAccount(sponsorKeypair.publicKey());

  const transaction = new TransactionBuilder(sponsorAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: questKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.createAccount({
        destination: questKeypair.publicKey(),
        startingBalance: "0",
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: questKeypair.publicKey(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(questKeypair, sponsorKeypair);

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
};

main();
