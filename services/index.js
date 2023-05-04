exports.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.formatDate = (date) => {
  const moment = require('moment')
  return moment(date).format('MMMM D, YYYY')
}

exports.isNear = (address) => {
  return address.length && address.endsWith('.near')
}

exports.isVideo = (uri) => {
  let _isVideo;
  ['.mp4', '.mov'].forEach(fmt => {
    if (!_isVideo && uri && uri.endsWith(fmt)) {
      _isVideo = true
    }
  })
  return _isVideo
}

exports.formatBalance = (balance, decimals, toFixed = false) => {
  let formattedBalance = balance / (10 * parseInt('1'.padEnd(decimals, '0')))
  if (toFixed) {
    formattedBalance = formattedBalance.toFixed(formattedBalance > 1 ? 2 : 6)
  }
  return +parseFloat(formattedBalance)
}

exports.VALID_CHAINS = ['btc', 'eth', 'xtz', 'sol', 'near']

exports.getOrdinal = require('./btc/hiro').getOrdinal

exports.getAssetHelper = async (chain, contractAddress, tokenId, includeCollection) => {
  switch(chain) {
    case 'eth': {
      const { getAsset } = require('./ethereum/alchemy')
      const asset = await getAsset(chain, contractAddress, tokenId)
      return asset
    }
    case 'polygon': {
      const { getAsset } = require('./reservoir')
      const asset = await getAsset(chain, contractAddress, tokenId)
      return asset
    }
    case 'xtz': {
      const { getAsset } = require('./tezos/objkt')
      const asset = await getAsset(contractAddress, tokenId)
      return asset
    }
    case 'sol': {
      const { getAsset } = require('./solana/magiceden')
      const asset = await getAsset(contractAddress, includeCollection)
      return asset
    }
    case 'near': {
      const { getAsset } = require('./near/paras')
      const asset = await getAsset(contractAddress, tokenId, includeCollection)
      return asset
    }
  }
}

exports.getAssetsHelper = async (chain, walletAddress, collectionContractAddress) => {
  switch(chain) {
    case 'btc': {
      const { getAssets } = require('./btc/hiro')
      const assets = await getAssets(walletAddress)
      return assets
    }
    case 'eth': {
      const { getAssets } = require('./ethereum/alchemy')
      const assets = await getAssets(chain, walletAddress, collectionContractAddress)
      return assets
    }
    case 'polygon': {
      const { getAssets } = require('./reservoir')
      // const { getAssets } = require('./ethereum/alchemy')
      const assets = await getAssets(chain, walletAddress, collectionContractAddress)
      return assets
    }
    case 'xtz': {
      const { getAssets } = require('./tezos/objkt')
      const assets = await getAssets(walletAddress, collectionContractAddress)
      return assets
    }
    case 'sol': {
      const { getAssets } = require('./solana/magiceden')
      const assets = await getAssets(walletAddress)
      return assets
    }
  }
}

exports.getCollectionsHelper = async (chain, walletAddress, limit) => {
  switch (chain) {
    case 'eth':
    case 'polygon': {
      const { getCollections } = require('./reservoir')
      const collections = await getCollections(chain, walletAddress, limit)
      return collections
    }
  }
}

exports.getWalletHelper = async (chain, walletAddress) => {
  switch(chain) {
    case 'xtz': {
      const { getWalletBalances } = require('./tezos')
      const wallet = await getWalletBalances(walletAddress)
      return wallet
    }
    case 'near':
      const { getWallet } = require('./near')
      const wallet = await getWallet(walletAddress)
      return wallet
  }
}
