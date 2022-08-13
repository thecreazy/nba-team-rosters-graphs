# Deep Inside the NBA’s Rosters Using as Graph Database RedisGraph

![](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/docs/logo.jpg)

I am a big fan of basketball and especially of NBA, but living on the other side of the world, following matches and all the vicissitudes of the players is very difficult for me. One of the most hateful things that I have often encountered is the impossibility of being able to extrapolate your own statistics and analysis from sports data: you must always stick to the rankings and analytics made available by the NBA site. It almost seems that sports clubs are afraid that by giving the possibility to query the data we could discover something secret* (of course is a joke, I’m not saying **“they want to hide the truth from us!111!!”**).*

At this point, I asked myself: how difficult would it be to extrapolate your own statistics having all the data of the last NBA season? What would it take to manage such data?

My answer was that it was enough for me to find:

* The NBA data

* A Graph database to store all this information

To solve the first point:  it’s a secret, but you can find all the JSON files in the [Github repository](https://github.com/thecreazy/nba-team-rosters-graphs/tree/main/files).

To solve the second point:  I choose to try RedisGraph because I wanted something that was extremely versatile and also runs on the ram to be as fast as possible.

### What is a Graph Database?

Graph databases are nothing more than databases that use graph logic to represent *entities* (***Nodes***) and the *relationships* between these entities (***Edges***). In this way, you can focus on your entities without taking into account how they relate to each other and add (up to very complex levels) the relationships between your entities at a later time and without altering the entities themselves.

### RedisGraph

RedisGraph is a graph database built on Redis. This allows us to use all the power of an in-memory database but with a plus: all your graph databases will be serialized into a Redis key so you can store multiple versions of your graph database on the same Redis Database simply by using more keys. Why would you need it? A/B test between different data with the same node and relationship models or maybe you need two different persistence times for your data

# Let’s code

### First step: Let’s create a simple Node

Let’s start from a really base Node, the confederation Entity. NBA is divided into two confederations: West and East. Let’s use `node-redis` to create this new Node using the query interface.

The command to create a Node with just a name into RedisGraph is 

```
CREATE (:<name-of-the-node>{name:<string>})
```

We can use the same command also in `node-redis` in this way:

```js

const { client, GRAPH_NAME } = require("../utils/redis");

const confederations = ["West", "East"]

module.exports.createConf = async () => {
    for(let count in confederations){
        await client.graph.query(GRAPH_NAME, `CREATE (:confederation{name:'${confederations[count]}'})`)
        console.info(`Created confederation ${confederations[count]}`)
    }
}


```
> *[createConfiderationNode.js view raw](https://gist.githubusercontent.com/thecreazy/de6e6b2e7a321f320fcec6d942fb45dd/raw/e1ee41ef25002a0f1e2f9d7c77cbd4ac22943a6b/createConfiderationNode.js)*

To check if we saved all the information in Redis we can use this query:

```bash
GRAPH.QUERY NBA_ROSTER "MATCH (c:confederation) return c.name"
```

![](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/docs/1.png)

[*Full code here*](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/src/scripts/createConf.js)

### Second step: Create a more complex Node

Using the same command we can create a more complex Node! If we give a better look at the previous query we can see that after the `name-of-the-node` we have a structure that seems like a JSON, in fact:

```bash
CREATE (:<name-of-the-node>{name:<string>, id: <number>, isActive: true})
```

We can insert into a single Node a complete structure declaring it as a JSON: it can store numbers, strings, and booleans. All these different types of data will help us later to perform statistics on the data saved in the DB. For example:

```js
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


```
> *[createTeamNode.js view raw](https://gist.githubusercontent.com/thecreazy/ce41510ef8c7a5e9147098b593a0f7d7/raw/d547c3d1baa7f358041fa7218bf8b7af7b5bccfd/createTeamNode.js)*

And querying the DB we can see that using this query:

```bash
GRAPH.QUERY NBA_ROSTER "MATCH (t:team) return t.name, t.city, t.id, t.tricode"
```

![](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/docs/2.png)

[*Full code here*](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/src/scripts/createTeams.js)

### Third step: Create relationships between Nodes

Now is the time to create relationships between the Nodes (Team and Confederation) we created before. In our case each team can be part of one Confederation, so the mutation will be something like this:

```bash
MATCH (t:team),(l:league) WHERE t.id = <teamid> AND l.name = <lagueName> CREATE (t)-[r:BELONGS]->(l) RETURN r
```

The syntax is quite similar to a normal MySQL query but is everything you need to connect two different Nodes, no external/internal id, no foreign keys, and the relationship *(**BELONGS** in our case)* has a name that can be queried!

```js
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


```
> *[createRelationshipTeams.js view raw](https://gist.githubusercontent.com/thecreazy/b015734b329d58e4002342d97a845621/raw/be3111867f6cda421a240c3dcb7a2fd6827871c3/createRelationshipTeams.js)*

![](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/docs/3.png)

[*Full code here*](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/src/scripts/createRelationshipTeams.js)

**Bonus step**

One of the bad news about using RedisGraph is that the major part of the DB UI tool has problems showing the information stored in Redis, but luckily Redis give us also a UI tool (thx!) called [**RedisInsight](https://redis.com/redis-enterprise/redis-insight/).** This UI gives us both the textual part (all the screenshots above) but also the visual version, exactly like this:

![](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/docs/4.png)

### Fourth step: Create player node and relationship

Now it’s time for the coolest part, let’s create the Player Node and let’s connect each Player with his current Team but also with all the teams he played before

I will skip the creation code part because is pretty similar to the other entities: 

```bash
CREATE (:player{name:'${name}',pos:'${pos}',nbaDebutYear:'${nbaDebutYear}',yearsPro:${yearsPro},id:'${id}'})
```

But the important part here is the *relationships*! The same Node can have multiple relations with the same other Node, the only thing that will change will be the name of the relation and any other parameters connected to the relationship. In our case, we will connect twice the Player and the Team, once with the current team:

```bash
MATCH (t:team),(p:player) WHERE t.id = '${teamId}' AND p.id = '${id}' CREATE (p)-[r:PLAY_INTO]->(t) RETURN r
```

and once with all the previous teams

```bash
MATCH (t:team),(p:player) WHERE t.id = '${oldTeamId}' AND p.id = '${id}' CREATE (p)-[r:PLAYED_INTO]->(t) RETURN r
```

But in the second case we can also add some params to the relation, like the year when he started and finished playing with that team:

```bash
MATCH (t:team),(p:player) WHERE t.id = '${oldTeamId}' AND p.id = '${id}' CREATE (p)-[r:PLAYED_INTO{seasonStart: '${seasonStart}', seasonEnd: '${seasonEnd}'}]->(t) RETURN r
```

Now the graph is really really complicated, I have also connected each player with his Country (another Node) and this is (more or less because RedisInsight stops rendering when the Nodes are too much) the final situation:

![](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/docs/5.png)

[*Full code here*](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/src/scripts/createRelationshipPlayers.js)

### Fifth step: Let’s analyze the data

But the only reason why we created that fantastic graph was to analyze the NBA rosters, so:

**List the number of Players for each Country that are playing in the NBA**

```bash
GRAPH.QUERY NBA_ROSTER "MATCH (p:player)-[:BORN]->(c:country) RETURN c.name, count(p) ORDER BY count(p) DESC"
```

```bash
1) 1) "USA"       
   2) "387"    
2) 1) "Canada"       
   2) "21"    
3) 1) "France"       
   2) "9"    
4) 1) "Germany"       
   2) "8"    
5) 1) "Australia"
   2) "7"
```

**Show the turnover for each NBA Team**

```bash
GRAPH.QUERY NBA_ROSTER "MATCH (p:player)-[:PLAYED_INTO]->(t:team) RETURN t.name, count(p) ORDER BY count(p) DESC"
```

```bash
1) 1) "Philadelphia 76ers"       
   2) "41"    
2) 1) "Los Angeles Lakers"       
   2) "37"    
3) 1) "Houston Rockets"       
   2) "34"    
4) 1) "Oklahoma City Thunder"       
   2) "32"    
5) 1) "LA Clippers"       
   2) "30"
```

**Show the average years in Pro leagues of the Players on each Team**

```bash
GRAPH.QUERY NBA_ROSTER "MATCH (p:player)-[:PLAY_INTO]->(t:team) RETURN t.name, avg(p.yearsPro) ORDER BY avg(p.yearsPro) DESC"
```

```bash
1) 1) "Los Angeles Lakers"       
   2) "8.05882352941176"    
2) 1) "Brooklyn Nets"       
   2) "6.625"    
3) 1) "Milwaukee Bucks"       
   2) "6.05882352941176"    
4) 1) "Miami Heat"       
   2) "5.70588235294118"    
5) 1) "Phoenix Suns"       
   2) "5.625"
```

**Show for each team the average years in Pro leagues of their Players divided by Player Country**

```bash
GRAPH.QUERY NBA_ROSTER "MATCH (p:player)-[:PLAY_INTO]->(t:team), (p:player)-[:BORN]-(c:country) RETURN c.name, t.name, avg(p.yearsPro) ORDER BY avg(p.yearsPro) DESC"
```

```bash
1) 1) "Dominican Republic"       
   2) "Boston Celtics"       
   3) "14"    
2) 1) "Slovenia"       
   2) "Brooklyn Nets"       
   3) "13"    
3) 1) "France"       
   2) "LA Clippers"       
   3) "13"    
4) 1) "Italy"       
   2) "Atlanta Hawks"       
   3) "12"
```

The possibilities to create queries using a Graph Database are unlimited and using RedisGraph the velocity is incredible! Without adding an index to the database and using a 30Mb database the most complex query I have run took less than a second. 

![](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/docs/6.gif)

### About indexes

RedisGraph allows you to create indexes  on your Nodes, to do that you need only to exec this command:

```
GRAPH.QUERY <key>"CREATE INDEX FOR (p:<name-of-the-node>) ON (p.<name-of-the-attribute>)"
```

Quite simple, and you can check if everything is working well just by using the `GRAPH.EXPLAIN` and the `GRAPH.PROFILE` commands that allow you to take a look at what is doing Redis to run your query

But the coolest  part is that RedisGraph allows you to create a full-text search index. This is a great feature for “graph-aided search” use cases, such as a LinkedIn search. Creating a Full-text search, as always, is really simple:

```
GRAPH.QUERY <key> "CALL db.idx.fulltext.createNodeIndex(<node-name>, <attribute-name>)"
```

```
in our case
```

```
GRAPH.QUERY NBA_ROSTER "CALL db.idx.fulltext.createNodeIndex('player', 'name')"
```

And now you are able to run a full-text query just using:

```
GRAPH.QUERY NBA_ROSTER "CALL db.idx.fulltext.queryNodes('player', '%James%') YIELD node RETURN node.name"
```

```
2) 1) 1) "Bouknight, James"    
   2) 1) "Harden, James"    
   3) 1) "James, LeBron"    
   4) 1) "Wiseman, James" 
3) 1) "Cached execution: 0"    
   2) "Query internal execution time: 0.365883 milliseconds"
```

It’s a cakewalk!

![](https://github.com/thecreazy/nba-team-rosters-graphs/blob/main/docs/7.gif)

### Where to save all this data?

Of course, you can run and store your Redis Instance on your local machine or on your server maybe using Docker. But there is another way. 

If you, like me, prefer to use a managed cloud instance of your database instead of spending time and money maintaining your DBS instance you can try to use *Redis Enterprise Cloud*

> ***Redis Enterprise Cloud** is a fully managed cloud service by Redis. Built for modern distributed applications, enables you to run any query, simple or complex, at sub-millisecond performance at virtually infinite scale without worrying about operational complexity or service availability*

For this article, I’m using the free plan, and you can test it free [using this link](https://redis.info/3NBGJRT), which gives you a small database of **30MB.** 30Mb seems very low, but we have seen that 18Mb is enough to manage all the data we needed from the NBA!

All the scripts of this project are open source and you can find it here:

https://github.com/thecreazy/nba-team-rosters-graphs

> This post is in collaboration with Redis.

**Learn more:**

* [Try Redis Cloud for free](https://redis.info/3NBGJRT)

* [Watch this video on the benefits of Redis Cloud over other Redis providers](https://redis.info/3Ga9YII)

* [Redis Developer Hub — tools, guides, and tutorials about Redis](https://redis.info/3LC4GqB)

* [RedisInsight Desktop GUI](https://redis.info/3wMR7PR)
