const { Events, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const Stock = require("../models/stock");
const Inventory = require("../models/inventory");
const getAllMessagesInChannel = require("./getAllMessagesInChannel");
const UserData = require("../models/userData");
const UserStats = require("../models/userStatistics");

const stockFluctuationTimer = 720;

module.exports = async (client) => {

  // stockName: { type: String, required: true, unique: true },
	// currentValue: { type: Number, required: true },
	// passiveFluctuation: { type: Number, required: true },
	// onePercentChanceFluctuation: { type: Number, required: true },
	// rising: { type: Boolean, required: true, default: true },
	// currentShift: { type: Number, required: true, default: 0 },

  // const newStock = new Stock ({
  //   stockName: 'DrawingFeet',
  //   currentValue: 5,
  //   passiveFluctuation: 1,
  //   onePercentChanceFluctuation: 10,
  //   rising: true,
  //   currentShift: 0,
  // })

  // newStock.save();

  client.on(Events.MessageCreate, async (message) => {

    console.log ('new message detected');

    if (message.member.user.bot) return;

    if (message.channel.id != '1206930735315943444') return;

    createStockMarket(client);

  });

  console.log ('StockMarket Module Engaged');

  // shiftStock (client);

  shiftStock(client);

  setInterval(async () => {

    shiftStock(client);
    const allInventories = await Inventory.find({});

    allInventories.forEach(async checkStock => {

      const findStock = await Stock.findOne({stockName: checkStock.itemName });
      if (!findStock) {
        // console.log (checkStock.itemName + ' NOT FOUND');
        checkStock.quantity = 0;
        checkStock.totalSpent = 0;
        await checkStock.save();
      }
      
    });


  }, 1000 * 10 );



  client.on(Events.InteractionCreate, async (interaction) => {
    
    kimoServer = await client.guilds.fetch('1171795345223716964');
    const refChannel1 = kimoServer.channels.cache.get('1171804720906641428');

    if (interaction.isButton === false) return;

    const stocks = await Stock.find();

    stocks.forEach ( async stock => {

      const oldPrice = stock.currentValue;

      if (interaction.customId === 'buy' + stock.stockName) {

        await interaction.deferUpdate();

        let checkExistingInventory = await Inventory.findOne({
          ownerId: interaction.member.user.id,
          itemName: stock.stockName,
        })

        // check quantity owned and if negative, use short buying logic. 

        // if (checkExistingInventory.quantity < 0) {
        //   // short buy.

        //   const checkPouch = await UserData.findOne ({userID: interaction.member.user.id});
        //   const cost = stock.currentValue;
        //   checkPouch.money -= cost;
        //   await checkPouch.save();

        //   // stock profit tracker
        //   const userStat = await UserStats.findOne({userID: interaction.member.user.id});
        //   userStat.stockProfit -= cost;
        //   await userStat.save();

        //   checkExistingInventory.quantity += 1;
        //   checkExistingInventory.totalSpent += cost;

        //   interaction.reply({content: `You bought ${stock.stockName} stock for ${stock.currentValue}, you currently have ${checkExistingInventory.quantity} shares.`, ephemeral: true});
  
        //   stock.totalShares -= 1;
        //   const ShareHoldingFactor = checkExistingInventory.quantity/stock.totalShares;
  
        //   stock.currentValue += Math.ceil(-stock.passiveFluctuation * ShareHoldingFactor);
        //   const change = stock.currentValue - oldPrice;
        //   stock.currentShift = Math.round((change / oldPrice) * 1000) / 1000;
        //   stock.fakeRising = true;
        //   refChannel1.send (`**${stock.stockName} Increased from to ${oldPrice} to ${stock.currentValue}**`);
        //   await stock.save();
        //   createStockMarket(client);
  
        //   await checkExistingInventory.save();
  
        //   await stock.save();
  
        //   return;
        // }


        //interaction.deferUpdate();
        // buy click deteced.

        const cost = stock.currentValue;
        const checkPouch = await UserData.findOne ({userID: interaction.member.user.id});
        if (checkPouch.money < cost) return interaction.followUp ({content: `You do not have enough shells! You need ${cost} shells to perform this action!`, ephemeral: true });
        checkPouch.money -= cost;
        await checkPouch.save();


        // stock profit tracker
        const userStat = await UserStats.findOne({userID: interaction.member.user.id});
        userStat.stockProfit -= cost;
        await userStat.save();

        // successfully bought.



        if (!checkExistingInventory) {
          // no existing inventory item, creating new
          checkExistingInventory = new Inventory ({
            ownerId: interaction.member.user.id,
            itemName: stock.stockName,
            quantity: 0,
          })
        }
        
        checkExistingInventory.quantity += 1;
        checkExistingInventory.totalSpent += cost;

        if (interaction.channel.id === '1206930735315943444') {
          interaction.followUp({content: `You bought ${stock.stockName} stock for ${stock.currentValue}, you currently have ${checkExistingInventory.quantity} shares.`, ephemeral: true});
          // interaction.deferUpdate();
        }
        else {
          interaction.followUp({content: `You bought ${stock.stockName} stock for ${stock.currentValue}, you currently have ${checkExistingInventory.quantity} shares.`, ephemeral: true});
        }

        //refChannel1.send (`${interaction.member.displayName} bought ${stock.stockName} stock for ${stock.currentValue} sea shells, they currently have ${checkExistingInventory.quantity} shares.`);
        //refChannel1.send (`Someone bought ${stock.stockName}!`);
        

        const ShareHoldingFactor = checkExistingInventory.quantity/stock.totalShares;


        if (Math.ceil(stock.passiveFluctuation * ShareHoldingFactor) > 0) {
          stock.currentValue += Math.ceil(stock.passiveFluctuation * ShareHoldingFactor);
          const change = stock.currentValue - oldPrice;
          stock.currentShift = Math.round((change / oldPrice) * 1000) / 1000;
          stock.fakeRising = true;
          refChannel1.send (colourBlock (`${stock.stockName} Increased from to ${oldPrice} to ${stock.currentValue}`,stock.colourCode));
          if (Math.random() < 0.1) {
            stock.rising = true;
          }
          await stock.save();
          createStockMarket(client);
        }

        await checkExistingInventory.save();

        stock.totalShares += 1;
        await stock.save();

      }
      else if (interaction.customId === 'sell' + stock.stockName) {
        await interaction.deferUpdate();

                // check quantity owned and if negative, use short buying logic. 
                
        const oldPrice = stock.currentValue;

        let checkExistingInventory = await Inventory.findOne({
          ownerId: interaction.member.user.id,
          itemName: stock.stockName,
        })

        // if (checkExistingInventory.quantity <= 0) {
        //   // short sell.

        //   const checkPouch = await UserData.findOne ({userID: interaction.member.user.id});
        //   const cost = stock.currentValue;
        //   checkPouch.money += cost;
        //   await checkPouch.save();

        //   // stock profit tracker
        //   const userStat = await UserStats.findOne({userID: interaction.member.user.id});
        //   userStat.stockProfit += cost;
        //   await userStat.save();

        //   checkExistingInventory.quantity -= 1;
        //   checkExistingInventory.totalSpent -= cost;
        //   checkExistingInventory.shortChargeTimer = new Date.getTime() + (1000 * 60 * 60);

        //   interaction.reply({content: `You sold ${stock.stockName} stock for ${stock.currentValue}, you currently have ${checkExistingInventory.quantity} shares.`, ephemeral: true});
  
        //   const ShareHoldingFactor = checkExistingInventory.quantity/stock.totalShares;
  
        //   if (ShareHoldingFactor != 1 && ShareHoldingFactor != 0) {
        //     stock.currentValue += Math.ceil(stock.passiveFluctuation * ShareHoldingFactor);
        //     const change = stock.currentValue - oldPrice;
        //     stock.currentShift = Math.round((change / oldPrice) * 1000) / 1000;
        //     stock.fakeRising = false;
        //     refChannel1.send (`**${stock.stockName} Decreased from to ${oldPrice} to ${stock.currentValue}**`);
        //     await stock.save();
        //     createStockMarket(client);
        //   }
  
        //   await checkExistingInventory.save();
  
        //   stock.totalShares -= 1;
        //   await stock.save();
  
        //   return;
        // }


        if (!checkExistingInventory || checkExistingInventory.quantity === 0) return interaction.followUp({content: 'You must buy the stock first!', ephemeral: true });
        
        // user posesses stock

        const ShareHoldingFactor = checkExistingInventory.quantity/stock.totalShares;

        const tax = Math.ceil(stock.passiveFluctuation * ShareHoldingFactor);

        checkExistingInventory.quantity -= 1;
        checkExistingInventory.totalSpent -= stock.currentValue-tax;
        stock.totalShares -= 1;
        await checkExistingInventory.save();

        const checkPouch = await UserData.findOne ({userID: interaction.member.id});
        checkPouch.money += stock.currentValue-tax;
        await checkPouch.save();

        // stock profit tracker
        const userStat = await UserStats.findOne({userID: interaction.member.user.id});
        userStat.stockProfit += stock.currentValue-tax;
        await userStat.save();

        if (interaction.channel.id === '1206930735315943444') {
          interaction.followUp({content: `You sold ${stock.stockName} Stock for ${stock.currentValue} shells and paid ${tax} shell in transaction fee, you currently have ${checkExistingInventory.quantity} shares.`, ephemeral: true});
          //interaction.deferUpdate();
        }
        else {
          interaction.followUp({content: `You sold ${stock.stockName} Stock for ${stock.currentValue} shells and paid ${tax} shell in transaction fee, you currently have ${checkExistingInventory.quantity} shares.`, ephemeral: true});
        }

        // const jianDaoWallet = await UserData.findOne({ userID: '1202895682630066216' });
        // jianDaoWallet.money += 1;
        // await jianDaoWallet.save();

        //refChannel1.send (`${interaction.member.displayName} sold ${stock.stockName} Stock for ${stock.currentValue} sea shells and paid 1 shell in transaction fee, they currently have ${checkExistingInventory.quantity} shares.`);
        //refChannel1.send (`Someone sold ${stock.stockName}!`);



        if (Math.ceil(stock.passiveFluctuation * ShareHoldingFactor) > 0) {
          stock.currentValue -= Math.ceil(stock.passiveFluctuation * ShareHoldingFactor);
          const change = stock.currentValue - oldPrice;
          stock.currentShift = Math.round((change / oldPrice) * 1000) / 1000;
          if (Math.random() < 0.1) {
            stock.rising = false;
          }
          stock.fakeRising = false;
          refChannel1.send (colourBlock (`${stock.stockName} Decreased from to ${oldPrice} to ${stock.currentValue}`, stock.colourCode));
          //'**' + stock.stockName + ` Increased from ${oldPrice} to ${stock.currentValue}**
          await stock.save();
          createStockMarket(client);

        }
        

      }

    })
  
  });

};

function colourBlock (content, code) {
  if (code === 0) {
    const newString =  '```' + `ansi\n[1;2m[1;35m${content}[0m[0m\n` + '```';
    return newString;
  }
  else if (code === 1) {
    const newString =  '```' + 'md\n> ' + content + '```';
    return newString;
  }
  else if (code === 2) {
    const newString =  '```' + 'yaml\n' + content + '```';
    return newString;
  }
  else if (code === 3) {
    const newString =  '```' + 'asciidoc\n.' + content + '```';
    return newString;
  }
  else if (code === 4) {
    const newString =  '```' + `ansi\n[2;33m[1;33m${content}[0m[2;33m[0m\n` + '```';
    return newString;
  }
}

async function shiftStock (client) {

  let stocks = await Stock.find();
  stocks.forEach (async stock => {

    const now = new Date().getTime();

    if (now > stock.nextUpdateTime) {

    const oldPrice = stock.currentValue;

    if (0.1 > Math.random()) {
      stock.rising = !stock.rising;
    }
    
    const rising = stock.rising;
    
    let change = stock.passiveFluctuation;

    if (0.01 > Math.random() || (0.05 > Math.random() && rising === false)) {
      change += stock.onePercentChanceFluctuation;
      //if (stock.onePercentChanceFluctuation < 0) stock.rising = false;
    }

    // if (rising === false) {
    //   const stockKiller = Math.ceil(stock.passiveFluctuation * Math.random());
    //   change += stockKiller;
    // }

    change = Math.ceil(change * Math.random());

    stock.currentShift = Math.round((change / stock.currentValue) * 1000) / 1000;
    stock.fakeRising = true;

    if (rising === true) {
      stock.currentValue += change;
      await client.guilds.cache.get('1171795345223716964').channels.cache.get('1171804720906641428').send(colourBlock ('' + stock.stockName + ` Increased from ${oldPrice} to ${stock.currentValue}`, stock.colourCode));
      if (stock.currentValue < 1) stock.currentValue = 1;
    }
    else {
      stock.fakeRising = false;
      stock.currentValue -= change;
      await client.guilds.cache.get('1171795345223716964').channels.cache.get('1171804720906641428').send(colourBlock ('' + stock.stockName + ` Decreased from ${oldPrice} to ${stock.currentValue}`, stock.colourCode));
      if (stock.currentValue < 1) {
        //stock death
        console.log (stock.stockName + ' has died, generating new stock');

        await Inventory.deleteMany({itemName: stock.name});
        await client.guilds.cache.get('1171795345223716964').channels.cache.get('1171804720906641428').send('# ' + stock.stockName + ' has gone bankrupt! new stock available.');

        // replace stock with new stock. 

        // pick random stock name.
        // stock = ({
        //   stockName: await getStockName(client),
        //   currentValue: Math.ceil(Math.random() * 100),
        //   passiveFluctuation: Math.ceil(Math.random() * 100),
        //   onePercentChanceFluctuation: Math.ceil(Math.random() * 1000),
        // })

        stock.stockName = await getStockName(client);

        let stockCheckName = await Stock.findOne({ stockName: stock.stockName })

        while (stockCheckName) {
          stock.stockName = await getStockName(client);
          stockCheckName = await Stock.findOne({ stockName: stock.stockName });
          console.log ('whileLoop');
        }

        stock.currentValue = Math.ceil(Math.random() * 100 + 5);
        stock.passiveFluctuation = Math.ceil(Math.random() * 30);
        stock.onePercentChanceFluctuation = Math.ceil(Math.random() * 100);
        stock.currentShift = 0;
        stock.rising = true;
        stock.fakeRising = true;
        stock.totalShares = Math.floor (Math.random() * 100) + 5;

        //if (Math.random() < 0.2) stock.onePercentChanceFluctuation = stock.onePercentChanceFluctuation * -1;

      }
    }

    

    stock.nextUpdateTime = now + (20 * 1000 * stock.totalShares * Math.random()) ;
    await stock.save();

    setTimeout(() => {
      createStockMarket(client);
    }, 1000 * 5);

    return;

  }

  })
}

async function getStockName(client) {

  const backRooms = await client.guilds.cache.get('1103779676406693981');
  const cookieChannel = await backRooms.channels.cache.get('1173936658169745478');

  const messages = await getAllMessagesInChannel(cookieChannel);

  const randomIndex = Math.floor(Math.random() * messages.length);

  const randomMessage = Array.from(messages)[randomIndex];

  return randomMessage.content;

}

async function createStockMarket(client) {

        kimoServer = await client.guilds.fetch('1193663232041304134');

        const refChannel1 = kimoServer.channels.cache.get('1206930735315943444');
        const messages = await refChannel1.messages.fetch();
        messages.forEach(message => {
          if (message.content === '**KIMO STOCK MARKET**') {
            try {
              message.delete();
            }
            catch (err) {
              console.log (err);
            }
          }
        });
        // generate button row.

        const stocks = await Stock.find();
      
        //const playerInventory = await Inventory.find({ ownerId: interaction.member.user.id });
  
        const actionRowArray = [];
  
        stocks.forEach(async stock => {
  
          // console.log ('creating stock' + stock.stockName);
  
          const stockNameButton = new ButtonBuilder ()
            .setCustomId('Fake' + stock.stockName)
            .setDisabled(true)
            .setStyle(ButtonStyle.Primary)
            .setLabel(stock.stockName);
  
          const stockValueButton = new ButtonBuilder ()
            .setCustomId('Fake' + stock.stockName + stock.currentValue)
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary)
            .setLabel(`Share Price: ${stock.currentValue} Shells`);
  
          const stockBuyButton = new ButtonBuilder ()
            .setCustomId('buy' + stock.stockName)
            .setDisabled(false)
            .setStyle(ButtonStyle.Secondary)
            .setLabel('BUY');
  
          let currentlyHave = 0;
  
          // if (playerInventory) {
          //   const itemCheck = playerInventory.find(playerInventory => playerInventory.itemName === stock.stockName)
          //   if (itemCheck) {
          //     currentlyHave = itemCheck.quantity;
          //   }
          // }
  
          const stockSellButton = new ButtonBuilder ()
            .setCustomId('sell' + stock.stockName)
            .setDisabled(false)
            .setStyle(ButtonStyle.Secondary)
            .setLabel(`SELL`);
//           .setLabel(`SELL: [${currentlyHave}]`);
  
          const stockRisingButton = new ButtonBuilder ()
            .setCustomId('Fake' + stock.stockName + 'Rising')
            .setDisabled(true)
            .setStyle(ButtonStyle.Success)
            .setLabel(`+${stock.currentShift}%↗`);
  
  
          if (stock.fakeRising === false) {
            stockRisingButton.setLabel(`${stock.currentShift}%↘`)
            stockRisingButton.setStyle(ButtonStyle.Danger);
          }

          // if (buy === 0) {
          //   // fake shift down
          //   stockRisingButton.setLabel(`${fakeShift}%↘`)
          //   stockRisingButton.setStyle(ButtonStyle.Danger);
          // }

          // if (buy === 1) {
          //   // fake shift up
          //   stockRisingButton.setLabel(`${fakeShift}%↗`)
          //   stockRisingButton.setStyle(ButtonStyle.Danger);
          // }
          
          const newActionRow = new ActionRowBuilder ()
          .addComponents( stockNameButton, stockValueButton, stockBuyButton, stockSellButton, stockRisingButton);
  
          actionRowArray.push(newActionRow);
  
        });

        const embed = new EmbedBuilder()
        .setDescription("```\nEvery stock has a total number of shares currently on the market.\nThe more shares you hold, the bigger impact your buy/sell has on the price.\nWhen you sell, there is a transaction fee. This is just a fee to negate the price change from you buying then selling. So buy and sell repeatedly result in a net 0 gain. This fee is based on (Your shares/total owned shares)\n\nStock prices go up/down when people sell/buy.\nStock prices also go up/down at random intervals just like before. Every stock has their own unique characteristics. Some move faster, some move slower. Some are stable but may have massive dips. It's all procedural.\nExcept all rises and decreases are hidden so you can't tell whether it's natural or a player doing it.\n\nThe fewer shares owned on a stock the faster it changes. The more people owning a stock the less it changes.\nIf you sell a stock after someone bought into it, you will make a profit. \n\nGood luck & don't invest more than you're willing to lose.\n```\nuse **/stocks** to see your current portfolio & profits. \nuse **/stockleader** to see current profit leaders.");

        refChannel1.send ({ content: '**KIMO STOCK MARKET**', components: actionRowArray , ephemeral: false, embeds: [embed] })

}