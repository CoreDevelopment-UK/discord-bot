const CONFIG = require('../resources/config.json');
const Discord = require('discord.js');

module.exports = {
    name: 'release',
    description: "Creates a release post in the releases channel. (Server Owner Only)",
    async execute(message) {
        const channel = client.channels.cache.find(channel => channel.id === CONFIG.CHANNELS.RELEASES);
        let filter = m => m.author.id === message.author.id;
        
        // Embed Presets
        function EmbedMessage(msg) {
            let embed = new Discord.MessageEmbed()
            .setTitle(msg)
            .setColor(CONFIG.UI.COL_PRIMARY)
            .setTimestamp()
            .setFooter(`${message.guild.name} • Release Creation`, CONFIG.UI.LOGO)
            return embed
        }

        function ReleaseEmbed(category, title, desc, link, img) {
            let embed = new Discord.MessageEmbed()
            .setColor(CONFIG.UI.COL_PRIMARY)
            .setTitle(`New ${category} Release: ${title}`)
            .setURL(link)
            .setAuthor(`New Server Release • Category: ${category}`, CONFIG.UI.LOGO, CONFIG.PREFERENCES.WEB_URL)
            .setDescription(desc)
            .setImage(img)
            .setTimestamp()
            .setFooter(`${message.guild.name} • Release Creation`)
            return embed
        }

        // Setup Release Vars
        var releaseCategory = "";
        var releaseTitle = "";
        var releaseDescription = "";
        var releaseLink = "";
        var releaseImage = "";

        // Main Command
        // 1 - Ask for the Category
        message.channel.send(EmbedMessage("What is the category of your release?")).then(msg => {
            message.channel.awaitMessages(filter, {
                max: 1,
                time: 60000,
                errors: ['time']
            }).then(message => {
                message = message.first()
                message.delete();
                if (message.content.toLowerCase() === "cancel") {
                    msg.delete();
                    console.log(`[${message.guild.name}] release command cancelled.`)
                    return;
                }
                releaseCategory = message.content

                // 2 - Ask for the Title
                msg.edit(EmbedMessage("What is the title of your release?")).then(msg => {
                    message.channel.awaitMessages(filter, {
                        max: 1,
                        time: 60000,
                        errors: ['time']
                    }).then(message => {
                        message = message.first()
                        message.delete();
                        if (message.content.toLowerCase() === "cancel") {
                            msg.delete();
                            console.log(`[${message.guild.name}] release command cancelled.`)
                            return;
                        }
                        releaseTitle = message.content

                        // 3 - Ask for the Description
                        msg.edit(EmbedMessage("What is the description of your release?")).then(msg => {
                            message.channel.awaitMessages(filter, {
                                max: 1,
                                time: 120000,
                                errors: ['time']
                            }).then(message => {
                                message = message.first()
                                message.delete();
                                if (message.content.toLowerCase() === "cancel") {
                                    msg.delete();
                                    console.log(`[${message.guild.name}] release command cancelled.`)
                                    return;
                                } else if (message.content.toLowerCase() === "none") {
                                    message.content === ""
                                } else {
                                    releaseDescription = message.content
                                }

                                // 4 - Ask for the Link
                                msg.edit(EmbedMessage("What is the link of your release?")).then(msg => {
                                    message.channel.awaitMessages(filter, {
                                        max: 1,
                                        time: 60000,
                                        errors: ['time']
                                    }).then(message => {
                                        message = message.first()
                                        message.delete();
                                        if (message.content.toLowerCase() === "cancel") {
                                            msg.delete();
                                            console.log(`[${message.guild.name}] release command cancelled.`)
                                            return;
                                        }
                                        releaseLink = message.content
                                        
                                        // 5 - Ask for the Image Link
                                        msg.edit(EmbedMessage("What is the link of the preview image of your release?")).then(msg1 => {
                                            message.channel.awaitMessages(filter, {
                                                max: 1,
                                                time: 60000,
                                                errors: ['time']
                                            }).then(message => {
                                                message = message.first()
                                                message.delete();
                                                if (message.content.toLowerCase() === "cancel") {
                                                    msg.delete();
                                                    console.log(`[${message.guild.name}] release command cancelled.`)
                                                    return;
                                                }
                                                releaseImage = message.content

                                                msg1.edit(ReleaseEmbed(releaseCategory, releaseTitle, releaseDescription, releaseLink, releaseImage))

                                                // 6 - Send A Preview Embed
                                                message.channel.send(EmbedMessage("Are the details above correct?")).then(msg => {
                                                    message.channel.awaitMessages(filter, {
                                                        max: 1,
                                                        time: 30000,
                                                        errors: ['time']
                                                    }).then(message => {
                                                        message = message.first()
                                                        message.delete();

                                                        if (message.content.toLowerCase() === "cancel") {
                                                            msg.delete();
                                                            msg1.delete();
                                                            console.log(`[${message.guild.name}] release command cancelled.`)
                                                            return;
                                                        } else if (message.content.toLowerCase() === "yes") {
                                                            channel.send(ReleaseEmbed(releaseCategory, releaseTitle, releaseDescription, releaseLink, releaseImage))
                                                            msg1.edit(EmbedMessage("Release Created."))
                                                            msg.delete();
                                                        } else {
                                                            msg1.edit(EmbedMessage("Release Cancelled."))
                                                            msg.delete();
                                                        };

                                                        msg1.delete({ timeout: 3000 })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    }
}