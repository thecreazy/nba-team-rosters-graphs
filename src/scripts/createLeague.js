const league = require("../../files/league.json");

const { client, GRAPH_NAME } = require("../utils/redis");


module.exports.createLeague = async () => {
    for(let count in league.value){
        await client.graph.query(GRAPH_NAME, `CREATE (:league{name:'${league.value[count]}'})`)
        console.info(`Created legue ${league.value[count]}`)
    }
}

