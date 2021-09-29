const { accountBlock, constant } = require('@vite/vitejs')

module.exports = {
  command: 'tip',
  async execute (client, event, env) {
    if (!env.args[0] || !env.args[1]) {
      return client.v1.sendDm({
        recipient_id: env.senderId,
        text: 'Usage: tip (receipt) (amount) <token>\nExample: ?tip @KaffinP 1 VITE'
      })
    }

    const tippingUser = await client.v2.userByUsername(env.args[0].replace('@', '')).catch(() => {
      return client.v1.sendDm({
        recipient_id: env.senderId,
        text: 'Tip failed!\nReason: User not found.'
      })
    })

    if (!tippingUser.data?.id) {
      return client.v1.sendDm({
        recipient_id: env.senderId,
        text: 'Tip failed!\nReason: User not found.'
      })
    }

    const tokenToTip = { name: 'VITE', id: constant.Vite_TokenId, dec: constant.Vite_Token_Info.decimals }

    if (env.args[2] && env.args[2].toUpperCase() !== 'VITE') {
      if (env.config.trusted_tokens[env.args[2].toUpperCase()]) {
        tokenToTip.name = env.args[2].toUpperCase()
        tokenToTip.id = env.config.trusted_tokens[env.args[2].toUpperCase()][0]
        tokenToTip.dec = env.config.trusted_tokens[env.args[2].toUpperCase()][1]
      }
    }

    const sBlock = accountBlock.createAccountBlock('callContract', {
      address: env.wallet.address,
      abi: env.config.contractAbi,
      methodName: 'tip',
      toAddress: env.config.contractAddress,
      params: [env.senderId, tippingUser.data.id, tokenToTip.id, (parseFloat(env.args[1]) * parseFloat('1e+' + tokenToTip.dec)).toString()]
    }).setProvider(env.api).setPrivateKey(env.wallet.privateKey)

    await sBlock.autoSetPreviousAccountBlock()
    await sBlock.sign().send()

    const checker = setInterval(async () => {
      const checkBlock = await env.api.request('ledger_getAccountBlockByHash', sBlock.hash)

      if (checkBlock.receiveBlockHash) {
        clearInterval(checker)

        const lastBlock = await env.api.request('ledger_getAccountBlockByHash', checkBlock.receiveBlockHash)

        if ([...lastBlock.data][43] === 'A') {
          client.v1.sendDm({
            recipient_id: env.senderId,
            text: `Tip success!\nTipped ${env.args[1]} ${tokenToTip.name} to ${env.args[0].replace('@', '')}.`
          })

          const sender = await client.v2.user(env.senderId)

          client.v1.sendDm({
            recipient_id: tippingUser.data.id,
            text: `Received tip!\nSender: @${sender.data.username}\nAmount: ${env.args[1]} ${tokenToTip.name}`
          }).catch(() => {})

          env.logStream.write(`[TIP] FROM: ${env.senderId}, TO: ${tippingUser.data.id}, TOKEN: ${tokenToTip.id}, AMOUNT: ${env.args[1]}\n`)
        } else {
          client.v1.sendDm({
            recipient_id: env.senderId,
            text: 'Tip failed!\nCheck your balance.'
          })
        }
      }
    }, 700)
  }
}
