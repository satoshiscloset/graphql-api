const { GraphQLError } = require('graphql');
const { ApolloServer } = require('@apollo/server')
const { startServerAndCreateLambdaHandler } = require('@as-integrations/aws-lambda')
const validator = require('multicoin-address-validator')

const { VALID_CHAINS, getAssetHelper, getAssetsHelper, getCollectionsHelper, isNear, getWalletHelper } = require('../services')

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
    chain: String
    id : String
    slug: String
    name : String
    description: String
    imageUrl: String
    externalUrl : String
    marketplaceUrl : String
    stats: Stats,
    numOwned: Int
  }
  type Trait {
    trait_type : String
    value : String
    trait_count : Int
  }
  type NFT {
    chain: String
    contractAddress: String
    tokenId: String
    name: String
    description: String
    imageUrl: String
    thumbnailImageUrl: String
    imageFormat: String
    videoUrl: String
    collection: Collection
    traits: [Trait]
    tags: [String]
    externalUrl: String
    marketplace: String
    marketplaceUrl: String
    mintDate: String
    tokenType: String
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
    assets(walletAddress: String!, chain: String, collectionContractAddress: String): [NFT]
  }
  type Query {
    collections(walletAddress: String!, chain: String, limit: Int): [Collection]
  }
  type Query {
    wallet(walletAddress: String!) : Wallet
  }
`

const _getChainToValidate = (chain) => {
  if (chain === 'polygon') {
    return chainToValidate = 'matic' // validator needs polygon's old name
  }
  return chain
}

const validateAddress = (address, chain=null) => {
  if (chain === null) {
    for (let i = 0; i < VALID_CHAINS.length; i++) {
      const chain = VALID_CHAINS[i]
      let chainToValidate = _getChainToValidate(chain)
      return validator.validate(address, chainToValidate) && chain
    }
  } else {
    if (chain === 'near') {
      return isNear(address)
    } else {
      let chainToValidate = _getChainToValidate(chain)
      return validator.validate(address, chainToValidate) && chain
    }
  }
}

const getAsset = async (contractAddress, tokenId, chain, includeCollection) => {
  const validatedChain = validateAddress(contractAddress, chain)
  if (validatedChain) {
    const asset = await getAssetHelper(validatedChain, contractAddress, tokenId, includeCollection)
    return asset
  }
}

const getAssets = async (walletAddress, chain, collectionContractAddress) => {
  const validatedChain = validateAddress(walletAddress, chain)
  if (validatedChain) {
    const assets = await getAssetsHelper(validatedChain, walletAddress, collectionContractAddress)
    return assets
  }
}

const getCollections = async (walletAddress, chain, limit) => {
  const validatedChain = validateAddress(walletAddress, chain)
  if (validatedChain) {
    const collections = await getCollectionsHelper(validatedChain, walletAddress, limit)
    if (collections.error) {
      throw new GraphQLError(collections.error, {
        extensions: { code: 'ERROR_GET_COLLECTIONS' },
      })
    }
    return collections
  }
}

const getWalletAssets = async (walletAddress, chain) => {
  const validatedChain = validateAddress(walletAddress, chain)
  if (validatedChain) {
    const wallet = await getWalletHelper(validatedChain, walletAddress)
    return wallet
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
    assets: async (_, {walletAddress, chain=null, collectionContractAddress=null}) => {
      const assets = await getAssets(walletAddress, chain, collectionContractAddress)
      return assets
    },
    collections: async(_, {walletAddress, chain=null, limit=20}) => {
      const collections = await getCollections(walletAddress, chain, limit)
      return collections
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
