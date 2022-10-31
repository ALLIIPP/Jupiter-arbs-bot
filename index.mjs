import dotenv from "dotenv";
import bs58 from "bs58";
import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  TransactionMessage,
  AddressLookupTableProgram
} from "@solana/web3.js";
import got from "got";
import { Wallet } from "@project-serum/anchor";
import promiseRetry from "promise-retry";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,

} from "@solana/spl-token";

import {
  readFileSync,
  writeFileSync
} from 'fs';

console.log({ dotenv });
dotenv.config();


//rpc
const connection = new Connection('');// your rpc

//wallet
const wallet = (
  Keypair.fromSecretKey(bs58.decode(''))//your wallet
);


const SOL_MINT = "So11111111111111111111111111111111111111112";

//amount in usd to select quote

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const our_lookuptable = new PublicKey('J9Erb5TwBK8bsgzSisnXhHw3PF4xtnWXyhHc31SCAmJt');


let somestuff = JSON.parse(readFileSync('somestuff.json').toString())


// creates wsol account with 2 SOL
const createWSolAccount = async () => {
  const wsolAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    new PublicKey(SOL_MINT),
    wallet.publicKey
  );

  const wsolAccount = await connection.getAccountInfo(wsolAddress);

  // if no wrapped sol accout, create it 

  const transaction = new Transaction({
    feePayer: wallet.publicKey,
  });
  const instructions = [];


  instructions.push(
    await Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(SOL_MINT),
      wsolAddress,
      wallet.publicKey,
      wallet.publicKey
    )
  );

  // fund 2 sol to the account
  instructions.push(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: wsolAddress,
      lamports: 2_000_000_000, // 2 sol
    })
  );

  instructions.push(
    // This is not exposed by the types, but indeed it exists
    Token.createSyncNativeInstruction(TOKEN_PROGRAM_ID, wsolAddress)
  );

  transaction.add(...instructions);
  transaction.recentBlockhash = await (
    await connection.getRecentBlockhash()
  ).blockhash;
  transaction.partialSign(wallet.payer);
  const result = await connection.sendTransaction(transaction, [
    wallet.payer,
  ]);
  console.log({ result });


  return wsolAccount;
};

//get route for swap
const getCoinQuote = (inputMint, outputMint, amount) =>
  got
    .get(
      `https://quote-api.jup.ag/v1/quote?outputMint=${outputMint}&inputMint=${inputMint}&amount=${amount}&slippage=0.2`
    )
    .json();

//get unsigned transaction for swap 
const getTransaction = (route) => {
  return got
    .post("https://quote-api.jup.ag/v1/swap", {
      json: {
        route: route,
        userPublicKey: wallet.publicKey.toString(),
        // to make sure it doesnt close the sol account
        wrapUnwrapSOL: false,
      },
    })
    .json();
};

//confirm transaction with retry
const getConfirmTransaction = async (txid) => {
  const res = await promiseRetry(
    async (retry, attempt) => {
      let txResult = await connection.getTransaction(txid, {
        commitment: "confirmed",
      });

      if (!txResult) {
        const error = new Error("Transaction was not confirmed");
        error.txid = txid;

        retry(error);
        return;
      }
      return txResult;
    },
    {
      retries: 40,
      minTimeout: 500,
      maxTimeout: 1000,
    }
  );
  if (res.meta.err) {
    throw new Error("Transaction failed");
  }
  return txid;
};





let bases = []
let quotes = []

