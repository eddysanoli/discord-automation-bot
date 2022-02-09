// Dependencies
const DotEnv = require("dotenv").config({path: `${__dirname}/.env`});
const cron = require("cron");
const aws = require(__dirname + "/functions-aws");

// Discord client instance
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,                   // Access servers
    Intents.FLAGS.GUILD_MESSAGES,           // Send message to servers
    Intents.FLAGS.GUILD_MESSAGE_TYPING, 
    Intents.FLAGS.DIRECT_MESSAGES           // Direct messages to users
]});

// =================================================================
// SERVER SELECTORS
// =================================================================

let devServer
let devServer_general
let nubuSquad
let nubuSquad_nubs

// =================================================================
// IDs
// =================================================================

// Server IDs
const devServerID = "931035832909963304";

// User IDs
const ricardite = "367146292075560960";
const almendro = "369643860986560512";
const eddysanoli = "467506601956343811";
const felipe = "729166267801534504";
const bot = "930983546816974899";
const whitelist = [ricardite, almendro, eddysanoli, felipe];
const blacklist = [bot];

// =================================================================
// REGEX
// =================================================================

// IPV4 Regex
const ipv4_regex = /((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}$/gm;

// IPV6 Regex
const ipv6_regex = /(?:(?:[0-9A-Fa-f]{1,4}))*(?::(?:(?:[0-9A-Fa-f]{1,4}))*)+:(?:(?:[0-9A-Fa-f]{1,4}))$/gm;

// Command regex (!command param)
let cmd_regex = /!.+ (.+)$/gm;

// =================================================================
// EVENTS
// NOTE: Discord.js event based. Events are accessed using "client.on()"
// =================================================================

// Event: Logs when bot has successfully logged in
client.on("ready", function () {
    console.log(`Logged in as ${client.user.tag}!`);

    // SERVER SELECTORS =======================

    // Dev Server
    // - #general
    devServer = client.guilds.cache.get(devServerID);
    devServer_general = devServer.channels.cache.get("931035832909963307");

    // Nubu Squad
    // - #nubs
    nubuSquad = client.guilds.cache.get("369642385866752000");
    nubuSquad_nubs = nubuSquad.channels.cache.get("369642385866752003");

    // ========================================

    // Welcome message
    devServer_general.send("Hello, I'm back up baby!");

});

// Event: Scheduled events
client.once("ready", () => {
    
    // Cron guide:  
    // ┌────────────── second (optional)
    // │ ┌──────────── minute
    // │ │ ┌────────── hour
    // │ │ │ ┌──────── day of month
    // │ │ │ │ ┌────── month
    // │ │ │ │ │ ┌──── day of week
    // │ │ │ │ │ │
    // │ │ │ │ │ │
    // * * * * * *

    // Scheduled function: Minecraft Wednesday (Tuesday - 5 PM Guatemala / 11 PM US)
    let minecraftWednesday = new cron.CronJob('00 00 17 * * 2', () => {
        nubuSquad_nubs.send("I'm proud to announce that today is Minecraft Wednesday my dudes! The server will be started shortly.");
        aws.startServer(nubuSquad_nubs);
    });

    // Scheduled function: Feliz Jueves (Thursday - 12 PM Guatemala / 6 PM US)
    let felizJueves = new cron.CronJob('00 00 12 * * 4', () => {
        nubuSquad_nubs.send("Feliz jueves!");
    });

    // Enable scheduled events
    minecraftWednesday.start();
    felizJueves.start();
            
});

// Event: Message
client.on("messageCreate", async (msg) => {

    // Extract metadata from message
    let msgServerID = msg.guildId;
    let msgChannelID = msg.channelId;
    let msgUserID = msg.author.id;
    let msgUsername = msg.author.username;

    // Select server and channel of current message
    let msgServer = client.guilds.cache.get(msgServerID);
    let msgChannel = msgServer.channels.cache.get(msgChannelID);

    // Command (!ec2-status): 
    // Check AWS instance status if server is "Dev Server"
    if (msg.content === "!ec2-status") {

        // Retrieve instance statuses
        let instancesInfo = await aws.getEC2Info();
        console.log("Instance Info: ", instancesInfo);

        // Base instance info text
        let statusText = "Instance Info: \n";

        // Add a new line of text for each instance
        instancesInfo.forEach(instance => {
            statusText += `${instance.name} (${instance.id}): ${instance.status}\n`;
        });

        // Reply to the user
        msg.reply(statusText);
    }


    // Command (!start-server): 
    // Start the gaming server
    if (whitelist.includes(msgUserID) && msg.content === "!start-server") {
        aws.startServer(msgChannel);
    }

    // Command (!stop-server): 
    // Stop the gaming server
    if (whitelist.includes(msgUserID) && msg.content === "!stop-server") {
        aws.stopServer(msg);
    }

    // Command (!stop-instance):
    // Stop the EC2 instance
    if (whitelist.includes(msgUserID) && msg.content === "!stop-instance") {
        aws.stopEC2Instance(msg);
    }

    // Command (!isitWednesday):
    // Is it wednesday my dudes?
    if (msg.content === "!isitWednesday") {
        
        // Get current day of the week
        let now = new Date();
        let day = now.getDay();

        // Print the corresponding response
        if (day === 3)      { msg.reply("It is wednesday my dudes!"); }
        else if (day === 2) { msg.reply("It is minecraft wednesday my dudes!"); }
        else                { msg.reply("It is not wednesday my dudes :("); }
    }

    // Command (!add-ipv6):
    // Add IPV6 address to security group
    if (whitelist.includes(msgUserID) && !blacklist.includes(msgUserID) && msg.content.includes("!add-ipv6")) {

        // Add an IPV6 address only if one is detected in the command
        if (ipv6_regex.test(msg.content)){
            newIPV6 = msg.content.match(ipv6_regex)[0];
            aws.addIPV6(msg, newIPV6, "Automated Addition");
        }
        else {
            msg.reply("Unable to add IPV6 address to security group.");
        }

    }

    // Command (!add-ipv4):
    // Add IPV4 address to security group
    if (whitelist.includes(msgUserID) && !blacklist.includes(msgUserID) && msg.content.includes("!add-ipv4")) {

        // Add an IPV4 only if one is detected in the command
        if (ipv4_regex.test(msg.content)){
            newIPV4 = msg.content.match(ipv4_regex)[0];
            aws.addIPV4(msg, newIPV4, "Automated Addition");
        }
        else {
            msg.reply("Unable to add IPV4 address to security group.");
        }
    }

    // Command (!change-level):
    // Change the level used by the minecraft server
    if (whitelist.includes(msgUserID) && !blacklist.includes(msgUserID) && msg.content.includes("!change-level")) {

        // Check if the command is correctly structured
        if (cmd_regex.test(msg.content)){

            // Create an executable regex and evaluate it
            let regex = new RegExp(cmd_regex);
            let levelName = regex.exec(msg.content)[1];

            // Send the "sed" commands to change the level name
            aws.changeLevelName(msg, levelName);
        }
        else {
            msg.reply("Unable to change the current minecraft level.");
        }
    }

    // Command (!server-status):
    // Check the status of the minecraft server
    if (msg.content === "!server-status") {

        const minecraftServerUp = await aws.getServerStatus();
        console.log(minecraftServerUp);

        // Reply with the status based on the value of "minecraftServerUp"
        if (minecraftServerUp){
            msg.reply(`Minecraft Server is Up 😄`);
        }
        else {
            msg.reply("Minecraft Server is Down 😞"); 
        }

        console.log("Retrieve Server Status: Success");
    }

    // Command (!test):
    // For testing new functionality
    if (whitelist.includes(msgUserID) && !blacklist.includes(msgUserID) && msg.content === "!test") {
        msg.reply(`Fuck you ${msgUsername}!`);
        console.log("Test: Success");
    }

    // Command (!help):
    // Get all the commands available
    if (!blacklist.includes(msgUserID) && msg.content === "!help") {
        msg.reply(`Commands available:
        - !start-server: Start the EC2 instance and the minecraft server
        - !stop-server: Stop the minecraft server
        - !stop-instance: Turn off the EC2 instance
        - !ec2-status: See status of each EC2 instance on AWS
        - !isitWednesday: Is it wednesday my dudes?
        - !add-ipv4 IP: Add access to specific IPV4 address
        - !add-ipv6 IP: Add access to specific IPV6 address
        - !test: Test new functionality or be cursed at
        - !change-level: Change current level being loaded by the minecraft server
        `);
    }

});


// =================================================================
// DISCORD LOGIN
// =================================================================

// Login to Discord with bot's token
// (Bot Link: https://discord.com/api/oauth2/authorize?client_id=930983546816974899&permissions=534727097920&scope=bot)
client.login(process.env.TOKEN);

