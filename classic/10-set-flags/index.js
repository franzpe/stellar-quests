const {
  Keypair,
  Server,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} = require("stellar-sdk");

const { config } = require("dotenv");

config();

/**
 * https://quest.stellar.org/learn/series/2/quest/5
 */
const main = async () => {
  const questKeypair = Keypair.fromSecret(process.env.SK);
  const issuerKeypair = Keypair.fromSecret(process.env.SK_ISSUER);

  const server = new Server("https://horizon-testnet.stellar.org");
  const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

  //We will need an asset we can control for this quest.
  // We name it CONTROL here because that's what we shall exercise over all who want some of it: total control! As you're questing, you can name the asset anything you like.
  const controlledAsset = new Asset(
    (code = "CONTROL"),
    (issuer = issuerKeypair.publicKey())
  );

  // Now, we will need to configure a transaction that issues an authorization-required and authorization-revocable asset from the issuing account to the Quest Account. First, let's use a setOptions operation to set some account-level flags for our issuer. The relevant option for this quest is setFlags, which uses a bitmap integer to set options on the source account concurrently. These flags are as follows:
  // Authorization Required (0x1): An issuer must approve an account before that account can hold its asset
  // Authorization Revocable (0x2): An issuer can revoke an existing trustline's authorization, preventing that account from transferring or trading the asset and closing open orders
  // Authorization Immutable (0x4): Neither of the other authorization flags (Authorization Required, Authorization Revocable) can be set, and the issuing account can't be merged
  // Clawback Enabled (0x8): An issuer can claw back any portion of an account's balance of the asset
  const transaction = new TransactionBuilder(issuerAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.setOptions({
        setFlags: 3,
      })
    )
    .addOperation(
      Operation.changeTrust({
        asset: controlledAsset,
        source: questKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.setTrustLineFlags({
        trustor: questKeypair.publicKey(),
        asset: controlledAsset,
        flags: {
          authorized: true,
        },
      })
    )
    .addOperation(
      Operation.payment({
        destination: questKeypair.publicKey(),
        asset: controlledAsset,
        amount: "100",
      })
    )
    .addOperation(
      Operation.setTrustLineFlags({
        trustor: questKeypair.publicKey(),
        asset: controlledAsset,
        flags: {
          authorized: false,
        },
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(questKeypair, issuerKeypair);

  try {
    let res = await server.submitTransaction(transaction);
    console.log(`Transaction Successful! Hash: ${res.hash}`);
  } catch (error) {
    console.log(`${error}. More details:\n${JSON.stringify(error, null, 2)}`);
  }
};

main();
