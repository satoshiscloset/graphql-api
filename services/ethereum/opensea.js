const { fetch, isVideo } = require('../index.js')

const BASE_URL = 'https://api.opensea.io/api/v1'
const HEADERS = {'X-Api-Key': process.env.OPENSEA_API_KEY}

const _makeOpenseaRequest = async (url) => {
  const res = await fetch(url, { headers: HEADERS })
  const data = await res.json()
  if (data.success === false) {
    return false
  }
  return data
}

exports.getAsset = async (contractAddress, tokenId) => {
  const apiUrl = `${BASE_URL}/asset/${contractAddress}/${tokenId}`
  const data = await _makeOpenseaRequest(apiUrl)
  if (!data) {
    return { error: 'error getting NFT data from OpenSea'}
  }
  return _formatNFT(data)
}

exports.getAssets = async (walletAddress, collection = null, offset = 0, limit = 50) => {
  // graphQL pagination needed here? or is offset, limit enough? let the api caller do the pagination themselves
  let apiUrl = `${BASE_URL}/assets?owner=${walletAddress}&offset=${offset}&limit=${limit}&format=json`
  if (collection) {
    apiUrl += `&collection=${collection}`
  }
  const data = await _makeOpenseaRequest(apiUrl)
  if (!data) {
    // graphQL error reporting?
    console.log({ error: 'error getting NFT data from OpenSea'})
  }
  const assets = []
  console.log(data.assets.length)
  data.assets.forEach(d => {
    assets.push(_formatNFT(d))
  })
  return assets
}

const _formatNFT = (nft) => {
  const { asset_contract, token_id, name, description, collection, traits, permalink, image_url, image_thumbnail_url, animation_url } = nft
  const { stats = {}, slug } = collection
  const { one_day_volume, total_volume, total_sales, total_supply, num_owners, floor_price} = stats
  return {
    chain: 'eth',
    contractAddress: asset_contract.address,
    tokenId: token_id,
    name,
    description,
    imageUrl: image_url,
    thumbnailImageUrl: image_thumbnail_url || image_url,
    videoUrl: isVideo(animation_url) ? animation_url : isVideo(image_url) ? image_url : null,
    collection: {
      marketplaceUrl: 'https://opensea.io/',
      id: slug,
      name: collection.name,
      description: collection.description,
      imageUrl: collection.image_url,
      externalUrl: collection.external_url,
      stats: {
        marketplace: 'opensea',
        floorPrice: floor_price,
        numOwners: num_owners,
        totalSupply: total_supply,
        volumeTotal: total_volume,
        volume24h: one_day_volume
      }
    },
    traits,
    marketplaceUrl: permalink
  }
}
