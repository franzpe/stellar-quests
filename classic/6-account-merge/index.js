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
 * https://quest.stellar.org/learn/series/2/quest/1
 * In this quest, you'll delete an account by transferring all of its native XLM balance to a destination account using the Account Merge operation.
 */
const main = async () => {
  // We'll need two keypairs for this transaction: our quest keypair (the one trusting the asset), and an issuer keypair (the one issuing the asset).
  const questKeypair = Keypair.fromSecret(process.env.SK);
  const destinationKeypair = Keypair.random();

  // We set up the server and account that will be used to build and submit the transaction.
  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());
  // await fundAddress(destinationKeypair, questAccount, questKeypair, server);
  const transactionFund = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.createAccount({
        destination: destinationKeypair.publicKey(),
        startingBalance: "1000",
      })
    )
    .setTimeout(30)
    .build();

  transactionFund.sign(questKeypair);

  await submitTtransaction(transactionFund, server);

  // Now we need to create a simple transaction, containing only our accountMerge operation. The available options for this operation are:
  // destination: The destination account we want to merge our account into. This will be the account that receives all our XLM during the merge operation.
  // source: (optional) The account that will be merged into the destination account. You can ignore this option to have the operation default to the transaction's source account.
  // Note that it's not just the XLM balance that needs to be removed from an account to merge it. You also need to remove all subentries: trustlines need to be emptied and removed, additional signers need to be dropped, open offers need to be closed, and data entries must be deleted.
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.accountMerge({
        destination: destinationKeypair.publicKey(),
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
