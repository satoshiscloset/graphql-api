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
    mime_type
  } = data
  return {
    chain:          'btc',
    id,
    inscriptionId:  number,
    transactionId:  tx_id,
    ownerAddress:   address,
    timestamp,
    location,
    output,
    value,
    satOrdinal:     sat_ordinal,
    satRarity:      sat_rarity,
    contentUrl:     `https://api.hiro.so/ordinals/v1/inscriptions/${number}/content`,
    mimeType:       mime_type,
    mintDate:       formatDate(timestamp)
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
