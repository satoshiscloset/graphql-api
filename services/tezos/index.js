const { fetch, formatBalance } = require('../index.js')

const SYMBOL = 'xtz'
const NAME = 'Tezos'
const DEFAULT_DECIMALS = 6
const BASE_URL = 'https://api.tzkt.io/v1'

const _makeRequest = async (path) => {
  const url = `${BASE_URL}/${path}`
  const res = await fetch(url)
  const data = await res.json()
  return data
}

const _formatBaseTokenBalance = (balance) => {
  return {
    name: NAME,
    symbol: SYMBOL,
    balance: formatBalance(balance, DEFAULT_DECIMALS),
    decimals: DEFAULT_DECIMALS,
    contractAddress: 'tez',
    logoUrl: '',
  }
}

const _parseAssets = (assets) => {
  const balances = []
  const nfts = []
  assets.forEach(a => {
    const { balance, token } = a
    const { tokenId, contract, standard, metadata = {} } = token
    const { name, symbol, decimals }  = metadata

    if (decimals === '0') {
      // this means we've found an NFT
      const { description, formats = [], tags, attributes = [], displayUri, artifactUri, thumbnailUri } = metadata
      let videoUrl = null
      formats.forEach(f => {
        if (!videoUrl && f.mimeType.startsWith('video/')) {
          videoUrl = f.uri
        }
      })
      nfts.push({
        chain: SYMBOL,
        contractAddress: contract.address,
        tokenId,
        name,
        description,
        imageUrl: displayUri || artifactUri,
        thumbnailImageUrl: thumbnailUri,
        videoUrl,
        collection: {
          name: contract.alias
        },
        traits: attributes && attributes.map(a => { return {trait_type: a.name, value: a.value} }),
        tags
      })
    } else {
      balances.push({
        name,
        symbol,
        balance: formatBalance(balance, decimals),
        decimals,
        contractAddress: contract.address,
        logoUrl: '',
      })
    }
  })
  return { balances, nfts }
}

exports.getWalletBalances = async (address) => {
  const tezBalance = await getBaseTokenBalance(address)
  const { balances, nfts } = await getTokenBalances(address)
  return { balances: [...balances, tezBalance], nfts }
}

const getBaseTokenBalance = async (address) => {
  const url = `accounts/${address}/balance`
  const data = await _makeRequest(url)
  return _formatBaseTokenBalance(data)
}

const getTokenBalances = async (address) => {
  const url = `tokens/balances?account=${address}`
  const data = await _makeRequest(url)
  return _parseAssets(data)
}
