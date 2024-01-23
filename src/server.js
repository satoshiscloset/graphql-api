const { GraphQLError } = require('graphql');
const { ApolloServer } = require('@apollo/server')
const { startServerAndCreateLambdaHandler } = require('@as-integrations/aws-lambda')
const { startStandaloneServer } = require('@apollo/server/standalone')
const validator = require('multicoin-address-validator')

const { VALID_CHAINS, getAssetHelper, getAssetsHelper, getCollectionsHelper, isNear, getWalletHelper, getOrdinal } = require('../services')

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
    rank: Int
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
    videoFormat: String
    audioUrl: String
    audioFormat: String
    mediaUrl: String
    mimeType: String
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


  type Query {
    ordinal(inscriptionId: String) : NFT
  }
  # includeCollection - only used when querying Solana or NEAR NFTs, defaults to false
  type Query {
    asset(contractAddress: String!, tokenId: String, chain: String, includeCollection: Boolean): NFT
  }
  type Query {
    assets(walletAddress: String!, chain: String, collectionContractAddress: String): [NFT]
  }
  type Query {
    collections(walletAddress: String!, chain: String, limit: Int, offset: Int): [Collection]
  }
  type Query {
    wallet(walletAddress: String!) : Wallet
  }
`

const _getChainToValidate = (chain) => {
  if (chain === 'polygon') {
    return 'matic' // validator needs polygon's old name
  }
  return chain
}

const _isNameService = (address) => {
  return false
  const isEth = (address) => {
    return address.length && address.endsWith('.eth')
  }

  const isSol = (address) => {
    return address.length && address.endsWith('.sol')
  }

  const isTez = (address) => {
    return address.length && address.endsWith('.tez')
  }

  if (isEth(address)) {
    // Perform reverse lookup to get address
  } else if (isSol(address)) {
    // Perform reverse lookup to get address
  } else if (isTez(address)) {
    // Perform reverse lookup to get address
  }
}

const validateAddress = (address, chain=null) => {
  if (_isNameService(address)) {
    // TODO
  } else {
    if (chain === null) {
      for (let i = 0; i < VALID_CHAINS.length; i++) {
        const chain = VALID_CHAINS[i]
        let chainToValidate = _getChainToValidate(chain)
        if (validator.validate(address, chainToValidate)) {
          return chain
        }
      }
      return false
    } else {
      if (chain === 'near') {
        return isNear(address)
      } else {
        let chainToValidate = _getChainToValidate(chain)
        return validator.validate(address, chainToValidate) && chain
      }
    }
  }
}

const getOrdinalAsset = async (inscriptionId) => {
  const asset = await getOrdinal(inscriptionId)
  if (asset.error) {
    throw new GraphQLError(asset.error, {
      extensions: { code: 'ERROR_GET_ASSET' },
    })
  }
  return asset
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

const getCollections = async (walletAddress, chain, limit, offset) => {
  const validatedChain = validateAddress(walletAddress, chain)
  if (validatedChain) {
    const collections = await getCollectionsHelper(validatedChain, walletAddress, limit, offset)
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
    ordinal: async(_, {inscriptionId}) => {
      const asset = await getOrdinalAsset(inscriptionId)
      return asset
    },
    asset: async (_, {contractAddress, tokenId, chain=null, includeCollection=false}) => {
      const asset = await getAsset(contractAddress, tokenId, chain, includeCollection)
      return asset
    },
    assets: async (_, {walletAddress, chain=null, collectionContractAddress=null}) => {
      const assets = await getAssets(walletAddress, chain, collectionContractAddress)
      return assets
    },
    collections: async(_, {walletAddress, chain=null, limit=20, offset=0}) => {
      const collections = await getCollections(walletAddress, chain, limit, offset)
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
// to run locally, comment above line out, and uncomment below. then run `node src/server.js`:
// async function startApolloServer() {
//   const { url } = await startStandaloneServer(server);
//   console.log(`
//     🚀  Server is running!
//     📭  Query at ${url}
//   `);
// }
// startApolloServer()
