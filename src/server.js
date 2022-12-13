const { ApolloServer } = require('@apollo/server')
const { startServerAndCreateLambdaHandler } = require('@as-integrations/aws-lambda')
const validator = require('multicoin-address-validator')

const { VALID_CHAINS, getAssetHelper, isNear, getWalletHelper } = require('../services')

const typeDefs = `#graphql
  type Query {
    ping: String
  }
  type Stats {
    marketplace: String
    floorPrice : String
    numOwners : Int
    numListed: Int
    totalSupply : Int
    volumeTotal : String
    volume24h : String
  }
  type Collection {
    id : String
    name : String
    description: String
    imageUrl: String
    externalUrl : String
    marketplaceUrl : String
    stats: Stats
  }
  type Trait {
    trait_type : String
    value : String
    trait_count : Int
  }
  type NFT {
    chain: String
    contractAddress : String
    tokenId: String
    name : String
    description: String
    imageUrl: String
    thumbnailImageUrl: String
    videoUrl: String
    collection: Collection
    traits: [Trait]
    tags: [String]
    externalUrl : String
    marketplace: String
    marketplaceUrl : String
    mintDate : String
  }
  type TokenBalance {
    name: String
    symbol: String
    balance: String
    decimals: Int
    contractAddress: String
    logoUrl: String
  }
  type Wallet {
    nfts: [NFT],
    balances: [TokenBalance]
  }


  # includeCollection - only used when querying Solana or NEAR NFTs, defaults to false
  type Query {
    asset(contractAddress: String!, tokenId: String, chain: String, includeCollection: Boolean): NFT
  }
  type Query {
    wallet(walletAddress: String!) : Wallet
  }
`

const validateAddress = (chain, address) => {
  if (chain === 'near') {
    return isNear(address)
  } else {
    return validator.validate(address, chain)
  }
}

const getAsset = async (contractAddress, tokenId, chain, includeCollection) => {
  if (chain) {
    if (validateAddress(chain, contractAddress)) {
      const asset = await getAssetHelper(chain, contractAddress, tokenId, includeCollection)
      return asset
      // throw new UserInputError("getAsset with chain not yet implemented. Exclude 'chain' argument for now.")
    }
  } else {
    for (let i = 0; i < VALID_CHAINS.length; i++) {
      const chain = VALID_CHAINS[i]
      if (validateAddress(chain, contractAddress)) {
        const asset = await getAssetHelper(chain, contractAddress, tokenId, includeCollection)
        return asset
      }
    }
  }
}

const getWalletAssets = async (walletAddress) => {
  for (let i = 0; i < VALID_CHAINS.length; i++) {
    const chain = VALID_CHAINS[i]
    if (validateAddress(chain, walletAddress)) {
      const wallet = await getWalletHelper(chain, walletAddress)
      return wallet
    }
  }
}

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    ping: () => 'pong',
    asset: async (_, {contractAddress, tokenId, chain=null, includeCollection=false}) => {
      const asset = await getAsset(contractAddress, tokenId, chain, includeCollection)
      return asset
    },
    wallet: async(_, {walletAddress, chain=null}) => {
      const wallet = await getWalletAssets(walletAddress, chain)
      return wallet
    }
  },
};

// Set up Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

exports.graphqlHandler = startServerAndCreateLambdaHandler(server);
