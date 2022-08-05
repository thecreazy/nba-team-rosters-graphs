const players = require("../../files/players.json");

const { client, GRAPH_NAME } = require("../utils/redis");

const createCountryForLeague = async (league) => {
    const countries = []
    for(let count in players.league[league]){
        const { country } = players.league[league][count];
        if(!!country && !countries.includes(country)){
            countries.push(country)
            await client.graph.query(GRAPH_NAME, `CREATE (co:country{name:'${country}'})`);
            console.info(`Created country ${country}`);
        }
       
    }
}

module.exports.createCountry = async () => {
    await createCountryForLeague("standard");
}

