const players = require("../../files/players.json");

const { client, GRAPH_NAME } = require("../utils/redis");

const createRelationshipPlayerForLeague = async (league) => {
    for(let count in players.league[league]){
        const { personId: id, temporaryDisplayName: name, country, teamId, teams = [] } = players.league[league][count];
        if(!name) continue;
        await client.graph.query(GRAPH_NAME, `MATCH (t:team),(p:player) WHERE t.id = '${teamId}' AND p.id = '${id}' CREATE (p)-[r:PLAY_INTO]->(t) RETURN r`);
        console.info(`Created Relationship team to player ${teamId} <-> ${name}`);
        for (let x in teams){
            const {teamId:oldTeamId, seasonStart, seasonEnd} = teams[x];
            if (oldTeamId !== teamId) {
                await client.graph.query(GRAPH_NAME, `MATCH (t:team),(p:player) WHERE t.id = '${oldTeamId}' AND p.id = '${id}' CREATE (p)-[r:PLAYED_INTO{seasonStart: '${seasonStart}', seasonEnd: '${seasonEnd}'}]->(t) RETURN r`);
                console.info(`Created Relationship old - team to player ${oldTeamId} <-> ${name}`);
            }
        }
        if(!country) continue;
        await client.graph.query(GRAPH_NAME, `MATCH (co:country),(p:player) WHERE co.name = '${country}' AND p.id = '${id}' CREATE (p)-[r:BORN]->(co) RETURN r`);
        console.info(`Created Relationship country to player ${country} <-> ${name}`);
    }
}

module.exports.createRelationshipPlayers = async () => {
    await createRelationshipPlayerForLeague("standard");
}

