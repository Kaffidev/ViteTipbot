const { constant, accountBlock } = require('@vite/vitejs')

module.exports = {
  command: 'tip',
  async execute (client, env) {
    try {
      if (!env.args[0]) {
        return client.v1.sendDm({
          recipient_id: env.senderId,
          text: 'Usage: tip (amount) <token>'
        })
      }

      const tokenToWithdraw = { symbol: constant.Vite_Token_Info.tokenSymbol, id: constant.Vite_TokenId, dec: constant.Vite_Token_Info.decimals }

      if (env.args[1]) {
        if (env.config.trusted_tokens[env.args[1].toUpperCase()]) {
          tokenToWithdraw.symbol = env.args[1].toUpperCase()
          tokenToWithdraw.id = env.config.trusted_tokens[env.args[1].toUpperCase()][0]
          tokenToWithdraw.dec = env.config.trusted_tokens[env.args[1].toUpperCase()][1]
        }
      }

      client.v2.tweets(env.tweetId, { expansions: 'in_reply_to_user_id', 'tweet.fields': 'author_id' }).then(async data => {
        if (!data.data[0].in_reply_to_user_id) {
          return client.v1.sendDm({
            recipient_id: env.senderId,
            text: 'You should reply to an user for sending tips!'
          })
        }

        const sBlock = accountBlock.createAccountBlock('callContract', {
          address: env.wallet.address,
          abi: env.config.contractAbi,
          methodName: 'tip',
          toAddress: env.config.contractAddress,
          params: [data.data[0].author_id, data.data[0].in_reply_to_user_id, tokenToWithdraw.id, (parseFloat(env.args[0]) * parseFloat('1e+' + tokenToWithdraw.dec)).toString()]
        }).setProvider(env.api).setPrivateKey(env.wallet.privateKey)

        await sBlock.autoSetPreviousAccountBlock()
        await sBlock.sign().send()

        const checker = setInterval(async () => {
          const checkBlock = await env.api.request('ledger_getAccountBlockByHash', sBlock.hash)

          if (checkBlock.receiveBlockHash) {
            clearInterval(checker)

            const lastBlock = await env.api.request('ledger_getAccountBlockByHash', checkBlock.receiveBlockHash)

            if ([...lastBlock.data][43] === 'A') {
              client.v2.user(data.data[0].in_reply_to_user_id).then(user => {
                client.v1.reply(`Tip success!\n\nTipped ${env.args[0]} ${tokenToWithdraw.symbol} to ${user.data.username}.`, env.tweetId)
              })

              env.logStream.write(`[TIP] FROM: ${data.data[0].author_id}, TO: ${data.includes.users[0].id}, TOKEN: ${tokenToWithdraw.id}, AMOUNT: ${env.args[0]}, TWEETID: ${env.tweetId}\n`)
            } else {
              client.v1.reply('Tip failed!\n\nCheck your balance.', env.tweetId)
            }
          }
        }, 700)
      })
    } catch (err) {
      client.v1.reply(`Tip failed!\n\nReason: ${err.message}.`, env.tweetId)
    }
  }
}
