import dotenv from "dotenv";
import bs58 from "bs58";
import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
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
  TOKEN_PROGRAM_ID,

} from "@solana/spl-token";

import {
  readFileSync,
  writeFileSync
} from 'fs';

dotenv.config();
//rpc
const connection = new Connection(process.env.RPC_URL);// your rpc

//wallet
const wallet = (
  Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY))//your wallet
);

let data = JSON.parse(readFileSync('somestuff.json').toString())

let our_quotes = [
  'USDC',
]






//get route for swap
const getCoinQuote = (inputMint, outputMint, amount) =>
  got
    .get(
      `https://quote-api.jup.ag/v1/quote?outputMint=${outputMint}&inputMint=${inputMint}&amount=${amount}&slippageBps=20`
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

/**
 * TODO:
 *  make sure to write 'data' whenever its modified
 * 
 * ERRORS:
 *  0x1
 *  0x1770  -- slippage error
 *  0x1786
 *  0x28
 *  0x1787
 *  0x22
 */



let bases = []
let quotes = []


let tokens = [
  ["So11111111111111111111111111111111111111112", 'WSOL'],
  /*  ["DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", 'DUST'],      
    ["4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", 'RAYDIUM'],   
    ["orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", 'ORCA'],       
    ["SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt", 'SERUM'],   
    ["8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh", 'COPE'],     
    ["AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB", 'GST'],      
    ["FoRGERiW7odcCBGU1bztZi16osPBHjxharvDathL5eds", 'FORGE'],    
    ["kiGenopAScF8VF31Zbtx2Hg8qA5ArGqvnVtXb83sotc", 'GENO'],      
    ["4SZjjNABoqhbd4hnapbvoEPEqT8mnNkfbEoAwALf1V8t", 'CC'],      
    ["SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp", "SLND"],       */
  ["mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", 'mSOL'],
  ["7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj", 'stSOL'],
  ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 'USDC'],
  ["Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", 'USDT'],
  /* 
    ["zwqe1Nd4eiWyCcqdo4FgCq7LYZHdSeGKKudv6RwiAEn", 'SOLPAY'],
    ['HfYFjMKNZygfMC8LsQ8LtpPsPxEJoXJx4M6tqi75Hajo', 'CWAR'],
    ['5jFnsfx36DyGk8uVGrbXnVUMTsBkPXGpx6e69BiGFzko', 'INU'],
    ['AAmGoPDFLG6bE82BgZWjVi8k95tj9Tf3vUN7WvtUm2BU', 'RACEFI'],
    ['E6UU5M1z4CvSAAF99d9wRoXsasWMEXsvHrz3JQRXtm2X', 'DGLN'],
    ['6Y7LbYB3tfGBG6CSkyssoxdtHb77AEMTRVXe8JUJRwZ7', 'DINO'],
    ['7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx', 'STEPN'],
    ['9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM', 'AUDIO'] */
]

