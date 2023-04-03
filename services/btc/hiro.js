const { fetch } = require('../index.js')

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
    contentUrl:     `https://ordinals.com/content/${id}`,
    mimeType:       mime_type,
  }
}

exports.getOrdinal = async (inscriptionId) => {
  const url = `https://api.hiro.so/ordinals/v1/inscriptions?from_number=${inscriptionId}&to_number=${inscriptionId}&limit=1&order=asc`
  const res = await fetch(url)
  const data = await res.json()
  const { results } = data
  if (results && results.length) {
    return _formatOrdinal(results[0])
  }
}
