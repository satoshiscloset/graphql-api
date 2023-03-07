const { fetch, isVideo } = require('../index.js')

const BASE_URL_ETH_MAINNET = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETH_API_KEY}`
const BASE_URL_POLYGON_MAINNET = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_API_KEY}`

const _makeRequest = async (path, chain) => {
  let baseUrl = BASE_URL_ETH_MAINNET
  if (chain === 'polygon') {
    baseUrl = BASE_URL_POLYGON_MAINNET
  }
  const res = await fetch(`${baseUrl}/${path}`)
  const data = await res.json()
  return data
}

exports.getAsset = async (contractAddress, tokenId) => {
  const path = `getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`
  const data = await _makeRequest(path)
  if (!data) {
    return { error: 'error getting NFT data from alchemy'}
  }
  return _formatNFT(data)
}

exports.getAssets = async (chain, walletAddress, collection = null, offset = 0, limit = 50) => {
  // graphQL pagination needed here? or is offset, limit enough? let the api caller do the pagination themselves
  let path = `getNFTs?owner=${walletAddress}&filters\[\]=SPAM`
  if (collection) {
    path += `&contractAddresses\[\]=${collection}`
  }
  const data = await _makeRequest(path, chain)
  if (!data) {
    // graphQL error reporting?
    console.log({ error: 'error getting NFT data from alchemy'})
  }
  const assets = []
  data.ownedNfts.forEach(d => {
    assets.push(_formatNFT(d))
  })
  return assets
}

const _formatNFT = (nft) => {
  const { contract, id, title, media, metadata, contractMetadata } = nft
  const { name, description, image, attributes } = metadata
  const { openSea } = contractMetadata

  const contractAddress = contract.address
  const tokenId = BigInt(id.tokenId).toString(10)

  return {
    chain: 'eth',
    contractAddress: contract.address,
    tokenId: id.tokenId,
    name,
    description,
    imageUrl: image,
    thumbnailImageUrl: image,
    // videoUrl: isVideo(animation_url) ? animation_url : isVideo(image_url) ? image_url : null,
    collection: {
      marketplaceUrl: 'https://opensea.io/',
      // id: slug,
      name: openSea.collectionName,
      description: openSea.description,
      imageUrl: openSea.imageUrl,
      externalUrl: openSea.externalUrl
    },
    traits: attributes,
    marketplaceUrl: `https://opensea.io/${contractAddress}/${tokenId}`,
    tokenType: id.tokenMetadata.tokenType
  }
}