arb()
async function arb() {

  await setUp()

  while (true) {



    for (let quote of quotes) {
      for (let base of bases) {


        const lookupTableAccounts = []

        for (let lut_address of data[quote.name + " <-> " + base.name].lut_addresses) {
          let account = await connection
            .getAddressLookupTable(new PublicKey(lut_address))
            .then((res) => res.value);

          lookupTableAccounts.push(account)

        }

        let blockhash = await connection
          .getLatestBlockhash()
          .then((res) => res.blockhash);


        let our_initial = Math.floor((quote.amount * .15)) //or

        const solToUsdc = await getCoinQuote(
          quote.address,
          base.address,
          our_initial
        );

        const usdcToSol = await getCoinQuote(
          base.address,
          quote.address,
          Math.floor(solToUsdc.data[0].outAmount * .9999)
        );


        var sol_returns = ((usdcToSol.data[0].outAmount / our_initial * .9999) - 1)
        console.log('returns : ' + quote.name + '<->' + base.name + '   : ' + sol_returns)

        if (sol_returns > 0.0005) { // if returns greater than cost of txn

          let instructions = []
          let signers = []
          await Promise.all(
            [solToUsdc.data[0], usdcToSol.data[0]].map(async (route) => {
              const { setupTransaction, swapTransaction, cleanupTransaction } =
                await getTransaction(route).catch(e => {
                  console.log('getTransaction failure : ' + e)
                });

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


          let messageV0 = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: await connection.getRecentBlockhash().blockhash,
            instructions,
          }).compileToV0Message();


          let exists = false;
          let unmatched = []
          for (let msg_key of messageV0.staticAccountKeys) {
            exists = false;
            for (let lut_key of data[quote.name + " <-> " + base.name].keys) {
              if (msg_key == lut_key) {
                exists = true;
                break;
              }
            }
            if (!exists) {
              unmatched.push(msg_key);
            }
          }


          if (unmatched.length > 15) {

            let lookupTableAddress = data[quote.name + " <-> " + base.name].lut_addresses[data[quote.name + " <-> " + base.name].lut_addresses.length - 1]
            let lut_length = await connection.getAddressLookupTable(
              new PublicKey(lookupTableAddress)
            ).then(res =>
              res.value.state.addresses.length
            )
            if (lut_length + unmatched.length > 256) {
              //fill up first lut to 256 
              // create new lut 
              // set unmatched to new accounts 
              // continue
              let space = 256 - lut_length;
              if (space > 0) {
                await extendLookUp(lookupTableAddress, unmatched.slice(0, space), quote, base)
              }

              lookupTableAddress = await makeLookup()
              data[quote.name + " <-> " + base.name].lut_addresses.push(lookupTableAddress)
              writeFileSync('somestuff.json', JSON.stringify(data))
              unmatched = unmatched.splice(space, unmatched.length)
            }

            if (unmatched.length > 0) {
              await extendLookUp(lookupTableAddress, unmatched, quote, base)
            }

          } else {

            let messageV00 = new TransactionMessage({
              payerKey: wallet.publicKey,
              recentBlockhash: blockhash,
              instructions,
            }).compileToV0Message(lookupTableAccounts);

            let transaction = new VersionedTransaction(messageV00);

            transaction.sign([wallet])

            try {
              let tx_id = await sendAndConfirmTransaction(connection, transaction, { skipPreflight: true })
              console.log('swap succeded ' + tx_id)
              let swaps = JSON.parse(readFileSync('swaps.json'))
              swaps.swaps.push(tx_id)
              writeFileSync('swaps.json', JSON.stringify(swaps))
            } catch (err) {
              console.log('swap failed ' + err)
            }

          }

        }
      }
    }
  }
}



async function setUp() {

  console.log('setting up ...')


  // calling setup will fill 'bases' and 'quote' with
  /*
  {
    address:    //for route
    name:       //for console.log 
    amount:     //for calculating buys
    decimal:    //for calculating buys
  
  }
  */

  let parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID })




  for (let token of tokens) {
    for (let p_account of parsedTokenAccounts.value) {

      if (p_account.account.data.parsed.info.mint == token[0]) {
        if (our_quotes.includes(token[1])) { //our quote currency
          console.log('QUOTE : ' + token[1])
          quotes.push({
            address: token[0],
            name: token[1],
            amount: p_account.account.data.parsed.info.tokenAmount.amount,
            decimals: p_account.account.data.parsed.info.tokenAmount.decimals,
          })

        } else {
          console.log('BASE : ' + token[1])
          bases.push({
            address: token[0],
            name: token[1],
            amount: p_account.account.data.parsed.info.tokenAmount.amount,
            decimals: p_account.account.data.parsed.info.tokenAmount.decimals
          })
        }
      }
    }
  }

  for (let quote of quotes) {
    for (let base of bases) {
      if (!Object.keys(data).includes(quote.name + " <-> " + base.name)) {

        let lut_address = await makeLookup()

        data[quote.name + " <-> " + base.name] = {
          lut_addresses: [lut_address],
          keys: []
        }
      }
    }
  }

  console.log('quotes : ' + JSON.stringify(quotes))
  console.log('bases : ' + JSON.stringify(bases))
  writeFileSync('somestuff.json', JSON.stringify(data))

}




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

  console.log('lut address : ' + lookupTableAddress)

  let lut_address = '';

  while (lut_address == '') {
    try {
      await sendAndConfirmTransaction(connection, tx2, [wallet], { skipPreflight: true })

      lut_address = lookupTableAddress;
    } catch (err) {
      console.log('failed  : ' + e)
      let blockhash = await connection
        .getLatestBlockhash()
        .then((res) => res.blockhash);
      tx2.recentBlockhash = blockhash
      lut_address = ''
    }
  }
  return lut_address;
}


async function extendLookUp(lut_address, keys, quote, base) {

  let our_lookuptable = new PublicKey(lut_address)

  let addresses_1 = []
  let addresses_2 = []
  let addresses_3 = []

  for (let i = 0; i < keys.length; i++) {
    if (i < keys.length / 3) {
      addresses_1.push(keys[i])
    } else if (i < keys.length / 3 * 2 && (i >= keys.length / 3)) {
      addresses_2.push(keys[i])
    } else if (i >= keys.length / 3 * 2) {
      addresses_3.push(keys[i])
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

  let lutExt_txn = [
    [extendInstruction1, addresses_1],
    [extendInstruction2, addresses_2],
    [extendInstruction3, addresses_3]
  ]

  console.log('uploading lut extension for : ' + quote.name + '<->' + base.name);

  for (let ext of lutExt_txn) {
    let tx = new Transaction()
    tx.add(ext[0])

    let blockhash = await connection
      .getLatestBlockhash()
      .then((res) => res.blockhash);
    tx.recentBlockhash = blockhash
    tx.sign(wallet)
    try {
      await sendAndConfirmTransaction(connection, tx, [wallet], { skipPreflight: true })
      console.log('sent one look up extension txn...')

      data[quote.name + " <-> " + base.name].keys.push(...ext[1])
      writeFileSync('somestuff.json', JSON.stringify(data))
    } catch (err) {
      console.log('lut extension txn failed : ' + err)
    }
  }

}
 