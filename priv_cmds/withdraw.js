const { constant, accountBlock } = require('@vite/vitejs')

module.exports = {
  command: 'withdraw',
  async execute (client, event, env) {
    try {
      if (!env.args[0] || !env.args[1]) {
        return client.v1.sendDm({
          recipient_id: env.senderId,
          text: `Usage: withdraw (receipt) (amount) <token>\nExample: ?withdraw ${env.wallet.address} 1 VITE`
        })
      }

      const tokenToWithdraw = { id: constant.Vite_TokenId, dec: constant.Vite_Token_Info.decimals }

      if (env.args[2]) {
        if (env.config.trusted_tokens[env.args[2]]) {
          tokenToWithdraw.id = env.config.trusted_tokens[env.args[2]][0]
          tokenToWithdraw.dec = env.config.trusted_tokens[env.args[2]][1]
        }
      }

      await client.v1.indicateDmTyping(env.senderId)

      const sBlock = accountBlock.createAccountBlock('callContract', {
        address: env.wallet.address,
        abi: env.config.contractAbi,
        methodName: 'withdraw',
        toAddress: env.config.contractAddress,
        params: [env.senderId, env.args[0], tokenToWithdraw.id, (parseFloat(env.args[1]) * parseFloat('1e+' + tokenToWithdraw.dec)).toString()]
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
              text: 'Withdraw success!'
            })

            env.logStream.write(`[WITHDRAW] BY: ${env.senderId}, TO: ${env.args[0]}, TOKEN: ${tokenToWithdraw.id}, AMOUNT: ${env.args[1]}\n`)
          } else {
            client.v1.sendDm({
              recipient_id: env.senderId,
              text: 'Withdraw failed!\n\nCheck your balance.'
            })
          }
        }
      }, 700)
    } catch (err) {
      client.v1.sendDm({
        recipient_id: env.senderId,
        text: `Withdraw failed!\n\nReason: ${err.message}`
      })
    }
  }
}
