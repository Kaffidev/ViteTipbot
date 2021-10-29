module.exports = {
  command: 'help',
  execute (client, event, env) {
    client.v1.sendDm({
      recipient_id: env.senderId,
      text: 'Commands:\nhelp, deposit, withdraw, balance(bal), tip, statistics(stats)\n\nReply(tweet) Commands:\ntip (amount) <token>\n\nFor more info execute command without args.'
    })
  }
}
