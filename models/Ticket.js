const { DataTypes, Model } = require('sequelize')

module.exports = class Ticket extends Model {
    static init(sequelize) {
        return super.init({
            ticketId: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            authorId: {
                type: DataTypes.STRING
            },
            channelId: {
                type: DataTypes.STRING
            },
            guildId: {
                type: DataTypes.STRING
            },
            resolved: {
                type: DataTypes.BOOLEAN
            },
            ticketCategory: {
                type: DataTypes.STRING
            },
            closedMessageId: {
                type: DataTypes.STRING
            },
            modToolMessageId: {
                type: DataTypes.STRING
            }
        }, {
            tableName: 'Tickets',
            sequelize
        })
    }
}