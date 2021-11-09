module.exports = {
  command: 'help',
  execute (client, event, env) {
    client.v1.sendDm({
      recipient_id: env.senderId,
      text: `Commands:\n\n
?help : Shows commands
?deposit : Gives deposit wallet address and memo
?withdraw (rec.) (amo.) <token> : Withdraws assets to recipient
?balance(bal) <token> : Shows balance
?tip (@receipt) (amount) <token> : Tip users semi-privately
?statistics(stats) <token> : Shows stats
\nReply(tweet) Commands:
?tip (amount) <token>
\nExample: ?tip @TipbotVite 1 VITE`
    })
  }
}
