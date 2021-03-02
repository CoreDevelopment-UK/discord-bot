const CONFIG = require('../resources/config.json');
const Discord = require('discord.js');

module.exports = {
    name: 'rules',
    description: "Creates the rules message. (Server Owner Only)",
    execute(message) {
        let embed = new Discord.MessageEmbed().setColor(CONFIG.UI.COL_PRIMARY)

        // Welcome
        embed.setTitle("Welcome to the Server!")
        embed.setDescription("Hello and welcome to my Discord server! Below is all the information you'll need when in this server. I wish you all a pleasant stay.\n\nThanks.")
        embed.setThumbnail(CONFIG.UI.LOGO)
        message.channel.send(embed)

        // Server Rules Start
        embed.setTitle("Server Rules")
        embed.setDescription("Just going to keep this short, go to both the links below and read them, they essentially are the main rules for this server with the additional ones below.\n\n• [Terms of Service](https://discord.com/terms)\n\n• [Community Guidelines](https://discord.com/guidelines)\n\n")
        embed.setThumbnail()
        message.channel.send(embed)

        // Server Rules General
        embed.setTitle("General Rules")
        embed.setDescription("1. Do not advertise other Discord servers\n\n2. Be respectful to all members.\n\n3. Do not argue with Moderators, their word is final.\n\n4. Use common sense.\n\n5. Use English in text channels, if you cannot communicate in clear English then go elsewhere.")
        message.channel.send(embed)

        // Ticket Rules
        embed.setTitle("Ticket Rules")
        embed.setDescription("1. Do not open tickets for no reason, you will just be blacklisted if you do.\n\n2. If you open a ticket, provide details regarding your reason or it'll just be closed.\n\n3. If your ticket is not responded to, do not spam Moderators either through DMs or in the server.\n\n4. When opening a ticket, please categorise your request correctly\n\n5. Keep the ticket relevant to your request.")
        message.channel.send(embed)

        // Content Rules
        embed.setTitle("Content Rules")
        embed.setDescription("1. Do not share any personal information.\n\n2. Do not promote any illegal sites/Discord servers.\n\n3. Do not bring/start any conflicts in this Discord server - keep them to DMs.\n\n4. If you require support open a ticket, do not use the General chat or DMs as a way of support")
        message.channel.send(embed)

        // Information
        embed.setTitle("Information")
        embed.setDescription(`Below contains a small list of useful link and information. Most informtion regarding my services will be stored on my [website](${CONFIG.PREFERENCES.WEB_URL}), and if you are looking for previews of releases or you wish to view my old releases, take a look at my [projects](https://c0r3.uk/projects.php) page.`)
        embed.addFields(
            { 
                name: "Links:", 
                value: `• [My Website](${CONFIG.PREFERENCES.WEB_URL})\n\n• [Available Services](https://c0r3.uk#services) *(Currently Unavailable)*\n\n• [My Projects](https://c0r3.uk/projects.php)\n\n• [My Timeline](https://c0r3.uk/timeline.php)`
            }
        )
        .setFooter(`${message.guild.name} • Rules Message`)
        message.channel.send(embed)
    }
}