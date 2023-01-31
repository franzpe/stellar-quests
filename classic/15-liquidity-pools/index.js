const {
  Keypair,
  Server,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
  LiquidityPoolAsset,
  getLiquidityPoolId,
  Account,
} = require("stellar-sdk");

const { config } = require("dotenv");

config();

/**
 * https://quest.stellar.org/learn/series/3/quest/5
 */
const main = async () => {
  const questKeypair = Keypair.fromSecret(process.env.SK);

  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());

  const noodleAsset = new Asset(
    (code = "NOODLE"),
    (issuer = questKeypair.publicKey())
  );

  const lpAsset = new LiquidityPoolAsset(
    (assetA = Asset.native()),
    (assetB = noodleAsset),
    (fee = 30)
  );

  const liquidityPoolId = getLiquidityPoolId(
    "constant_product",
    lpAsset
  ).toString("hex");

  const lpDepositTransaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: lpAsset,
      })
    )
    .addOperation(
      Operation.liquidityPoolDeposit({
        liquidityPoolId: liquidityPoolId,
        maxAmountA: "100",
        maxAmountB: "100",
        minPrice: {
          n: 1,
          d: 1,
        },
        maxPrice: {
          n: 1,
          d: 1,
        },
      })
    )
    .setTimeout(30)
    .build();

  lpDepositTransaction.sign(questKeypair);

  try {
    let res = await server.submitTransaction(lpDepositTransaction);
    console.log(`LP Deposit Successful! Hash: ${res.hash}`);
  } catch (error) {
    console.log(
      `${error}. More details:\n${JSON.stringify(
        error.response.data.extras,
        null,
        2
      )}`
    );
  }

  const tradeKeypair = Keypair.fromSecret(process.env.SK_TRADE);
  const tradeAccount = await server.loadAccount(tradeKeypair.publicKey());

  const pathPaymentTransaction = new TransactionBuilder(tradeAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.changeTrust({
        asset: noodleAsset,
        source: tradeKeypair.publicKey(),
      })
    )
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: Asset.native(),
        sendMax: "1000",
        destination: tradeKeypair.publicKey(),
        destAsset: noodleAsset,
        destAmount: "1",
        source: tradeKeypair.publicKey(),
      })
    )
    .setTimeout(30)
    .build();

  pathPaymentTransaction.sign(tradeKeypair);

  res = await server.submitTransaction(pathPaymentTransaction);
  console.log(`Path Payment Successful! Hash: ${res.hash}`);

  const lpWithdrawTransaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.liquidityPoolWithdraw({
        liquidityPoolId: liquidityPoolId,
        amount: "100",
        minAmountA: "0",
        minAmountB: "0",
      })
    )
    .setTimeout(30)
    .build();

  lpWithdrawTransaction.sign(questKeypair);

  res = await server.submitTransaction(lpWithdrawTransaction);
  console.log(`LP Withdraw Successful! Hash: ${res.hash}`);
};

main();
