const FUNC = require("../resources/functions.js");
const Ticket = require('../models/Ticket');

module.exports = {
    name: 'close',
    description: "Closes a ticket. (Staff Only)",
    async execute(message, argsstr) {
        const ticket = await Ticket.findOne({ where: { channelId: message.channel.id }})
        const user = client.users.cache.find(user => user.id === ticket.authorId)

        if (argsstr === "close") {
            argsstr = "";
        }
        
        FUNC.CloseTicket(ticket, message, message.author, argsstr).catch(err => console.log(err));
        
        if (argsstr) {
            user.send(FUNC.Notify(`Your ticket was closed by ${message.author} with the reason: ${argsstr}.`))
        } else {
            user.send(FUNC.Notify(`Your ticket was closed by ${message.author} with no reason.`))
        }
    }
}