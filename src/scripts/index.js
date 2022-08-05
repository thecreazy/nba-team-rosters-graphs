require('dotenv').config();
require('better-logging')(console);

const { enableClient, client, GRAPH_NAME } = require("../utils/redis");
const { createConf } = require('./createConf');
const { createRelationshipPlayers } = require('./createRelationshipPlayers');
const { createRelationshipTeams } = require('./createRelationshipTeams');
const { createCountry } = require('./createCountry');
const { createLeague } = require("./createLeague");
const { createPlayer } = require('./createPlayers');
const { createTeams } = require('./createTeams');

const main = async () => {
    await enableClient();
    await client.graph.delete(GRAPH_NAME);
    await createLeague();
    await createConf();
    await createTeams();
    await createRelationshipTeams();
    await createPlayer();
    await createCountry();
    await createRelationshipPlayers();
    console.log("All the rosters imported");
    client.disconnect();
}

main();