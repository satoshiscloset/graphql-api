const { fetch, isVideo, formatBalance } = require('../index.js')

const BASE_URL = 'https://api-v2-mainnet.paras.id'
const NEAR_DECIMALS = 24

exports.getAsset = async (contractId, tokenId, includeCollection=false) => {
  const asset = await _fetch(`token?contract_id=${contractId}&token_id=${tokenId}`)
  if (asset) {
    let collection = null
    if (includeCollection) {
      // TODO: get collection here
      collection = await getCollection(contractId)
    }
    return _formatNFT(asset, collection)
  }
}

const getCollection = async (contractId) => {
  const collection = await _fetch(`collections?collection_id=${contractId}`)
  return collection
}

const _fetch = async(path) => {
  const url = `${BASE_URL}/${path}`
  const res = await fetch(url)
  const data = await res.json()
  return data.data.results.length && data.data.results[0]
}

const _formatBalance = (value) => {
  return formatBalance(value, NEAR_DECIMALS)
}

const _formatMedia = (uri) => {
  let imageUrl, videoUrl
  if (isVideo(uri)) {
    videoUrl = uri
  } else {
    if (uri.startsWith('https://') || uri.startsWith('ipfs://')) {
      imageUrl = uri
    } else {
      imageUrl = `ipfs://${uri}`
    }
  }
  return { imageUrl, videoUrl }
}

const _formatNFT = (nft, collectionData=null) => {
  const { contract_id, token_id, metadata, price, has_price } = nft
  const { title, description, media, extra, attributes } = metadata
  const { imageUrl, videoUrl } = _formatMedia(media)
  let _collection = {
    marketplaceUrl: 'https://paras.id/'
  }
  if (collectionData) {
    const { collection, description, media, total_cards, total_owners, volume, has_floor_price, floor_price, socialMedia = {} } = collectionData
    const mediaData = _formatMedia(media)
    _collection = {
      ..._collection,
      id: contract_id,
      name: collection,
      description,
      imageUrl: media.imageUrl,
      stats: {
        marketplace: 'paras',
        numOwners: total_owners,
        totalSupply: total_cards,
        volumeTotal: _formatBalance(volume),
        floorPrice: has_floor_price ? _formatBalance(floor_price) : null
      },
      externalUrl: socialMedia.website
    }
  }
  return {
    chain: 'near',
    contractAddress: contract_id,
    tokenId: token_id,
    name: title,
    description,
    imageUrl,
    thumbnailImageUrl: imageUrl,
    videoUrl,
    collection: _collection,
    traits: attributes,
    marketplace: 'Paras',
    marketplaceUrl: `https://paras.id/token/${contract_id}/${token_id}`,
    mintDate: ''
  }
}
