# Automation Discord Bot

Discord bot built with Typescript and Docker that's meant to automate different tasks and do other wacky stuff that I find amusing. Currently it only allows me to automatically bring up and bring back down a gaming server that I use for my friends, but soon enough I'll be adding more features.

----

## Files

Below you can find a short description of all the most relevant files in the repository.

```txt
discord-bot
|
├── .github/workflows           : CI/CD Workflows for GitHub Actions 
|                                 =================================
|
|
├── src                         : Source Code for the Discord Bot 
|   |                             =================================
|   |
|   ├── awsUtils.ts             : Functions to interact with the AWS SDK 
|   ├── customTypes.ts          : Custom type definitions for the bot 
|   └── pruebas.ts              : Tests for new functionality for the bot
|   
|
├── tests                       : Tests for the Bot 
|                                 =================================
|
|
├── .env                        : Secret environment variables. Make sure to add to your deployment 
├── .gitignore                  : Files that should not be committed into the repo
├── .dockerignore               : Files that should not be included in the Docker image on build 
|
├── docker-compose.yaml         : Docker compose file to run the bot docker image locally 
├── Dockerfile                  : Blueprint for the bot container
|
├── bot.ts                      : Main file for the bot. Run with the command "ts-node bot.ts"" 
├── package.json                : NPM Dependencies and scripts for the project
├── package-lock.json           : Sub-dependencies for the modules in package.json 
|
├── README.md                   : The readme you are reading right now. Hello there!
└── tsconfig.json               : Settings to compile all the typescript files in the project 

```

## Deployment

This project is not meant to run by itself, although I included a `docker-compose.yaml` file that will allow you to run it locally. Instead, the bot is meant to be run inside of the docker compose stack of `eddysanoli.com`. The provisioning Ansible playbook used for the "eddysanoli" site, includes an container built from the Dockerfile found in this repo. Because of this, before pushing to the repository, you have to make sure that the compose stack of "eddysanoli" is up and running. Once this has been taken care of, you need to:

1. Add the required github action secrets for the workflows in this repo: `LINODE_HOST`, `SSH_PASS` and `SSH_USER`.
2. The "eddysanoli" server needs to have a `.env` file inside of the folder where this repo was cloned. Copy the contents of your local `.env` file into a new file called `.env` in the server.
3. Push to the repository and the bot will be automatically deployed.
