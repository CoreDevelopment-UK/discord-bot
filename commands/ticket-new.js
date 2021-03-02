const FUNC = require("../resources/functions.js");

module.exports = {
    name: 'new',
    description: "Creates a ticket for a user. (Staff Only)",
    async execute(message) {
        const mentionedUser = message.mentions.users.first();

        if (!mentionedUser) return;
        FUNC.CreateTicket(mentionedUser, message, null, message.author).catch(err => console.log(err))
    }
}