//our base currencies [token address , name]
let titles = [
  ["So11111111111111111111111111111111111111112", 'WSOL'],      // WSOl
  /*  ["DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", 'DUST'],     //DUST
    ["4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", 'RAYDIUM'],  //RAYDIUM
    ["orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", 'ORCA'],      //ORCA
    ["SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt", 'SERUM'],     //SERUM
    ["8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh", 'COPE'],     //COPE
    ["AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB", 'GST'],      //GST
    ["FoRGERiW7odcCBGU1bztZi16osPBHjxharvDathL5eds", 'FORGE'],    //FORGE
    ["kiGenopAScF8VF31Zbtx2Hg8qA5ArGqvnVtXb83sotc", 'GENO'],      //GENOPETS KI
    ["4SZjjNABoqhbd4hnapbvoEPEqT8mnNkfbEoAwALf1V8t", 'CC'],       //CRYPTO CAVEMEN
    ["SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp", "SLND"],      //SOLEND
    ["mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", 'mSOL'],      //mSOL
    ["7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj", 'stSOL'],    //stSOL */
  ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 'USDC'],     // USDC
  /*  ["Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", 'USDT'],     // USDT 
    //  ["So11111111111111111111111111111111111111112", 'WSOL'],      // WSOl
    ["zwqe1Nd4eiWyCcqdo4FgCq7LYZHdSeGKKudv6RwiAEn", 'SOLPAY'],
    ['HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo', 'CWAR'],
    ['5jFnsfx36DyGk8uVGrbXnVUMTsBkPXGpx6e69BiGFzko', 'INU'],
    ['AAmGoPDFLG6bE82BgZWjVi8k95tj9Tf3vUN7WvtUm2BU', 'RACEFI'],
    ['E6UU5M1z4CvSAAF99d9wRoXsasWMEXsvHrz3JQRXtm2X', 'DGLN'],
    ['6Y7LbYB3tfGBG6CSkyssoxdtHb77AEMTRVXe8JUJRwZ7', 'DINO'],
    ['7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx', 'STEPN'],
    ['9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM', 'AUDIO'] */
]


//await createWSolAccount()
await setUp()
//await makeLookup()
//await what()


