const { fetch, formatDate } = require('../index.js')

const _formatOrdinal = (data) => {
  const {
    id,
    number,
    tx_id,
    timestamp,
    address,
    location,
    output,
    value,
    sat_ordinal,
    sat_rarity,
    mime_type,
    genesis_block_height
  } = data

  const traits = [
    {trait_type: 'Sat', value: sat_ordinal},
    {trait_type: 'Sat Rarity', value: sat_rarity},
    // {trait_type: 'Ordinal Id', value: id},
    // {trait_type: 'Transaction Id', value: tx_id},
  ]
  return {
    chain:            'btc',
    contractAddress:  'btc',
    tokenId:          number,
    name:             `Inscription #${number}`,
    description:      '',
    mediaUrl:         `https://api.hiro.so/ordinals/v1/inscriptions/${number}/content`,
    mimeType:         mime_type,
    traits,
    externalUrl:      `https://ordinals.com/inscription/${id}`,
    mintDate:         formatDate(timestamp),
    tokenType:        'ordinals'

    // id,
    // inscriptionId:  number,
    // transactionId:  tx_id,
    // ownerAddress:   address,
    // timestamp,
    // location,
    // output,
    // value,
    // satOrdinal:     sat_ordinal,
    // satRarity:      sat_rarity,
    // contentUrl:     `https://api.hiro.so/ordinals/v1/inscriptions/${number}/content`,
    // mimeType:       mime_type,
    // mintDate:       formatDate(timestamp)
  }
}

exports.getOrdinal = async (inscriptionId) => {
  const url = `https://api.hiro.so/ordinals/v1/inscriptions/${inscriptionId}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) {
    return data
  }
  const { results } = data
  return _formatOrdinal(data)
}

exports.getAssets = async (walletAddress, offset=0, limit=60) => {
  const url = `https://api.hiro.so/ordinals/v1/inscriptions?limit=${limit}&address=${walletAddress}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) {
    return data
  }
  const { results } = data
  const formattedResults = results.map(result => _formatOrdinal(result))
  console.log(formattedResults)
  return formattedResults
}
