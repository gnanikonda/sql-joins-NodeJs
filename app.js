const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbpath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(4000, () => {
      console.log("server has started at port 3000");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(1);
  }
};

initialize();

//api 1

const convertObject = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

app.get("/states/", async (a, b) => {
  const query = `
    select * from state;
    `;
  const result = await db.all(query);
  b.send(result.map((each) => convertObject(each)));
});

//api 2

app.get("/states/:stateId/", async (a, b) => {
  const { stateId } = a.params;
  const query = `
    select * from state where state_id='${stateId}';
    `;
  let res = await db.get(query);
  b.send(convertObject(res));
});

//api 3

app.post("/districts/", async (a, b) => {
  const { districtName, stateId, cases, cured, active, deaths } = a.body;
  const query = `
    insert into district (district_name,state_id,cases,cured,active,deaths)
    values('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');
    `;
  const res = await db.get(query);
  b.send("District Successfully Added");
});

//api 4

const convertdist = (each) => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  };
};

app.get("/districts/:districtId/", async (a, b) => {
  const { districtId } = a.params;
  const query = `
    select * from district where district_id='${districtId}';
    `;
  const res = await db.get(query);
  b.send(convertdist(res));
});

//api 5

app.delete("/districts/:districtId/", async (a, b) => {
  const { districtId } = a.params;
  const query = `
    delete from district where district_id='${districtId}';
    `;
  const res = await db.get(query);
  b.send("District Removed");
});

// api 6

app.put("/districts/:districtId/", async (a, b) => {
  const { districtId } = a.params;
  const { districtName, stateId, cases, cured, active, deaths } = a.body;
  const query = `
    update district
    set district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active ='${active}',
    deaths = '${deaths}';
    `;
  const res = await db.get(query);
  b.send("District Details Updated");
});

//api 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// app.get("/states/:stateId/stats/", async (a, b) => {
//   const { stateId } = a.params;
//   const query = `
//     select sum(district.cases) as totalCases,sum(district.cured) as totalCured,
//     sum(district.active) as totalActive,sum(district.deaths) as totalDeaths
//     from state inner join district on state.state_id = district.state_id
//     group by state.state_id
//     having state.state_id = '${stateId}';
//     `;
//   const res = await db.all(query);
//   b.send(res);
// });

//api 8

const convertname = (each) => {
  return {
    stateName: each.state_name,
  };
};

app.get("/districts/:districtId/details/", async (a, b) => {
  const { districtId } = a.params;
  const query = `
    select state.state_name from state inner join district 
    on state.state_id = district.state_id where district_id = '${districtId}';
    `;
  const res = await db.get(query);
  b.send(convertname(res));
});

module.exports = app;
