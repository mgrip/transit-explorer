# 🚞

## Development

This project includes both a CLI and a web app to explore transit data

A running instance of the project consists of a postgres DB, and a node web server. In order to develop locally, you'll need both of these running on your local machine.

### Install node

If you don't already have node installed, you can download it directly from [https://nodejs.dev](https://nodejs.dev)

### Install postgres

You can either choose to install postgres manually, or use docker to manage it for you. Docker is recommended as we have already specified the necessary configuration in [docker-compose.yml](https://github.com/mgrip/transit-explorer/blob/main/docker-compose.yml). You can download docker destktop directly from [https://docs.docker.com/desktop/](https://docs.docker.com/desktop/).

### Clone the repository

After installing node and docker (or manually installing postgres), you can clone this repository locally, which contains all of the code necessary to run the web app.

```bash
git clone https://github.com/mgrip/transit-explorer.git
```

### Start the database

If using docker, you can start the postgres database simply by running `docker compose up -d`.

### Install dependencies

To install npm dependencies locally, run `npm install`

### Setup the database

Use prisma to intialize your database with the latest schema from the codebase `npx prisma migrate dev`. This should automatically seed your local database using the json seed file in this repository - but at any time you can manually refresh data from public transit databases by running `npm run sync-data`.

### Start developing

To run the development server, run `npm run dev`. The local development server will be accessible at [http://localhost:3000](http://localhost:3000).

To run the CLI, run `npm run cli`
