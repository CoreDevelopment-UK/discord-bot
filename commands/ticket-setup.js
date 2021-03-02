const CONFIG = require('../resources/config.json');
const TicketConfig = require('../models/TicketConfig');
const Discord = require('discord.js');

module.exports = {
    name: 'setup',
    description: "Initial setup for ticket bot. Creates a embed in the channel of message. (Server Owner Only)",
    async execute(message, args) {
        const filter = (m) => m.author.id === message.author.id;

        // Custom Ticket System Message
        const TicketEmbed = new Discord.MessageEmbed()
        .setTitle("Ticket Creation")
        .setDescription('In order to open a ticket you need to react with one of the following below to categorise your request.')
        .addFields(
            { 
                name: 'Client Support', 
                value: 'React with 🙋‍♂️ for support exclusively for clients. Anything related to services/support I provide.',
            },
            { 
                name: 'General Question', 
                value: 'React with ❓ if you have a general question or just cannot categorise your ticket use this.', 
            },
            { 
                name: 'Service Related', 
                value: 'React with ⚙️ if your is related to services I provide.',
            }
        )
        .setColor(CONFIG.UI.COL_PRIMARY)

        TicketMessage = await message.channel.send(TicketEmbed);
        try {
            const ticketConfig = await TicketConfig.create({
                messageId: TicketMessage.id,
                guildId: message.guild.id,
                roles: JSON.stringify(CONFIG.ROLES.MOD),
                parentId: CONFIG.CHANNELS.TICKETCATEGORY
            });
                    
            await TicketMessage.react('🙋‍♂️'),
            await TicketMessage.react('❓'),
            await TicketMessage.react('⚙️');
        } catch (err) {
            console.log(err)
        }
    }
}