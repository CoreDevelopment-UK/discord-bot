require('dotenv').config();
const Ticket = require('./models/Ticket');
const FUNC = require("./resources/functions.js");
const CONFIG = require('./resources/config.json');
const Discord = require('discord.js');
global.client = new Discord.Client();
// console.log('hello')
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Custom Commands
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
const fs = require('fs');
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for(const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Initial Startup
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
client.once('ready', async () => {
    const db = require ('./database.js');
    const TicketConfig = require('./models/TicketConfig');

    console.log(`[Discord Bot Initialised - Logged  in as ${client.user.tag}].`)
    client.user.setPresence({ activity: { name: 'for commands', type: 'WATCHING' }, status: 'idle' })
    db.authenticate()

    .then(() => {
        console.log('[Database Connection Successful.]');
        Ticket.init(db);
        TicketConfig.init(db);
        Ticket.sync();
        TicketConfig.sync();
    }).catch((err) => {
        return console.log(`DATABASE ERROR: ${err}`);
    });
});

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Commands
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
client.on('message', async (message) => {
    if (message.author.bot) return;
    if (message.content[0] != CONFIG.PREFERENCES.PREFIX) return;

    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Command Content Vars
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    let args = message.content.substring(CONFIG.PREFERENCES.PREFIX.length).split(" ")
    let argsstr = message.content.substring(CONFIG.PREFERENCES.PREFIX.length);
    argsstr = argsstr.substr(argsstr.indexOf(" ") + 1)

    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Commands
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    switch(args[0]) {

        case "add":
            if (await FUNC.IsUser("staff", message)) {
                client.commands.get('add').execute(message, args)
                await message.delete();
            }
        break;

        case "remove":
            if (await FUNC.IsUser("staff", message)) {
                client.commands.get('remove').execute(message, args)
                await message.delete();
            }
        break;

        case "close":
            if (await FUNC.IsUser("staff", message)) {
                client.commands.get('close').execute(message, argsstr)
                await message.delete();
            }
        break;

        case "new":
            if (await FUNC.IsUser("staff", message)) {
                client.commands.get('new').execute(message, args)
                await message.delete();
            }
        break;

        case "setup":
            if (message.author.id === message.guild.ownerID) {
                client.commands.get('setup').execute(message, args)
                await message.delete();
            }
        break;

        case "rules":
            if (message.author.id === message.guild.ownerID) {
                client.commands.get('rules').execute(message, args)
                await message.delete();
            }
        break;

        case "release":
            if (message.author.id === message.guild.ownerID) {
                client.commands.get('release').execute(message, argsstr)
                await message.delete();
            }
        break;
    }
    console.log(`[${message.guild.name}] ${args[0]} command ran by ${message.author.username}.`)
});

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Ticket Reactions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

client.on('messageReactionAdd', async (reaction, user) => {
    let message = reaction.message, emoji = reaction.emoji, channel = reaction.message.channel
    if (user.bot) return;
    if (emoji.name === '🙋‍♂️' || emoji.name === '❓' || emoji.name === '⚙️' || emoji.name === '🔒' || emoji.name === '⛔' || emoji.name === '📝' || emoji.name === '🔓') {

        /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Remove the Emoji
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
        const ticket = await Ticket.findOne({ where: { channelId: message.channel.id }})
        const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
        try {
            for (const reaction of userReactions.values()) {
                await reaction.users.remove(user.id);
            }
        } catch (err) {
            console.error(err);
        }

        /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        Emoji Switch
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
        switch(emoji.name) {
            // Open Ticket Emojis
            case "🙋‍♂️":
                FUNC.CreateTicket(user, message, "type_client").catch(err => console.log(err));
            break;

            case "❓":
                FUNC.CreateTicket(user, message, "type_general").catch(err => console.log(err));
            break;

            case "⚙️":
                FUNC.CreateTicket(user, message, "type_service").catch(err => console.log(err));
            break;

            // Close a Ticket
            case "🔒":
                const closedMessageId = ticket.getDataValue('closedMessageId');
                if (user.id !== ticket.authorId && message.id === closedMessageId) return;
                FUNC.CloseTicket(ticket, message, user, "Closed by Ticket Author").catch(err => console.log(err));
            break;

            // Delete the Ticket
            case "⛔":
                try {
                    if (ticket && ticket.resolved && ticket.modToolMessageId === message.id) {
                        let filter = m => m.author.id === user.id;
                        let check = true
                        message.channel.send(FUNC.Notify("Channel will be deleted in 5 seconds. Type `cancel` to stop the deletion.", "red")).then(msg => {
                            message.channel.awaitMessages(filter, {
                                max: 1,
                                time: 5000,
                                errors: ['time']
                            }).then(message => {
                                message = message.first()
                                if (message.content.toLowerCase() === "cancel") {
                                    message.delete();
                                    check = false
                                    msg.edit(FUNC.Notify("Ticket Deletion Cancelled.", "green")).then(msg => {msg.delete({ timeout: 5000 })})
                                }
                            })
                            setTimeout(() => {
                                if (!check) return;
                                FUNC.UpdateTicket("Ticket Deleted", ticket, null, message, user)
                                message.channel.delete()
                            }, 5000)
                        })
                    }
                } catch(err) {
                    console.error
                }
            break;

            // Save Transcript
            case "📝":
                if (ticket && ticket.resolved && ticket.modToolMessageId === message.id) {
                    var date = message.channel.createdAt.toString().split(" ")
                    var time = date[4].toString().replace(/:/g, "").slice(0, -2)
                    const path = `./ticket-logs/${message.channel.name.toUpperCase()}-${date[2]}-${date[1].toUpperCase()}-${date[3]}-${time}.html`
                    FUNC.TranscribeChannel(message, path, ticket)
                }
            break;

            // Reopen Ticket
            case "🔓":
                if (ticket && ticket.resolved && ticket.modToolMessageId === message.id) {
                    channel.send(FUNC.Notify("Ticket Reopened.", "green"))

                    channel.updateOverwrite(ticket.getDataValue('authorId'), {
                        VIEW_CHANNEL: true 
                    }).catch((err) => console.log(`[${message.guild.name}] TICKET CLOSE ERROR: ${err}`));
                    ticket.resolved = false;
                    ticket.save();

                    message.channel.messages.fetch(ticket.modToolMessageId)
                    .then(message.delete())
                    .catch(console.error);

                    FUNC.UpdateTicket("Ticket Reopened", ticket, null, message, user)
                }
            break;
        }
    }
});

client.login(process.env.BOT_TOKEN);