while (true) {

  for (let quote of quotes) {
    for (let base of bases) {

      //txn will fail if no quote to buy 
      if (quote.amount == 0) {
        continue;
      }

      let our_initial = Math.floor((quote.amount * .5))


      const usdcToSol = await getCoinQuote(quote.address, base.address, our_initial);

      const solToUsdc = await getCoinQuote(
        base.address,
        quote.address,
        usdcToSol.data[0].outAmount
      );

      // when outAmount more than initial
      var returns = (((solToUsdc.data[0].outAmount / our_initial) - 1))
      console.log('returns : ' + quote.name + '<->' + base.name + '   : ' + returns)
      // if (returns > .0001) {
      if (returns) {

        let bread = solToUsdc.data[0].outAmount - our_initial
        console.log('how much  : ' + bread / LAMPORTS_PER_SOL)

        console.log(quote.name + ":" + base.name)


        if (!Object.keys(somestuff).includes(quote.name + " <-> " + base.name)) {
          somestuff[quote.name + " <-> " + base.name] = []
        }

        let instructions = []
        let signers = []
        await Promise.all(
          [usdcToSol.data[0], solToUsdc.data[0]].map(async (route) => {
            const { setupTransaction, swapTransaction, cleanupTransaction } =
              await getTransaction(route);

            await Promise.all(
              [setupTransaction, swapTransaction, cleanupTransaction]
                .filter(Boolean)
                .map(async (serializedTransaction) => {


                  let transaction = Transaction.from(
                    Buffer.from(serializedTransaction, "base64")
                  );
                  try {
                    instructions.push(...transaction.instructions)
                    if (transaction.signers) {
                      if (transaction.signers.length > 0) {
                        signers.push(...transaction.signers)
                      }
                    }
                  } catch (err) {
                    console.log(err)
                  }
                })
            );
          })
        );


        let addresses_1 = []
        let addresses_2 = []
        let addresses_3 = []



        let messageV0 = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: await connection.getRecentBlockhash().blockhash,
          instructions,
        }).compileToV0Message();

        for (let i = 0; i < messageV0.staticAccountKeys.length; i++) {

          if (i < messageV0.staticAccountKeys.length / 3) {
            if (!somestuff[quote.name + " <-> " + base.name].includes(messageV0.staticAccountKeys[i])) {
              somestuff[quote.name + " <-> " + base.name].push(messageV0.staticAccountKeys[i])
              addresses_1.push(messageV0.staticAccountKeys[i])
              writeFileSync('./somestuff.json', JSON.stringify(somestuff))
            }
          } else if (i < messageV0.staticAccountKeys.length / 3 * 2 && (i >= messageV0.staticAccountKeys.length / 3)) {
            if (!somestuff[quote.name + " <-> " + base.name].includes(messageV0.staticAccountKeys[i])) {
              somestuff[quote.name + " <-> " + base.name].push(messageV0.staticAccountKeys[i])
              addresses_2.push(messageV0.staticAccountKeys[i])
              writeFileSync('./somestuff.json', JSON.stringify(somestuff))
            }

          } else if (i >= messageV0.staticAccountKeys.length / 3 * 2) {
            if (!somestuff[quote.name + " <-> " + base.name].includes(messageV0.staticAccountKeys[i])) {
              somestuff[quote.name + " <-> " + base.name].push(messageV0.staticAccountKeys[i])
              addresses_3.push(messageV0.staticAccountKeys[i])
              writeFileSync('./somestuff.json', JSON.stringify(somestuff))
            }
          }
        }



        const extendInstruction1 = AddressLookupTableProgram.extendLookupTable({
          payer: wallet.publicKey,
          authority: wallet.publicKey,
          lookupTable: our_lookuptable,
          addresses: addresses_1

        });
        const extendInstruction2 = AddressLookupTableProgram.extendLookupTable({
          payer: wallet.publicKey,
          authority: wallet.publicKey,
          lookupTable: our_lookuptable,
          addresses: addresses_2

        });
        const extendInstruction3 = AddressLookupTableProgram.extendLookupTable({
          payer: wallet.publicKey,
          authority: wallet.publicKey,
          lookupTable: our_lookuptable,
          addresses: addresses_3

        });

        console.log('lut 1 : ' + addresses_1.length)
        console.log('lut 2 : ' + addresses_2.length)
        console.log('lut 3 : ' + addresses_3.length)

        let ix2 = [extendInstruction1, extendInstruction2, extendInstruction3]

        console.log('all good till here ')

      /*  for (let element of ix2) {
          let tx = new Transaction()
          tx.add(element)


          let blockhash = await connection
            .getLatestBlockhash()
            .then((res) => res.blockhash);
          tx.recentBlockhash = blockhash
          tx.sign(wallet)
          try {
            await sendAndConfirmTransaction(connection, tx, [wallet], { skipPreflight: true })
            console.log('sent one look up extension txn...')
          } catch (err) {
            console.log('!ttt first failed : ' + e)
          }

        }
        */

        let lookupTableAccount = await connection
          .getAddressLookupTable(our_lookuptable)
          .then((res) => res.value);

        let blockhash = await connection
          .getLatestBlockhash()
          .then((res) => res.blockhash);

        let messageV00 = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: blockhash,
          instructions,
        }).compileToV0Message([lookupTableAccount]);

        let transaction = new VersionedTransaction(messageV00);

        transaction.sign([wallet])

        try {
          let tx_id = await sendAndConfirmTransaction(connection, transaction)
          console.log('swapped '+tx_id)
        } catch (err) {
          console.log("hererrererrrr444444" + err)
        }
        break;


        /*
        // get transaction object from serialized transaction
        const transaction = Transaction.from(
          Buffer.from(serializedTransaction, "base64")
        );
        // perform the swap
        // Transaction might failed or dropped
        const txid = await connection.sendTransaction(
          transaction,
          [wallet.payer],
          {
            skipPreflight: true,
          }
        );
        //use route to figure out whats in wallet 
        try {
          await getConfirmTransaction(txid);

          console.log(`Success: https://solscan.io/tx/${txid}`);
        } catch (e) {
          console.log(`Failed: https://solscan.io/tx/${txid}`);
          // if one txn fails, reasses
          // with lookuptables we wont have to do this , we can fit everything in one txn
          switcharoo(base_initial, quote_initial, base, quote)


        }
            */

      }
    }
  }
}


 

 

