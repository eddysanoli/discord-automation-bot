// Dependencies
const AWS = require('aws-sdk');
const { readFileSync } = require('fs');

// AWS Setup
// Set the AWS region 
AWS.config.update({region: 'us-east-2'});

// Create EC2 service object
var ec2 = new AWS.EC2();

// Gaming server EC2 instance ID
const gamingEC2ID = "i-0c794562f3be7c6f8";

// Initial minecraft server status
let minecraftServerUp = false;

// No such file or directory

// =================================================================
// FUNCTIONS
// =================================================================

// -----------------------------
// Function: Change the current server level
exports.changeLevelName = async (msg, levelName) => {

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


// -----------------------------
// Function: Add IPV6 to security group ingress rules
exports.addIPV6 = (msg, ipv6, description) => {

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


// -----------------------------
// Function: Add IPV4 to security group ingress rules
exports.addIPV4 = (msg, ipv4, description) => {

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


// -----------------------------
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

exports.getEC2Info = getEC2Info;


// -----------------------------
// Function: Stop the minecraft server
exports.stopServer = async (msg) => {

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


// -----------------------------
// Function: Stop the EC2 instance
exports.stopEC2Instance = async (msg) => {

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
                else {
                    console.log("Stop Instance: Success")
                    msg.reply("EC2 Instance Successfully Stopped");
                }
            });
        }
        else msg.reply("Minecraft server is still running. Stop it before turning off the instance.");

    }

    // Gaming server is "stopped"
    else if (gamingServer.status === "stopped") {
        msg.reply("Gaming server is already stopped");
    }
}


// -----------------------------
// Function: Start the EC2 server
exports.startServer = async (msgChannel) => {

    // First discord message
    const msg = await msgChannel.send("Starting Server: ------- ");

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
                console.log("Start Server: Success");
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

                                // Check for this string inside the SSH console to signal the tunnel closing
                                stopString = 'For help, type "help"';

                                // Execute commands on the instance, then, signal
                                // that the server is ready in Discord
                                sendSSHCommands(startCmds, gamingServer.ipv4, stopString, () => {
                                    msg.edit(`Starting Server: Done!\nIPV4: ${gamingServer.ipv4}\nIPV6 ${gamingServer.ipv6}`);
                                    minecraftServerUp = true;
                                    console.log("Start Server: Success");
                                });

                            }
                        });
                    }
                });
            }
        });
    }
}

// -----------------------------
// Function: Send SSH commands to instance
const sendSSHCommands = async (cmds, hostIPV4, stopString, callback) => {

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

exports.sendSSHCommands = sendSSHCommands;
