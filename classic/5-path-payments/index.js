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
 * https://quest.stellar.org/learn/series/1/quest/5
 */
const main = async () => {
  // For this example, we'll be using 4 (count 'em, FOUR!) different keypairs, and they all need to be funded beforehand:
  // questKeypair: Just like normal, this one will be derived from our secret key, and will be the source account for the path payment operation(s) when we get to them.
  // issuerKeypair: This will be an account that issues a custom asset we will pair with XLM for our offers.
  // distributorKeypair: An asset's issuer cannot hold the asset itself. So, for these offers to exist, we'll have to use a distribution account that will receive the custom asset from the issuer and then make some offers on the exchange from that account. (Note: It's not technically required, but a distinct distribution account is a design pattern and best practice for this kind of task. Read more about that in the Stellar Developer Documentation).
  // destinationKeypair: This will be the account on the receiving side of our path payment(s).
  const questKeypair = Keypair.fromSecret(process.env.SK);
  const issuerKeypair = Keypair.fromSecret(process.env.SK_ISSUER);
  const distributorKeypair = Keypair.fromSecret(process.env.SK_DISTRIBUTOR);
  const destinationKeypair = Keypair.fromSecret(process.env.SK_DESTINATION);

  // Pre Funding the accounts
  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());

  const pathAsset = new Asset(
    (code = "PATH"),
    (issuer = issuerKeypair.publicKey())
  );

  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: pathAsset,
        source: destinationKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.changeTrust({
        asset: pathAsset,
        source: distributorKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.payment({
        destination: distributorKeypair.publicKey(),
        asset: pathAsset,
        amount: "1000000",
        source: issuerKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.createPassiveSellOffer({
        selling: pathAsset,
        buying: Asset.native(),
        amount: "2000",
        price: "1",
        source: distributorKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.createPassiveSellOffer({
        selling: Asset.native(),
        buying: pathAsset,
        amount: "2000",
        price: "1",
        source: distributorKeypair.publicKey(),
      })
    )
    // Since path payments cross the order book, it's important to set safety parameters around the amount sent or the amount received (depending on which operation you're using)
    // sendAsset: The asset you're sending.
    // sendAmount: The strict amount of the Sending Asset you will send (excluding fees).
    // destination: The destination account's public key.
    // destAsset: The asset the destination account will receive (this is why our destination account already created the trustline for our custom asset).
    // destMin: Since path payments travel through live open offers, there is no static standard “rate” for sending and receiving. To counter this variable, you can guard the value conversion with this field to ensure the Destination will at least receive this amount of the Destination Asset.
    // path: (optional) This specifies the assets you want the payment to path through. You can find usable paths via the /paths/strict-send endpoint.
    // source: (optional) The source account for the Sending Asset. Defaults to transaction source.
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: Asset.native(),
        sendAmount: "1000",
        destination: destinationKeypair.publicKey(),
        destAsset: pathAsset,
        destMin: "1000",
      })
    )
    .setTimeout(50)
    .build();

  // Sign with our quest account
  transaction.sign(
    questKeypair,
    issuerKeypair,
    destinationKeypair,
    distributorKeypair
  );

  // Submit transaction
  await submitTtransaction(transaction, server);
};

main();