async function setUp() {

  console.log('setting up ...')

  // TODO check if setup.json exits 
  // calling setup will fill 'bases' and 'quote' with
/*
{
  address:    //for route
  name:       //for console.log 
  amount:     //for calculating buys
  decimal:    //for calculating buys

}
*/

  let bingus = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID })


  for (let thing of titles) {
    for (let element of bingus.value) {

      if (element.account.data.parsed.info.mint == thing[0]) {

        if (thing[0] == SOL_MINT) {
          console.log('QUOTE : ' + thing[0])
          quotes.push({
            address: thing[0],
            name: thing[1],
            amount: element.account.data.parsed.info.tokenAmount.amount,
            decimals: element.account.data.parsed.info.tokenAmount.decimals,

          })

        } else {
          console.log('BASE : ' + thing[0])
          bases.push({
            address: thing[0],
            name: thing[1],
            amount: element.account.data.parsed.info.tokenAmount.amount,
            decimals: element.account.data.parsed.info.tokenAmount.decimals
          })

        }
      }
    }

  }

  console.log('quotes : ' + JSON.stringify(quotes))

}


/*
async function setUp() {

  console.log('setting up ...')

  // TODO check if setup.json exits 

  let bingus = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID })

  for (let element of bingus.value) {

    for (let thing of titles) {
      if (element.account.data.parsed.info.mint == thing[0]) {

        let data = await got.get('https://price.jup.ag/v1/price?id=' + thing[0] + '&vsAmount=1000000').json()


        if (data.data.price * element.account.data.parsed.info.tokenAmount.uiAmount >= BET_AMOUNT) {
          quotes.push({
            address: thing[0],
            name: thing[1],
            amount: element.account.data.parsed.info.tokenAmount.amount,
            decimals: element.account.data.parsed.info.tokenAmount.decimals,

          })

        } else {
          bases.push({
            address: thing[0],
            name: thing[1],
            amount: element.account.data.parsed.info.tokenAmount.amount,
            decimals: element.account.data.parsed.info.tokenAmount.decimals
          })

        }
      }
    }

  }

  //write file setup.json

  writeFileSync('whatQuote.json', JSON.stringify(quotes))
  writeFileSync('whatBase.json', JSON.stringify(bases))


  console.log('quotes : ' + JSON.stringify(quotes))

}
*/


async function getTokenAmount(tokens) {
  let bingus = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID })

  let updated_tokens = []

  for (let thing of tokens) {
    for (let element of bingus.value) {
      if (element.account.data.parsed.info.mint == thing.address) {
        thing.amount = element.account.data.parsed.info.tokenAmount.amount;
        updated_tokens.push(thing)
        break;
      }
    }

  }
  return updated_tokens;
}



async function makeLookup() {

  const slot = await connection.getSlot();

  let [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: wallet.publicKey,
      payer: wallet.publicKey,
      recentSlot: slot,
    });



  let tx2 = new Transaction()
  tx2.add(lookupTableInst)

  let blockhash = await connection
    .getLatestBlockhash()
    .then((res) => res.blockhash);
  tx2.recentBlockhash = blockhash
  tx2.sign(wallet)

  console.log('addy : ' + lookupTableAddress)
  try {
    await sendAndConfirmTransaction(connection, tx2, [wallet], { skipPreflight: true })
  } catch (err) {
    console.log('failed  : ' + e)
  }

}


async function what() {
  let ttt = await connection
    .getAddressLookupTable(our_lookuptable)
    .then((res) => {
      console.log('what : ' + res)
      return res.value
    })
    .catch(e => {
      console.log(e)
    })


  console.log(ttt)
}

