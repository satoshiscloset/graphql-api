const { fetch, formatDate } = require('../index.js')

const BASE_URL = `https://api-mainnet.magiceden.dev/v2`

const SOL_TOKEN_DECIMALS = 9

exports.getAsset = async (mintAddress, includeCollection=false) => {
  const apiUrl = `${BASE_URL}/tokens/${mintAddress}`
  const res = await fetch(apiUrl)
  const data = await res.json()
  const collection = includeCollection ? await getCollection(data.collection) : null
  return _formatNFT(data, collection)
}

exports.getAssets = async (walletAddress) => {
  const apiUrl = `${BASE_URL}/wallets/${walletAddress}/tokens?offset=0&limit=500`
  const res = await fetch(apiUrl)
  const data = await res.json()
  return data.map(d => _formatNFT(d))
}

const getCollection = async (slug) => {
  const apiUrl = `${BASE_URL}/collections/${slug}`
  const res = await fetch(apiUrl)
  const data = await res.json()
  const { symbol, name, description, image, floorPrice, listedCount, volumeAll } = data
  return {
    id: symbol,
    name, description,
    imageUrl: image,
    marketplaceUrl: 'https://magiceden.io/',
    stats: {
      marketplace: 'magiceden',
      floorPrice: floorPrice / 10**SOL_TOKEN_DECIMALS,
      numListed: listedCount,
      volumeTotal: volumeAll / 10**SOL_TOKEN_DECIMALS
    }
  }
}

const _formatNFT = (nft, collection = null) => {
  const { name, image, animationUrl, mintAddress, attributes = [], externalUrl = '', properties = {} } = nft
  const { category, files } = properties

  let collectionName
  if (!collection) {
    collection = {
      id: nft.collection,
      name: nft.collectionName || nft.collection,
      marketplaceUrl: 'https://magiceden.io/',
    }
  }

  let videoUrl
  if (category === 'video') {
    files.forEach(f => {
      const { type, uri } = f
      if (!videoUrl && type === 'video/mp4') {
        videoUrl = uri
      }
    })
  }

  return {
    chain: 'sol',
    contractAddress: mintAddress,
    tokenId: mintAddress,
    name,
    imageUrl: image,
    videoUrl,
    externalUrl,
    collection,
    traits: attributes,
    marketplace: 'Magic Eden',
    marketplaceUrl: `https://magiceden.io/item-details/${mintAddress}`
  }
}
