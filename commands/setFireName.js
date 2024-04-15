const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const kimoIDMaker = require('../patterns/kimoIDMaker');
const UserData = require('../models/userData');
const { kimoServerID } = require('../ids.json');
const Fire = require('../models/activeFires');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('vcname')
    .setDescription('set the user limit of your camp fire.')
    .addStringOption(option =>
        option
            .setName('name')
            .setDescription('change name of vc')
            .setRequired(true)),

    async execute(interaction, client) {

        console.log (interaction.member.voice.channel.members.get('865147754358767627'));

        if (!interaction.member.voice.channel) return interaction.reply ({ content: 'You are not in a voice channel...', ephemeral: true });

        const fire = await Fire.findOne({ channelId: interaction.member.voice.channel.id });

        if (!fire) return interaction.reply ({ content: 'This is not a fire channel...', ephemeral: true });
        //
        // Perform checks on whether user is in the channel and if they are the owner.

        if (interaction.member.voice.channel.members.get(fire.ownerId)) {
            if (fire.ownerId != interaction.member.id) return interaction.reply ({ content: `The owner of this fire is ${interaction.member.voice.channel.members.get(fire.ownerId)}, you cannot modify the fire until they have left.`, ephemeral: true });
        }

        fire.defaultNaming = false;
        await fire.save();

        interaction.member.voice.channel.setName('🔥 ' + interaction.options.getString('name'));

        await interaction.reply({ content: `Channel Name updated`, ephemeral: true });

    },
  };

