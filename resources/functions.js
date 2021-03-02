const CONFIG = require('../resources/config.json');
const Ticket = require('../models/Ticket');
const TicketConfig = require('../models/TicketConfig');
const Discord = require('discord.js');

module.exports = {
    UpdateTicket: function(action, ticket, info, message, author, transcription) {
        if (!author) {
            author = message.author
        }

        const embed = new Discord.MessageEmbed().setColor(CONFIG.UI.COL_PRIMARY);
        embed.setAuthor(`${client.channels.cache.find(channel => channel.id === ticket.channelId).name} Update`)
        embed.setTimestamp()
        embed.setFooter(`${message.guild.name} • Ticket Update`)


        if (action.toLowerCase().includes('created')) {
            embed.setColor('#00FF00')
            embed.setAuthor(`${client.channels.cache.find(channel => channel.id === ticket.channelId).name} Created`)
        } else if (action.toLowerCase().includes('closed')) {
            embed.setColor('#FF0000')
            embed.setAuthor(`${client.channels.cache.find(channel => channel.id === ticket.channelId).name} Closed`)
        } else if (action.toLowerCase().includes('deleted')) {
            embed.setColor('#8b0000')
            embed.setAuthor(`${client.channels.cache.find(channel => channel.id === ticket.channelId).name} Deleted`)
        }


        embed.addField("Ticket Number", ticket.ticketId, true)
        embed.addField("Ticket Author", client.users.cache.find(user => user.id === ticket.authorId), true)
        embed.addField("Category", ticket.ticketCategory, true)
        embed.addField("Action", action, true)
        embed.addField("Executor", author)
        if (info) {
            embed.addField("Info", `*${info}*`)
        }
        var channel = client.channels.cache.find(channel => channel.id === CONFIG.CHANNELS.LOG);
        if (transcription) {
            channel = client.channels.cache.find(channel => channel.id === CONFIG.CHANNELS.TRANSCRIPT)
        }
        channel.send(embed);
    },

    Notify: function(message, color, time, title) {
        var embed = new Discord.MessageEmbed();
        embed.setDescription(message)
        embed.setColor('#7383D8')

        if (title) {
            embed.setAuthor(title)
        }

        if (time) {
            embed.setTimestamp()
        }

        if (color) {
            if (color.toLowerCase() === "green") {
                embed.setColor('#00FF00')
            } else if (color.toLowerCase() === "red") {
                embed.setColor('#FF0000')
            }
        }

        return embed;
    },

    IsUser: async function(group, message, user) {
        group = group.toLowerCase()
        var member = message.member

        if (user) {
            member = await message.guild.members.fetch(user.id)
        }

        switch(group) {

            case "blacklisted":
            return member.roles.cache.some(role => CONFIG.ROLES.BLACKLIST.includes(role.id));
            
            case "staff":
            return member.roles.cache.some(role => CONFIG.ROLES.MOD.includes(role.id));

            case "muted":
            return member.roles.cache.some(role => CONFIG.ROLES.MUTED.includes(role.id));

            case "client":
            return member.roles.cache.some(role => CONFIG.ROLES.CLIENT.includes(role.id));
        }
    },

    CreateTicket: async function(user, message, type, author) {
        const FUNC = require("../resources/functions.js");
        const findTicket = await Ticket.findOne({ where: { authorId: user.id, resolved: false}});
        const ticketConfig = await TicketConfig.findOne();

        try {
            /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Filter Users
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            if (findTicket) { // Checks if the user already has a ticket
                user.send(FUNC.Notify('You already have a ticket open.', 'red'));
                return;
            } else if (await FUNC.IsUser("blacklisted", message, user)) { // Checks if the user is on the blacklist
                user.send(FUNC.Notify('You are blacklisted from opening tickets.', 'red'));
                return;
            } else if (await FUNC.IsUser("muted", message, user)) { // Checks if the user is muted
                user.send(FUNC.Notify('You are muted, wait to be unmuted to create a ticket.', 'red'));
                return;
            } else if ((type === "type_client") && (! await FUNC.IsUser("client", message, user))) { // Checks if the user has the client role for client tickets
                user.send(FUNC.Notify('Only clients can open Client Support tickets.', 'red'))
                return;
            } else if (type && !ticketConfig) { // Checks if the ticket is opened via ticketconfig - type is not used on command ticket open.
                return;
            }

            /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Ticket Variables
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            const roleIdsString = ticketConfig.getDataValue('roles'); // Fetch admin roles from config
            const roleIds = JSON.parse(roleIdsString); // Parse RoleID
            const permissions = roleIds.map((id) => ({ allow: 'VIEW_CHANNEL', id})); // Give the creator VIEW_CHANNEL permissions
            var embed;

            /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Ticket Category
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            var category;
            if (type === "type_client") {
                category = "Client Support"
            } else if (type === "type_general") {
                category = "General Support"
            } else if (type === "type_service") {
                category = "Service Related"
            } else {
                category = "Not Specified"
            }

            /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Create Ticket Channel
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            const channel = await message.guild.channels.create(`ticket`, { // Create the channel
                parent: ticketConfig.getDataValue("parentId"),
                permissionOverwrites: [
                    { deny: 'VIEW_CHANNEL', id: message.guild.id },
                    { allow: 'VIEW_CHANNEL', id: user.id },
                    ...permissions
                ]
            });
            
            /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Welcome Messages
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            if (type === "type_client") {
                embed = new Discord.MessageEmbed()
                .setTitle(`Client Support Ticket Created`)
                .setDescription(`Welcome ${user.username}, your ticket has been created. Please provide the service you need assistance with and description of your issue.`)
                .setColor(CONFIG.UI.COL_PRIMARY)
            } else if (type === "type_general") {
                embed = new Discord.MessageEmbed()
                .setTitle(`General Ticket Created`)
                .setDescription(`Welcome ${user.username}, your ticket has been created. What is your query?`)
                .setColor(CONFIG.UI.COL_PRIMARY)
            } else if (type === "type_service") {
                embed = new Discord.MessageEmbed()
                .setTitle(`Service Related Ticket Created`)
                .setDescription(`Welcome ${user.username}, your ticket has been created. Please provide details around what service you are requesting and a detailed description of what you want.`)
                .setColor(CONFIG.UI.COL_PRIMARY)
            } else {
                embed = new Discord.MessageEmbed()
                .setTitle(`Ticket Created`)
                .setDescription(`Welcome ${user.username}, your ticket has been created by ${author.username}.`)
                .setColor(CONFIG.UI.COL_PRIMARY)
            }
            channel.send(embed)

            /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Checks for Online Staff - Currently not working
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            const userOnline = true;
            if (!userOnline) {
                embed = new Discord.MessageEmbed()
                .setTitle(`Staff Availability Notice`)
                .setDescription("There is currently no staff online, please could you wait and someone will get to you.")
                .setColor(CONFIG.UI.COL_PRIMARY)
                channel.send(embed)
            }

            /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Close Ticket Message
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            embed = new Discord.MessageEmbed()
            .setDescription("React with 🔒 to close your ticket.")
            .setColor(CONFIG.UI.COL_PRIMARY)
            .setFooter(`${message.guild.name} • Ticket Created`)
            const msg = await channel.send(embed)
            await msg.react('🔒');
            msg.pin();
        
            /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Add the Ticket to the Database
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
            const ticket = await Ticket.create({
                authorId: user.id,
                channelId: channel.id,
                guildId: message.guild.id,
                resolved: false,
                ticketCategory: category,
                closedMessageId: msg.id,
                modToolMessageId: null
            });

            const ticketId = String(ticket.getDataValue('ticketId')).padStart(4, 0);
            await channel.edit({ name: `ticket-${ticketId}`})

            if (author) {
                FUNC.UpdateTicket("Ticket Created", ticket, null, message, author)
            } else {
                FUNC.UpdateTicket("Ticket Created", ticket, null, message, client.users.cache.find(user => user.id === ticket.authorId))
            }
        } catch(err) {
            console.log(err)
        }
    },

    CloseTicket: async function(ticket, message, user, reason) {
        const FUNC = require("../resources/functions.js");
        if (ticket && !ticket.resolved) {

            message.channel.updateOverwrite(ticket.getDataValue('authorId'), {
                VIEW_CHANNEL: false 
            }).catch((err) => console.log(err));

            message.channel.send(FUNC.Notify(`${user} has closed their ticket.`, 'red'))

            // Generates close message
            const msg = await message.channel.send(FUNC.Notify("📝 Save transcript\n🔓 Reopen Ticket\n⛔ Delete Ticket", 'red', null, 'Mod Tools'))
            await msg.react('📝');
            await msg.react('🔓');
            await msg.react('⛔');
            ticket.modToolMessageId = msg.id;
            ticket.resolved = true;
            await ticket.save();

            if (reason) {
                FUNC.UpdateTicket("Ticket Closed", ticket, reason, message, user)
            } else {
                FUNC.UpdateTicket("Ticket Closed", ticket, null, message, user)
            }
        }
    },

    TranscribeChannel: async function(message, path, ticket) {
        const fs = require("fs").promises;
        const jsdom = require('jsdom');
        const { JSDOM } = jsdom;
        const dom = new JSDOM();
        const document = dom.window.document;
        const FUNC = require("../resources/functions.js");

        let messageCollection = new Discord.Collection();
        let channelMessages = await message.channel.messages.fetch({
            limit: 100
        }).catch(err => console.log(err));
        
        messageCollection = messageCollection.concat(channelMessages);

        while(channelMessages.size === 100) {
            let lastMessageId = channelMessages.lastKey();
            channelMessages = await message.channel.messages.fetch({ 
                limit: 100, 
                before: lastMessageId
            }).catch(err => console.log(err));
            if (channelMessages) {
                messageCollection = messageCollection.concat(channelMessages);
            }
        }

        let msgs = messageCollection.array().reverse();
        let data = await fs.readFile('./resources/template.html', 'utf8').catch(err => console.log(err));
        if (data) {
            await fs.writeFile(path, data).catch(err => console.log(err));
            let guildElement = document.createElement('div');
            let guildText = document.createTextNode(message.guild.name);
            let guildImg = document.createElement('img');
            guildImg.setAttribute('src', CONFIG.UI.LOGO);
            guildImg.setAttribute('width', '150');
            guildElement.appendChild(guildImg);
            guildElement.appendChild(guildText);
            await fs.appendFile(path, guildElement.outerHTML).catch(err => console.log(err));

            msgs.forEach(async msg => {
                let parentContainer = document.createElement("div");
                parentContainer.className = "parent-container";
                
                /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                HTML: AVATAR
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
                let avatarDiv = document.createElement("div");
                avatarDiv.className = "avatar-container";
                
                let img = document.createElement("img");
                img.setAttribute("src", msg.author.displayAvatarURL())
                img.className = "avatar";
                avatarDiv.appendChild(img);

                parentContainer.appendChild(avatarDiv);

                /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                HTML: MESSAGE TIME AND AUTHOR
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
                let messageContainer = document.createElement("div");
                messageContainer.className = "message-container";

                let nameElement = document.createElement("span");
                let name = document.createTextNode(msg.author.tag + " " + msg.createdAt.toDateString() + " " + msg.createdAt.toLocaleTimeString() + " GMT");
                nameElement.appendChild(name);
                messageContainer.append(nameElement);
                
                /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                HTML: CODE BLOCK
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
                if ((msg.content.startsWith("```") && msg.content.endsWith("```")) || (msg.content.startsWith("``") && msg.content.endsWith("``")) || (msg.content.startsWith("`") && msg.content.endsWith("`"))) {
                    let m = msg.content.replace(/```/g, "");
                    let codeNode = document.createElement("code");
                    let textNode = document.createTextNode(m);
                    codeNode.appendChild(textNode)
                    messageContainer.appendChild(codeNode);
                } else {
                    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    HTML: MESSAGE CONTENT
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
                    let msgNode = document.createElement("span");
                    let textNode = document.createTextNode(msg.content);
                    msgNode.append(textNode);
                    messageContainer.appendChild(msgNode);
                }

                parentContainer.appendChild(messageContainer);
                await fs.appendFile(path, parentContainer.outerHTML).catch(err => console.log(err));
            });

            message.channel.send(FUNC.Notify("Transcript File Generating...", "green")).then(msg => {
                setTimeout(async () => {
                    const channel = client.channels.cache.find(channel => channel.id === CONFIG.CHANNELS.TRANSCRIPT);

                    // Sends the message to the transcript channel saying its been generated. (action, ticket, info, message, author, transcription)
                    FUNC.UpdateTicket("Transcript Generated", ticket, null, message, client.users.cache.find(user => user.id === ticket.authorId), true)
    
                    // Send the transcript file
                    var date = message.channel.createdAt.toString().split(" ")
                    var time = date[4].toString().replace(/:/g, "").slice(0, -2);
                    file = await channel.send({ files: [`./ticket-logs/${message.channel.name.toUpperCase()}-${date[2]}-${date[1].toUpperCase()}-${date[3]}-${time}.html`] }).catch(err => console.log(err));
    
                    // Sends a message to the log channel saying its been generated
                    FUNC.UpdateTicket("Transcript Generated", ticket, `Ticket transcription generated and can be found [here](${file.url}).`, message, client.users.cache.find(user => user.id === ticket.authorId))
    
                    // Send a message to let them know its been created.
                    return msg.edit(FUNC.Notify(`Ticket transcription generated and can be found [here](${file.url}).`, "green"))
                }, 1500)
            })
        }
    }
}