const { fetch } = require('../index.js')

exports.getWallet = async (walletAddress) => {
  const balances = await getBalances(walletAddress)
  return {
    nfts: [],
    balances
  }
}

const getBalances = async (walletAddress) => {
  const balances = []
  const nearBalance = await getNearBalance(walletAddress)
  if (nearBalance) {
    balances.push(nearBalance)
  }
  return balances
}

const getNearBalance = async (walletAddress) => {
  const url = 'https://rpc.mainnet.near.org/'
  const payload = {
    id: 'wlt_graph_ql',
    jsonrpc: '2.0',
    method: 'query',
    params: {
      request_type: 'view_account',
      finality: 'optimistic',
      account_id: walletAddress
    }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  if (data.error) {
    const { name, cause, message } = data.error
    console.warn('error getting near balance: ', name, cause, message, data.error.data)
    return
  }
  return {
    name: 'Near',
    symbol: 'near',
    balance: data.result.amount,
    decimals: 24,
    contractAddress: data.result.code_hash,
    logoUrl: ''
  }
}
