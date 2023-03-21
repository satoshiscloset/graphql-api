const { fetch, formatDate, formatBalance } = require('../index.js')
const { ApolloClient, InMemoryCache, gql, HttpLink } = require('@apollo/client/core')

const BASE_URL = 'https://data.objkt.com/v3/graphql'
const TEZ_DECIMALS = 6

const getClient = () => {
  return new ApolloClient({
    uri: BASE_URL,
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: BASE_URL, fetch })
  });
}

exports.getAssets = async (walletAddress, contractAddress=null, offset = 0, limit = 50) => {
  const query = gql`
    query GetNFTs {
      token(where: {holders: {holder_address: {_eq: "${walletAddress}"}, quantity: {_gt: "0"}}}) {
        artifact_uri
        attributes {
          attribute {
            name
            value
          }
        }
        average
        decimals
        description
        display_uri
        extra
        flag
        highest_offer
        is_boolean_amount
        last_listed
        last_metadata_update
        level
        lowest_ask
        metadata
        mime
        name
        ophash
        pk
        rights
        supply
        symbol
        thumbnail_uri
        timestamp
        tags {
          tag {
            name
          }
        }
        token_id
        fa {
          name
          logo
          description
          timestamp
          floor_price
          volume_total
          path,
          items
        }
        fa_contract
        creators {
          holder {
            address
            alias
          }
        }
      }
    }
  `
  const client = getClient()
  const result = await client.query({query})
  console.log(result)
  return result.data.token
}

exports.getAsset = async (contractAddress, tokenId) => {
  const query = gql`
    query getAsset {
      token(where: {fa_contract: {_eq: "${contractAddress}"}, token_id: {_eq: "${tokenId}"}}) {
        artifact_uri
        attributes {
          attribute {
            name
            value
          }
        }
        average
        decimals
        description
        display_uri
        extra
        highest_offer
        is_boolean_amount
        last_listed
        last_metadata_update
        lowest_ask
        metadata
        mime
        ophash
        name
        pk
        rights
        supply
        symbol
        thumbnail_uri
        timestamp
        tags {
          tag {
            name
          }
        }
        token_id
        fa {
          name
          logo
          description
          timestamp
          floor_price
          volume_total
          path
          items
        }
        fa_contract
        creators {
          holder {
            address
            alias
          }
        }
      }
    }
  `
  const client = getClient()
  const result = await client.query({query})
  return _formatNFT(result.data.token[0])
}

const _formatBalance = (value) => {
  return formatBalance(value, TEZ_DECIMALS)
}

const _formatNFT = (nft) => {
  const { timestamp, fa_contract, token_id, name, decimals, description, display_uri, artifact_uri, thumbnail_uri, fa, mime, extra, attributes } = nft
  let videoUrl
  if (mime === 'video/mp4' || mime === 'video/quicktime') {
    extra.forEach(videoData => {
      if (!videoUrl) {
        if (videoData && videoData.mime_type === mime) {
          videoUrl = videoData.uri
        }
      }
    })
  }

  const traits = attributes.map(a => {
    const { name, value } = a.attribute
    return {
      trait_type: name,
      value
    }
  })

  return {
    chain: 'xtz',
    contractAddress: fa_contract,
    tokenId: token_id,
    name,
    description: description,
    imageUrl: display_uri || artifact_uri,
    thumbnailImageUrl: thumbnail_uri,
    videoUrl,
    collection: {
      marketplaceUrl: 'https://objkt.com/',
      id: fa_contract,
      name: fa.name,
      description: fa.description,
      imageUrl: fa.logo,
      stats: {
        marketplace: 'objkt',
        floorPrice: _formatBalance(fa.floor_price),
        volumeTotal: _formatBalance(fa.volume_total),
        totalSupply: fa.items
      }
    },
    traits,
    marketplace: 'objkt.com',
    marketplaceUrl: `https://objkt.com/asset/${fa_contract}/${token_id}`,
    mintDate: formatDate(timestamp)
  }
}
