const { fetch } = require('../index.js')

const VERBOSE = false

const BASE_URL_ETH_MAINNET = 'https://api.reservoir.tools'
const BASE_URL_POLYGON_MAINNET = 'https://api-polygon.reservoir.tools'

const _makeRequest = async (path, chain) => {
  let baseUrl = BASE_URL_ETH_MAINNET
  let apiKey = process.env.RESERVOIR_ETH_API_KEY
  if (chain === 'polygon') {
    baseUrl = BASE_URL_POLYGON_MAINNET
    apiKey = process.env.RESERVOIR_POLYGON_API_KEY
  }
  const url = `${baseUrl}/${path}`
  VERBOSE && console.log(url)
  const res = await fetch(url, {'x-api-key': apiKey})
  if (res.status !== 200) {
    return false
  }
  const data = await res.json()
  if (data.success === false) {
    return false
  }
  return data
}

const _formatCollection = (collectionData, chain) => {
  const { collection: { id, slug, name, description, tokenCount, image, externalUrl, floorAskPrice, volume, floorSale }, ownership } = collectionData
  const stats = {
    floorPrice: floorAskPrice,
    // numOwners,
    totalSupply: tokenCount,
    volumeTotal: volume.allTime,
    volume24h: volume['1day']
  }
  return {
    chain,
    id, slug,
    name, description,
    imageUrl: image,
    externalUrl,
    marketplaceUrl: `https://opensea.io/collection/${slug}`,
    stats,
    numOwned: ownership.tokenCount
  }
}

const _formatNFT = (nftData, chain) => {
  const { token: { contract, tokenId, name, description = '', image, media, collection, attributes=[] }, ownership } = nftData
  return {
    chain,
    contractAddress: contract,
    tokenId,
    name,
    description,
    imageUrl: image,
    mediaUrl: media,
    collection: {
      marketplaceUrl: 'https://opensea.io/',
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      imageUrl: collection.image
    },
    traits: attributes.map(a => {
      return {
        trait_type: a.key,
        value: a.value,
        trait_count: a.tokenCount
      }
    }),
    marketplaceUrl: ''
  }
}

exports.getAsset = async (chain, contractAddress, tokenId) => {
  const path = `tokens/v6?tokenSetId=token:${contractAddress}:${tokenId}&includeAttributes=true`
  const data = await _makeRequest(path, chain)
  if (!data || !data.tokens || !data.tokens.length) {
    return []
  }
  return _formatNFT(data.tokens[0])
}

exports.getAssets = async (chain, walletAddress, collectionContractAddress=null, offset=0, limit=200) => {
  let path = `users/${walletAddress}/tokens/v7?includeAttributes=true&limit=${limit}&useNonFlaggedFloorAsk=true`
  if (collectionContractAddress) {
    path += `&collection=${collectionContractAddress}`
  }
  const data = await _makeRequest(path, chain)
  if (!data || !data.tokens || !data.tokens.length) {
    return []
  }
  const assets = []
  data.tokens.forEach(t => {
    assets.push(_formatNFT(t, chain))
  })
  return assets
}

exports.getCollections = async (chain, walletAddress, limit=100) => {
  let path = `users/${walletAddress}/collections/v3?limit=${limit}`
  const data = await _makeRequest(path, chain)
  if (!data) {
    // graphQL error reporting?
    return { error: 'error getting collections data from Reservoir'}
  }
  if (!data.collections) {
    return { error: `error getting collections data from Reservoir: ${JSON.stringify(data)}`, statusCode: data.statusCode }
  }
  const collections = []
  data.collections.forEach(c => {
    const { collection: { rank = {} }} = c
    if (rank && rank.allTime) {
      collections.push(_formatCollection(c, chain))
    }
  })
  return collections
}
