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
 * https://quest.stellar.org/learn/series/1/quest/4
 */
const main = async () => {
  // We only need the keypair for our quest account for this quest, and it will need to be funded.
  const questKeypair = Keypair.fromSecret(process.env.SK);

  //We'll also need our server and account to build and submit the transaction later on.
  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());

  // We'll need an asset to use as our counter-asset when we make our offers.
  // Below, I'm setting up the asset for USDC, issued by centre.io, but you can use any other asset on the testnet (or even create your own!)
  const usdcAsset = new Asset(
    (code = "USDC"),
    (issuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")
  );

  // We'll begin setting up our transaction, which looks pretty typical.
  // We will also need to create a trustline to our non-native asset before we can create any exchange offers.
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: usdcAsset,
      })
    )
    // Every offer is technically both a buy and sell offer. Selling 100 XLM for 10 USD is identical to buying 10 USD for 100 XLM. The difference is primarily syntactical to make it easier to reason about the creation of offers.
    // selling: The asset you're offering to give in the exchange (native XLM in the example below)
    // buying: The asset you're seeking to receive in the exchange (USDC in the example below)
    // buyAmount: The amount of the Buying asset you must receive for this offer to be taken
    // price: This one's a little more complicated. Divide the amount you're selling by the amount you're buying. For example, if you want to buy 100 USD for 1,000 XLM, your price would be 1000/100=10. The reason this can be tricky is that the result (10) isn't necessarily the amount of either the selling or buying asset, it's the price point for the counter asset of the offer.
    // offerId: (optional) Set to 0 to create a new offer. To update or delete an existing offer, use the offer ID here. Defaults to '0'.
    // source: (optional) The account that gives the selling asset and receives the buying asset in this offer. Defaults to transaction source.
    .addOperation(
      Operation.manageBuyOffer({
        selling: Asset.native(),
        buying: usdcAsset,
        buyAmount: "100",
        price: "10",
        offerId: "0",
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
