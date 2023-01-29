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

const server = new Server("https://horizon-testnet.stellar.org");

/**
 * https://quest.stellar.org/learn/series/1/quest/3
 */
const main = async () => {
  // We'll need two keypairs for this transaction: our quest keypair (the one trusting the asset), and an issuer keypair (the one issuing the asset).
  const questKeypair = Keypair.fromSecret(process.env.SK);
  const issuerKeypair = Keypair.random();

  // We set up the server and account that will be used to build and submit the transaction.
  const questAccount = await server.loadAccount(questKeypair.publicKey());
  await fundAddress(issuerKeypair, questAccount, questKeypair, server);

  // We'll need to create an asset for our quest account to trust. A few quick notes about assets:
  // Assets can exist in three forms: alphanumeric 4, alphanumeric 12, and liquidity pool shares.
  // Alphanumeric asset codes must be less than or equal to 4 or 12 characters, respectively.
  // Asset codes are case-sensitive, so Pizza, PIZZA, and pizza are all different assets.
  // The issuer is the public key of the account that is issuing the asset. The issuing account can't hold a balance of its own asset. The asset's issuer field determines who you are trusting to send you this particular asset.
  const santaAsset = new Asset(
    (code = "SANTA"),
    (issuer = issuerKeypair.publicKey())
  );

  // Build the transaction
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: santaAsset,
        limit: "100",
        source: questKeypair.publicKey(),
      })
    )
    .setTimeout(30)
    .build();

  // Sign with our quest account
  transaction.sign(questKeypair);

  // Submit transaction
  await submitTtransaction(transaction, server);
};

main();
