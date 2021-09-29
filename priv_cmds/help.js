module.exports = {
  command: 'help',
  execute (client, event, env) {
    client.v1.sendDm({
      recipient_id: env.senderId,
      text: 'Commands:\nhelp, deposit, withdraw, balance(bal), tip, statistics(stats)\nReply(tweet) Commands: tip (amount) <token>\n\nHelpful links:\nhttps://vite.org/ - Vites Official Website\nhttps://twitter.com/KaffinP/status/1441859291468779520 - How to use commands'
    })
  }
}
