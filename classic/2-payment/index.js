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

const server = new Server("https://horizon-testnet.stellar.org");

const fundAddress = async (keypair, qAccount, qKeypair) => {
  const transaction = new TransactionBuilder(qAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.createAccount({
        destination: keypair.publicKey(),
        startingBalance: "1000",
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(qKeypair);

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

const main = async () => {
  // We need two keypairs for this transaction: a source account, and a destination account. In this case, we need both to be funded on the testnet.
  const questKeypair = Keypair.fromSecret(
    "SD3LRONHFE7N5GPAYA22YYEFEKQXBV4BXDAYWBEANDSDYD755KRIH7WO"
  );
  const destinationKeypair = Keypair.random();

  // We set up the server and account that will be used to build and submit the transaction.
  const questAccount = await server.loadAccount(questKeypair.publicKey());
  await fundAddress(destinationKeypair, questAccount, questKeypair);

  // Build the transaction
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: destinationKeypair.publicKey(),
        asset: Asset.native(),
        amount: "100",
      })
    )
    .setTimeout(30)
    .build();

  // Sign with our quest account
  transaction.sign(questKeypair);

  // Submit transaction
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
