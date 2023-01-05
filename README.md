# NFT & Crypto API By Satoshi's Closet

We've developed an open source GraphQL based API that can be easily deployed into your development stack.

## Features

- Ability to query for a specific NFT on any of our supported chains with just a contract address and token ID
- Ability to retreive crypto balances + NFTs via a wallet address (IN-PROGRESS - working only for Tezos)

## Chains supported

- Ethereum (mainnet)
- Tezos
- Solana

## Example queries

For all the attributes that can be queried, please see our test implementation via the URL below.

### Retrieve NFT asset 

```graphql
query ExampleQuery($contractAddress: String!, $tokenId: String) {
  asset(contractAddress: $contractAddress, tokenId: $tokenId) {
    name
    description
  }
}
```

Solana only requires a `contractAddress` which is the unique identifier of the NFT. 

### Retrieve wallet balances + NFTs 

```graphql
query ExampleQuery($walletAddress: String!) {
  wallet(walletAddress: $walletAddress) {
    balances {
      balance
      name
      symbol
      decimals
    }
    nfts {
      name
      description
    }
  }
}
```

## Try it out with our test implementation

https://k6h76bg0va.execute-api.us-east-1.amazonaws.com/

