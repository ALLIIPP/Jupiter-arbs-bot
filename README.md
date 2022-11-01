# Arbitrage BOT using Jupiter API

This is not 100% risk free as transaction may fail but it's a proof of concept to use Jupiter API to do arbitrage on Solana.

Uses lookup tables to reduce number of transactions

trades WSOL <-> USDC / WSOL <-> USDT

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
