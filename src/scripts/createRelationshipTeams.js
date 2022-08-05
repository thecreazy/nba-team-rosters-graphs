const teams = require("../../files/teams.json");

const { client, GRAPH_NAME } = require("../utils/redis");

const createRelationshipTeamFromLeague = async (league) => {
    for(let count in teams.league[league]){
        const { teamId, fullName: name, confName } = teams.league[league][count];
        await client.graph.query(GRAPH_NAME, `MATCH (t:team),(l:league) WHERE t.id = '${teamId}' AND l.name = '${league}' CREATE (t)-[r:BELONGS]->(l) RETURN r`);
        console.info(`Created Relationship team to league ${name} <-> ${league}`);
        await client.graph.query(GRAPH_NAME, `MATCH (t:team),(c:confederation) WHERE t.id = '${teamId}' AND c.name = '${confName}' CREATE (t)-[r:PART_OF]->(c) RETURN r`);
        console.info(`Created Relationship team to confederation ${name} <-> ${confName}`);
    }
}

module.exports.createRelationshipTeams = async () => {
    await createRelationshipTeamFromLeague("standard");
}

