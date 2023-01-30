const {
  Keypair,
  Server,
  TransactionBuilder,
  Networks,
  Operation,
  BASE_FEE,
} = require("stellar-sdk");

const { config } = require("dotenv");

config();

/**
 * https://quest.stellar.org/learn/series/2/quest/3
 */
const main = async () => {
  const questKeypair = Keypair.fromSecret(process.env.SK);
  const secondSigner = Keypair.random();
  const thirdSigner = Keypair.random();

  const server = new Server("https://horizon-testnet.stellar.org");
  const questAccount = await server.loadAccount(questKeypair.publicKey());

  // Now, we build a transaction. Like in the previous quest, we're using the setOptions operation (a few times), but now we will use more of the options available to us. Right now, the relevant options for this operation are:
  // masterWeight: The Master Weight field allows you to modify the master key's signature weight. The weight is a numerical value that denotes how much power the signature has. The default master weight is 1. For this quest, we are setting this value to 1.
  // lowThreshold: The weight for the low threshold. For this quest, we are setting this value to 5.
  // medThreshold: The weight for the medium threshold. For this quest, we are setting this value to 5.
  // highThreshold: The weight for the high threshold. For this quest, we are setting this value to 5.

  // To accomplish everything we need for this quest, we'll need to add more setOptions operations. This time, we will use the following option:
  // signer: This field allows you to add or remove additional signers for accounts and configure their threshold weights. There are currently three signer types, but for this quest, we're only interested in configuring additional Stellar keys or an ed25519PublicKey, and we want them created with a weight of 2.
  const transaction = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.setOptions({
        masterWeight: 1,
        lowThreshold: 5,
        medThreshold: 5,
        highThreshold: 5,
      })
    )
    .addOperation(
      Operation.setOptions({
        signer: {
          ed25519PublicKey: secondSigner.publicKey(),
          weight: 2,
        },
      })
    )
    .addOperation(
      Operation.setOptions({
        signer: {
          ed25519PublicKey: thirdSigner.publicKey(),
          weight: 2,
        },
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(questKeypair);

  try {
    let res = await server.submitTransaction(transaction);
    console.log(`Transaction Successful! Hash: ${res.hash}`);
  } catch (error) {
    console.log(`${error}. More details:\n${JSON.stringify(error, null, 2)}`);
  }

  const transaction2 = new TransactionBuilder(questAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.manageData({
        name: "HelloString",
        value: "World",
      })
    )
    .setTimeout(30)
    .build();

  transaction2.sign(questKeypair, secondSigner, thirdSigner);

  try {
    let res = await server.submitTransaction(transaction2);
    console.log(`Transaction Successful! Hash: ${res.hash}`);
  } catch (error) {
    console.log(`${error}. More details:\n${JSON.stringify(error, null, 2)}`);
  }
};

main();
