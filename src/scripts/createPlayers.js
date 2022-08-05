const players = require("../../files/players.json");

const { client, GRAPH_NAME } = require("../utils/redis");

const createPlayerForLeague = async (league) => {
    for(let count in players.league[league]){
        const {temporaryDisplayName: name, pos, nbaDebutYear,yearsPro,personId: id } = players.league[league][count];
        if(!!name){
            await client.graph.query(GRAPH_NAME, `CREATE (:player{name:'${name.replace(`'`, " ")}',pos:'${pos}',nbaDebutYear:'${nbaDebutYear}',yearsPro:${Number(yearsPro)},id:'${id}'})`);
            console.info(`Created player ${name} - ${id}`);
        } 
    }
}

module.exports.createPlayer = async () => {
    await createPlayerForLeague("standard");
}

