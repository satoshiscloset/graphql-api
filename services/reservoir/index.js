const { fetch } = require('../index.js')

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

const _formatCollection = (collectionData) => {
  const { collection: { id, slug, name, description, tokenCount, image, externalUrl, floorAskPrice, volume, floorSale }, ownership } = collectionData
  const stats = {
    floorPrice: floorAskPrice,
    // numOwners,
    totalSupply: tokenCount,
    volumeTotal: volume.allTime,
    volume24h: volume['1day']
  }
  return {
    id,
    name, description,
    imageUrl: image,
    externalUrl,
    marketplaceUrl: `https://opensea.io/collection/${slug}`,
    stats,
    numOwned: ownership.tokenCount
  }
}

const _formatNFT = (nftData) => {
  const { token: { contract, tokenId, name, description = '', image, collection }, ownership } = nftData
  return {
    chain: 'polygon',
    contractAddress: contract,
    tokenId,
    name,
    description,
    imageUrl: image,
    collection: {
      marketplaceUrl: 'https://opensea.io/',
      id: collection.id,
      name: collection.name,
      description: collection.description,
      imageUrl: collection.imageUrl
    },
    traits: [],
    marketplaceUrl: ''
  }
}

exports.getAssets = async (chain, walletAddress, collection=null, limit=200) => {
  let baseUrl
  if (chain === 'polygon') {
    baseUrl = BASE_URL_POLYGON_MAINNET
  }
  if (!baseUrl) {
    console.log('invalid chain found', chain)
    return null
  }
  let apiPath = `users/${walletAddress}/tokens/v6?limit=${limit}`
  if (collection) {
    apiPath += `contract=${collection}`
  }
  const data = await _makeRequest(apiPath, chain)
  if (!data || !data.tokens || !data.tokens.length) {
    return []
  }
  const assets = []
  data.tokens.map(a => {
    assets.push(_formatNFT(a))
  })
  return assets
}

exports.getCollections = async (chain, walletAddress, limit=100) => {
  let path = `users/${walletAddress}/collections/v2?limit=${limit}`
  const data = await _makeRequest(path, chain)
  if (!data) {
    // graphQL error reporting?
    console.log({ error: 'error getting collections data from Reservoir'})
  }
  const collections = []
  data.collections.forEach(c => {
    collections.push(_formatCollection(c))
  })
  return collections
}
