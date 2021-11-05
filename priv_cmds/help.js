module.exports = {
  command: 'help',
  execute (client, event, env) {
    client.v1.sendDm({
      recipient_id: env.senderId,
      text: `Commands:\n
help : Shows commands\n
deposit : Gives deposit wallet address and memo\n
withdraw (rec.) (amo.) <token> : Withdraws assets to recipient\n 
balance(bal) <token> : Shows balance\n
tip (@receipt) (amount) <token> : Tip users semi-privately\n
statistics(stats) <token> : Shows stats\n
\n\nReply(tweet) Commands:\ntip (amount) <token>\n\nFor more info execute command without args.`
    })
  }
}
