// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');


// Set the AWS region 
AWS.config.update({region: 'us-east-2'});

// Create EC2 service object
var ec2 = new AWS.EC2();

var params = {
  GroupId: "sg-0e5ca585f6b9aff24",
  IpPermissions: [{
    FromPort: 25565,
    IpProtocol: "tcp",
    IpRanges: [{
      CidrIp: "45.229.43.107/32",
      Description: "Ricardite Minecraft"
    }],
    ToPort: 25565
  }]
};

ec2.authorizeSecurityGroupIngress(params, (err, data) => {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});

/*
const { readFileSync } = require('fs');
const { Client } = require('ssh2');

// Create connection object
const conn = new Client();

// Shell commands
const start_cmds = [
  "killall screen \n",
  "cd minecraft/server \n",
  "screen -S mc_server \n",
  "java -Xmx3G -Xms3G -jar server-1-18.jar nogui \n"
];

const stop_cmds = [
  "cd minecraft/server \n",
  "screen -D -RR mc_server \n",
  "/stop\n"
];

function sendSSHCommands(cmds, hostIP) {

  // Replace "." by "-" in the host IP address
  hostIP = hostIP.replace(/\./g, "-");

  // Create the command event
  var command = conn.on('ready', () => {

    // Connection successful. Opening a shell
    console.log('Connection successful. Opening a shell');
    conn.shell((err, stream) => {
  
  
      stream.on('close', (code) => {
        console.log('Shell Close: \n', { code });
      }).on('data', (shellData) => {
        console.log(shellData.toString());

        // If shell log contains: 'For help, type "help"', end the SSH tunnel
        if (shellData.toString().includes('For help, type "help"')) {
          conn.end();
        }

      }).on('exit', (code) => {
        console.log('Shell Exit: \n', { code });
        conn.end();
      }).on('error', (e) => {
        console.log('stream :: error\n', { e });
        rej(e);
      });
      for (let i = 0; i < cmds.length; i += 1) {
        const cmd = cmds[i];
        stream.write(`${cmd}`);
      }
    });
  });
  
  // Send command to EC2 instance
  command.connect({
    host: `ec2-${hostIP}.us-east-2.compute.amazonaws.com`,
    port: 22,
    username: "ec2-user",
    privateKey: readFileSync("C:/Users/eddysanoli/.ssh/aws-server.pem")
  });  

}


// Variables for the IPs (With default placeholders)
let IPV4 = "10.0.0.0";
let IPV6 = "2001:4860:2012:1212";

// EC2 parameters:
// - InstanceIds: List with the IDs of all the EC2 instances to start
// - Dry Run: Checks if you have the availble permissions to do this
let params = {
  InstanceIds: ["i-0c794562f3be7c6f8"],
  DryRun: true
};

// Start the EC2 instance and retrieve its IPs
ec2.startInstances(params, (err, data) => {

  // Check if the error returned is a "Dry Run Operation"
  // Start the instance if it is.
  if (err && err.code == "DryRunOperation") {
    
    // Disable the check for permissions
    params.DryRun = false;

    // Start the instance and return errors if they exist
    ec2.startInstances(params, (err, data) => {
      if (err) { console.log("Error", err); }
      else if (data) {

        console.log(`Starting Instance: ${data.StartingInstances[0].InstanceId}`);

        // Wait for the two status checks of the EC2 instance
        // Return errors in case they exist
        ec2.waitFor('instanceStatusOk', params, (err, data) => {
          if (err) console.log(err, err.stack); // an error occurred
          else {

            console.log(`Successfully Started Instance: ${data.InstanceStatuses[0].InstanceId}.`);

            // Disable dry run (Dont check for permissions)
            params.DryRun = false;

            // Extract the IPV4 and IPV6 of the instance
            ec2.describeInstances(params, function(err, data) {
              if (err) {
                console.log("Retrieve Instance Info: Error\n", err.stack);
              } else {
                IPV4 = data.Reservations[0].Instances[0].PublicIpAddress;
                IPV6 = data.Reservations[0].Instances[0].Ipv6Address;
                console.log(`IPV4: ${IPV4} / IPV6 ${IPV6}`);

                // Execute commands on the instance
                sendSSHCommands(stop_cmds, IPV4);
              }
            });

          }   
        });
        
      }
    });

  }
});

*/