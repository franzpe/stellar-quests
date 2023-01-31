const {
  Keypair,
  Server,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
  Claimant,
  Account,
} = require("stellar-sdk");

const { config } = require("dotenv");

config();

/**
 * https://quest.stellar.org/learn/series/3/quest/3
 */
const main = async () => {
  const questKeypair = Keypair.fromSecret(process.env.SK);
  const claimantKeypair = Keypair.fromSecret(process.env.SK_CLAIMANT);

  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());

  // The `claimant` must wait at least 5 minutes before they can claim the balance.
  const claimant = new Claimant(
    claimantKeypair.publicKey(),
    Claimant.predicateNot(Claimant.predicateBeforeRelativeTime("300"))
  );

  // The `questClaimant` may claim the balance at any time (as long as it has not yet been claimed)
  const questClaimant = new Claimant(
    questKeypair.publicKey(),
    Claimant.predicateUnconditional()
  );

  //Now we are ready to build our first transaction, which will contain a single createClaimableBalance operation. This operation allows you to lock up an asset for one or more claimants to accept once a specific set of predicates (or conditions) is satisfied. Anyway, the available options for this operation are:
  // asset: The asset you'd like to lock up. Nothing fancy here, just ensure the source account owns the desired asset and holds enough of a balance. Keep in mind, once you create the claimable balance, you'll be unable to access those funds ever again unless you've set yourself up as one of the claimants.
  // amount: The amount of the asset you want to lock up in the claimable balance.
  // claimants: An array of one or more Claimant objects which stipulate the conditions under which the balance may be claimed.
  // source: (optional) The conditions under which the destination address may successfully claim the claimable balance. Currently, there are only two predicates to choose from.
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.createClaimableBalance({
        asset: Asset.native(),
        amount: "100",
        claimants: [claimant, questClaimant],
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(questKeypair);

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

  const claimableBalanceId = transaction.getClaimableBalanceId(0);

  // Zero (0) here refers to which operation in the transaction contains the
  // `createClaimableBalance` operation.
  await new Promise((res, rej) => {
    setTimeout(async () => {
      const claimantAccount = await server.loadAccount(
        claimantKeypair.publicKey()
      );
      const claimTransaction = new TransactionBuilder(claimantAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.claimClaimableBalance({
            balanceId: claimableBalanceId,
          })
        )
        .setTimeout(30)
        .build();

      claimTransaction.sign(claimantKeypair);
      res = await server.submitTransaction(claimTransaction);
      console.log(`Balance Successfully Claimed! Hash: ${res.hash}`);
      res(true);
    }, 310 * 1000);
  });
};

main();
