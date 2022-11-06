# Arbitrage BOT using Jupiter API

This is not 100% risk free as transaction may fail but it's a proof of concept to use Jupiter API to do arbitrage on Solana.

Makes money by swapping back and forth between tokens in a single transaction by using lookup tables to store commonly used accounts.

creates tables for each swap pair (ex. USDC<->WSOL, USDC<->mSOL)
then fills those tables with accounts until its is able to fit 
entire swap instuctions in single txn.

successful swaps saved in swaps.json
lut addresses and accounts in lut saved in somestuff.json

inspired by Jarett Dunn @STACCoverflow

## How to use?
1. Install dependencies
```sh
npm install
```

2. create .env file with your priv key, rpc

3. run the file
```sh
node index.mjs
```
