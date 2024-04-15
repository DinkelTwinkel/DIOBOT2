const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const kimoIDMaker = require('../patterns/kimoIDMaker');
const UserData = require('../models/userData');
const { kimoServerID } = require('../ids.json');
const Fire = require('../models/activeFires');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('vclimit')
    .setDescription('set the user limit of your camp fire.')
    .addIntegerOption(option =>
        option
            .setName('userlimit')
            .setDescription('limit, 0 means no limit')
            .setRequired(true)),

    async execute(interaction, client) {

        console.log (interaction.member.voice.channel.members.get('865147754358767627'));

        if (!interaction.member.voice.channel) return interaction.reply ({ content: 'You are not in a voice channel...', ephemeral: true });
        if (interaction.options.getInteger('userlimit') > 99) return interaction.reply({ content: 'only 0 - 99 valid. 0 is no cap.', ephemeral: true });

        const fire = await Fire.findOne({ channelId: interaction.member.voice.channel.id });

        if (!fire) return interaction.reply ({ content: 'This is not a fire channel...', ephemeral: true });
        //
        // Perform checks on whether user is in the channel and if they are the owner.

        if (interaction.member.voice.channel.members.get(fire.ownerId)) {
            if (fire.ownerId != interaction.member.id) return interaction.reply ({ content: `The owner of this fire is ${interaction.member.voice.channel.members.get(fire.ownerId)}, you cannot modify the fire until they have left.`, ephemeral: true });
        }

        interaction.member.voice.channel.setUserLimit(interaction.options.getInteger('userlimit'));

        // const KimoServer = await client.guilds.fetch(kimoServerID);
        // const eventChannel = KimoServer.channels.cache.get('1203390855722041354');
        // await eventChannel.setUserLimit(interaction.options.getInteger('userlimit'));

        interaction.reply({ content: `Channel Limit updated`, ephemeral: true });

    },
  };

