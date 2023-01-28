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

const submitTtransaction = async (transaction, server) => {
  try {
    let res = await server.submitTransaction(transaction);
    console.log(`Transaction Successful! Hash: ${res.hash}`);
  } catch (error) {
    console.log(`${error}. More details:\n${JSON.stringify(error, null, 2)}`);
  }
};

const fundAddress = async (keypair, qAccount, qKeypair, server) => {
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

  await submitTtransaction(transaction, server);
};

module.exports = { fundAddress, submitTtransaction };
