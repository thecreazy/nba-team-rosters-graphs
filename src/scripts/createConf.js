
const { client, GRAPH_NAME } = require("../utils/redis");

const confederations = ["West", "East"]

module.exports.createConf = async () => {
    for(let count in confederations){
        await client.graph.query(GRAPH_NAME, `CREATE (:confederation{name:'${confederations[count]}'})`)
        console.info(`Created confederation ${confederations[count]}`)
    }
}

