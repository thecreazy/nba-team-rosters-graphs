const teams = require("../../files/teams.json");

const { client, GRAPH_NAME } = require("../utils/redis");

const createTeamsForLeague = async (league) => {
    for(let count in teams.league[league]){
        const {fullName: name, city, isNBAFranchise,tricode,teamId: id, nickname } = teams.league[league][count];
        await client.graph.query(GRAPH_NAME, `CREATE (:team{name:'${name}',city:'${city}',isNBAFranchise:${isNBAFranchise},tricode:'${tricode}',id:'${id}',nickname:'${nickname}'})`)
        console.info(`Created team ${name} - ${id}`);
    }
}

module.exports.createTeams = async () => {
    await createTeamsForLeague("standard");
}

