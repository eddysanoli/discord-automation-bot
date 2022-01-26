// Dependencies
const DotEnv = require("dotenv").config({path: `${__dirname}/.env`});
const cron = require("cron");
const AWS = require('aws-sdk');
const { readFileSync } = require('fs');

// AWS Setup
// Set the AWS region 
AWS.config.update({region: 'us-east-2'});

// Create EC2 service object
var ec2 = new AWS.EC2();

// Discord client instance
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,                   // Access servers
    Intents.FLAGS.GUILD_MESSAGES,           // Send message to servers
    Intents.FLAGS.GUILD_MESSAGE_TYPING, 
    Intents.FLAGS.DIRECT_MESSAGES           // Direct messages to users
]});

// Instance status object
let instanceStatuses = {};

// Initial minecraft server status
let minecraftServerUp = true;

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

// Gaming server EC2 instance ID
const gamingEC2ID = "i-0c794562f3be7c6f8";

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
        nubuSquad_nubs.send("I'm proud to announce that today is Minecraft Wednesday my dudes! The server will be start shortly.");
        startServer();
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
        let instancesInfo = await getEC2Info();
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
        startServer(msgChannel);
    }

    // Command (!stop-server): 
    // Stop the gaming server
    if (whitelist.includes(msgUserID) && msg.content === "!stop-server") {
        stopServer(msg);
    }

    // Command (!stop-instance):
    // Stop the EC2 instance
    if (whitelist.includes(msgUserID) && msg.content === "!stop-instance") {
        stopEC2Instance(msg);
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
            addIPV6(msg, newIPV6, "Automated Addition");
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
            addIPV4(msg, newIPV4, "Automated Addition");
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
            changeLevelName(msg, levelName);
        }
        else {
            msg.reply("Unable to change the current minecraft level.");
        }
    }

    // Command (!server-status):
    // Check the status of the minecraft server
    if (msg.content === "!server-status") {

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
        - !server-status: Is the server on?
        `);
    }

});

// =================================================================
// FUNCTIONS
// =================================================================

// Function: Change the current server level
async function changeLevelName(msg, levelName) {

    // Get the most recent instance info
    let instancesInfo = await getEC2Info();

    // Get info from gaming instance
    let gamingServer = {};
    for (const instance of instancesInfo) {
        if (instance.id === gamingEC2ID) gamingServer = instance;
    }

    // Only send the commands if the instance is ready
    if (gamingServer.status === "running") {

        // Commands for changing the level name
        const cmds = [
            "cd minecraft/server \n",
            `sed -i 's/level-name=.\\+$/level-name=${levelName}/g' server.properties\n`,
            "echo Done Adding Level Name\n"
        ];

        // String that signals the end of the SSH tunnel
        stopString = 'Done Adding Level Name';

        sendSSHCommands(cmds, gamingServer.ipv4, stopString, () => {
            msg.reply(`Level Name Successfully Changed to ${levelName}`);
        });

    }
    else {
        msg.reply("Instance is not running. Consider starting it first");
    }
}


// Function: Add IPV6 to security group ingress rules
function addIPV6(msg, ipv6, description) {

    // Parameters for the new ingress rule
    var params = {
        GroupId: "sg-0e5ca585f6b9aff24",
        IpPermissions: [{
            FromPort: 25565,
            IpProtocol: "tcp",
            Ipv6Ranges: [{
                CidrIpv6: `${ipv6}/128`,
                Description: description
            }],
            ToPort: 25565
        }]
    };

    // Add the ingress rule and return an error if it exists
    ec2.authorizeSecurityGroupIngress(params, (err, data) => {
        if (err) console.log(err, err.stack);
        else msg.reply(`Added IPV6 ${ipv6} Successfully`);      
    });
}


// Function: Add IPV4 to security group ingress rules
function addIPV4(msg, ipv4, description) {

    // Parameters for the new ingress rule
    var params = {
        GroupId: "sg-0e5ca585f6b9aff24",
        IpPermissions: [{
            FromPort: 25565,
            IpProtocol: "tcp",
            IpRanges: [{
                CidrIp: `${ipv4}/32`,
                Description: description
            }],
            ToPort: 25565
        }]
    };

    // Add the ingress rule and return an error if it exists
    ec2.authorizeSecurityGroupIngress(params, (err, data) => {
        if (err) console.log(err, err.stack);
        else msg.reply(`Added IPV4 '${ipv4}' Successfully`);      
    });
}


// Function: Get info from all EC2 instances
const getEC2Info = async () => {

    // Variable to store the status of all instances
    let instancesInfo = [];

    // Retrieve instance information without previous permission check (DryRun = False)
    const promise = await ec2.describeInstances({ DryRun: false }, (err, data) => {
        if (err) {
            console.log("Retrieve Instance Info: Error\n", err.stack);
            return null;
        }
        else {
            // Adds the info of each instance to "instanceInfo"
            data.Reservations.forEach(reservation => {
                let name = reservation.Instances[0].Tags[0].Value;
                let instanceID = reservation.Instances[0].InstanceId;
                let status = reservation.Instances[0].State.Name;
                let ipv4 = reservation.Instances[0].PublicIpAddress;
                let ipv6 = reservation.Instances[0].Ipv6Address;

                instancesInfo.push({
                    id: instanceID,
                    name: name,
                    status: status,
                    ipv4: ipv4,
                    ipv6: ipv6
                });
            });

            console.log("Retrieve Instance Info: Success");
        }

    }).promise();

    return instancesInfo;
}

// Function: Stop the minecraft server
async function stopServer(msg) {

    // Get the most recent instance info
    let instancesInfo = await getEC2Info();

    // Get info from gaming instance
    let gamingServer = {};
    for (const instance of instancesInfo) {
        if (instance.id === gamingEC2ID) gamingServer = instance;
    }

    // Gaming server is "running"
    if (gamingServer.status === "running") {

        // EC2 parameters:
        // - InstanceIds: List with the IDs of all the EC2 instances to start
        // - Dry Run: Checks if you have the availble permissions to do this
        let params = {
            InstanceIds: [gamingEC2ID],
            DryRun: false
        };

        // Only stop the server if its up
        if (minecraftServerUp) {

            // Commands for stopping the server
            const stopCmds = [
                "cd minecraft/server \n",
                "screen -D -RR mc_server \n",
                "/stop\n"
            ];

            // Check for this on stdout in order to signal the SSH tunnel to stop
            stopString = 'Saving chunks for level';

            // Send the commands through SSH
            sendSSHCommands(stopCmds, gamingServer.ipv4, stopString, () => {
                msg.reply("Minecraft Server Successfully Stopped");
                minecraftServerUp = false;
            });

        }
        else msg.reply("Server is Not Running.");
    }
    else {
        msg.reply("EC2 instance is stopped. Minecraft server is down as well.")
    }
}


// Function: Stop the EC2 instance
async function stopEC2Instance(msg) {

    // EC2 parameters:
    // - InstanceIds: List with the IDs of all the EC2 instances to start
    // - Dry Run: Checks if you have the availble permissions to do this
    let params = {
        InstanceIds: [gamingEC2ID],
        DryRun: false
    };

    // Get the most recent instance info
    let instancesInfo = await getEC2Info();

    // Get status from gaming instance
    let gamingServer = {};
    for (const instance of instancesInfo) {
        if (instance.id === gamingEC2ID) gamingServer = instance;
    }

    // Gaming server is "running"
    if (gamingServer.status === "running") {

        // Stop the instance if the minecraft server is not running
        if (!minecraftServerUp) {

            // Stop the EC2 instance
            ec2.stopInstances(params, function (err, data) {
                if (err) console.log(err, err.stack);
                else msg.reply("EC2 Instance Successfully Stopped");
            });
        }
        else msg.reply("Minecraft server is still running. Stop it before turning off the instance.");

    }

    // Gaming server is "stopped"
    else if (gamingServer.status === "stopped") {
        msg.reply("Gaming server is already stopped");
    }
}


// Function: Start the EC2 server
async function startServer(msgChannel) {

    // First discord message
    const msg = await msgChannel.send("Starting Server: ------- ");

    // Get the most recent instance info
    let instancesInfo = await getEC2Info();

    // Get status from gaming instance
    let gamingServer = {};
    for (const instance of instancesInfo) {
        if (instance.id === gamingEC2ID) gamingServer = instance;
    }

    // Instance is running
    if (gamingServer.status === "running") {

        // Check if minecraft server is up
        if (minecraftServerUp === true) {
            msg.edit(`Starting Server: Server Already Running.\nIPV4: ${gamingServer.ipv4}\nIPV6: ${gamingServer.ipv6}`);
        }
        else {
            msg.edit("Starting Server: Instance was already up. Starting server.")

            // Execute commands on the instance, then, signal
            // that the server is ready in Discord
            sendSSHCommands(startCmds, IPV4, () => {
                msg.edit(`Starting Server: Done!\nIPV4: ${IPV4}\nIPV6 ${IPV6}`);
                minecraftServerUp = true;
            });
        }
    }

    // Instance is stopped
    else if (gamingServer.status === "stopped") {

        // EC2 parameters:
        // - InstanceIds: List with the IDs of all the EC2 instances to start
        // - Dry Run: Checks if you have the availble permissions to do this
        let params = {
            InstanceIds: [gamingEC2ID],
            DryRun: true
        };

        // Start the EC2 instance
        ec2.startInstances(params, (err, data) => {

            // Check if the error returned is due to permissions (Dry run). 
            // Continue if this is the case
            if (err && err.code == "DryRunOperation") {

                // Disable the check for permissions
                params.DryRun = false;

                // Start the instance
                ec2.startInstances(params, (err, data) => {
                    if (err) console.log("Error", err); 
                    else if (data) {

                        // Waiting for status checks
                        console.log(`Starting Instance: ${data.StartingInstances[0].InstanceId}`);
                        msg.edit("Starting Server: Started Instance. Waiting for Status Checks.");

                        // Wait for the two status checks of the EC2 instance
                        ec2.waitFor('instanceStatusOk', params, async (err, data) => {
                            if (err) console.log(err, err.stack); 
                            else {

                                // Finished status checks
                                console.log(`Successfully Started Instance: ${data.InstanceStatuses[0].InstanceId}.`);
                                msg.edit("Starting Server: EC2 Instance Successfully Started");

                                // Update the instance info after startup
                                let instancesInfo = await getEC2Info();
                                let gamingServer = {};
                                for (const instance of instancesInfo) {
                                    if (instance.id === gamingEC2ID) gamingServer = instance;
                                }

                                // Updated instance info
                                console.log(`Updated Instance Info: Success.`);
                                msg.edit("Starting Server: Updated instance info. Loading server.");

                                // Starting shell commands to send through SSH:
                                // - Kill all screens
                                // - Move to the server folder
                                // - Start a new screen called "mc_server"
                                // - Start the jar file for the server
                                const startCmds = [
                                    "killall screen \n",
                                    "cd minecraft/server \n",
                                    "screen -S mc_server \n",
                                    "java -Xmx3G -Xms3G -jar server-1-18.jar nogui \n"
                                ];

                                // Check for this string inside the SSH console to signal the tunnel closing
                                stopString = 'For help, type "help"';

                                // Execute commands on the instance, then, signal
                                // that the server is ready in Discord
                                sendSSHCommands(startCmds, gamingServer.ipv4, stopString, () => {
                                    msg.edit(`Starting Server: Done!\nIPV4: ${gamingServer.ipv4}\nIPV6 ${gamingServer.ipv6}`);
                                    minecraftServerUp = true;
                                });

                            }
                        });
                    }
                });
            }
        });
    }
}


// Function: Send SSH commands to instance
async function sendSSHCommands(cmds, hostIPV4, stopString, callback) {

    // Import SSH2
    const { Client } = require('ssh2');

    // Create connection object
    const conn = new Client();

    // Replace "." by "-" in the host IP address
    hostIPV4 = hostIPV4.replace(/\./g, "-");

    // Create the command event
    var command = conn.on('ready', () => {

        // Connection successful. Opening a shell
        console.log('SSH Connection Successful. Opening a shell');
        conn.shell((err, stream) => {

            // Event: Shell is closed
            stream.on('close', (code) => {
                console.log('Shell Close: \n', { code });

            // Event: Shell is streaming data
            }).on('data', (shellData) => {

                // Log the shell output
                console.log(shellData.toString());

                // If shell log contains the stop string, the desired process has finished
                // execution. The SSH tunnel is subsequently closed and the callback is called.
                if (shellData.toString().includes(stopString)) {
                    conn.end();
                    callback();
                }
            
            // Event: Shell has exited
            }).on('exit', (code) => {
                console.log('Shell Exit: \n', { code });
                conn.end();

            // Event: Shell error
            }).on('error', (e) => {
                console.log('Shell Error: \n', { e });
                rej(e);
            });

            // Each command in the list is passed to the shell 
            cmds.forEach(cmd => {
                stream.write(`${cmd}`);
            });
        });
    });

    // Send command to EC2 instance
    command.connect({
        host: `ec2-${hostIPV4}.us-east-2.compute.amazonaws.com`,
        port: 22,
        username: "ec2-user",
        privateKey: readFileSync("C:/Users/eddysanoli/.ssh/aws-server.pem")
    });

}

// =================================================================
// DISCORD LOGIN
// =================================================================

// Login to Discord with bot's token
// (Bot Link: https://discord.com/api/oauth2/authorize?client_id=930983546816974899&permissions=534727097920&scope=bot)
client.login(process.env.TOKEN);

