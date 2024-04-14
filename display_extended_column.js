const RGLDivisions = Object.freeze({
  None: 0,
  Newcomer: 1,
  Amateur: 2,
  Intermediate: 3,
  Main: 4,
  Advanced: 5,
  Invite: 6,
});

// gamemode = "Sixes" or "Highlander"
async function GetHighestGamemodeTeam(gamemode, steamID) {
  const res = await GetRGLPastTeams(steamID);

  if (res.status != 200) {
    console.log(res);
  }

  const pastTeams = await res.json();

  let greatestNumerivalDivisionPlayed = RGLDivisions.None;

  for (let i = 0; i < pastTeams.length; i++) {
    if (pastTeams[i].formatName != gamemode) continue;

    const numericalValue = RGLDivisions[pastTeams[i].divisionName];
    if (greatestNumerivalDivisionPlayed < numericalValue) {
      greatestNumerivalDivisionPlayed = numericalValue;
    }
  }

  // console.log(JSON.stringify(pastTeams, null, 2));

  let divisionString = null;
  for (const key in RGLDivisions) {
    if (RGLDivisions[key] == greatestNumerivalDivisionPlayed) {
      divisionString = key;
      break;
    }
  }
  return divisionString;
}

async function GetRGLPastTeams(steamID) {
  const uri = `https://api.rgl.gg/v0/profile/${steamID}/teams`;

  const response = await fetch(uri);

  return response;
}

async function GetRGLName(steamID) {
  const uri = `https://api.rgl.gg/v0/profile/${steamID}`;

  const response = await fetch(uri);

  // 325ms and below are too fast - it will exceed rate limit.
  // await timer(325);
  // await timer(200);

  return response;
}

async function GetETF2LName(steamID) {
  const uriETF2L = `https://api-v2.etf2l.org/player/${steamID}`;
  const responseETF2L = await fetch(uriETF2L);

  await timer(200);
  return responseETF2L;
}

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

async function UpdateETF2L() {
  for (let i = 0; i < playerRows.length; i++) {
    const steamID = playerRows[i].id.split("_")[1];
    const resETF2L = await GetETF2LName(steamID);

    const leagueElement = playerRows[i].firstChild;

    // Get rid of 'Loading...' message
    leagueElement.innerHTML = "";

    if (resETF2L.status != 200) {
      console.log(resETF2L);
      continue;
    }

    const data = await resETF2L.json();
    const etf2lLink = document.createElement("a");
    etf2lLink.innerHTML = data.player.name;
    etf2lLink.href = `https://etf2l.org/search/${steamID}/`;
    etf2lLink.target = "_blank";
    etf2lLink.style.backgroundColor = "rgb(144, 238, 144)";
    etf2lLink.style.padding = "6px";
    leagueElement.appendChild(etf2lLink);
  }
}

async function updateRGLName(steamID, rglElement) {
  const res = await GetRGLName(steamID);

  if (res.status != 200) {
    console.log(res);
    return;
  }

  const data = await res.json();
  const rglLink = document.createElement("a");
  rglLink.href = `https://rgl.gg/Public/PlayerProfile?p=${steamID}`;
  rglLink.target = "_blank";
  rglLink.style.backgroundColor = "rgb(255, 203, 108)";
  rglLink.style.padding = "6px";
  rglLink.style.marginLeft = "10px";
  rglLink.innerHTML = data.name;

  rglElement.appendChild(rglLink);

  const banWarning = data.status.isBanned;

  rglLink.innerHTML = data.name;

  if (!banWarning) return;

  const banWarningSpan = document.createElement("span");
  banWarningSpan.innerHTML = "(BANNED)";
  rglLink.style.backgroundColor = "rgb(255, 31, 31)";

  rglLink.appendChild(banWarningSpan);
}

async function updateRGLDivision(steamID, rglElement) {
  const highestSixesTeam = await GetHighestGamemodeTeam("Sixes", steamID);

  let sixesDivisionString = "";
  if (highestSixesTeam != "None") {
    sixesDivisionString = `${highestSixesTeam}`;

    const rglDivisionElement = document.createElement("span");

    rglDivisionElement.style.backgroundColor = "rgb(255, 255, 153)";

    rglDivisionElement.innerHTML = sixesDivisionString;
    rglDivisionElement.style.padding = "6px";
    rglDivisionElement.style.marginLeft = "10px";

    rglElement.appendChild(rglDivisionElement);
  }
}

async function UpdateRGL() {
  for (let i = 0; i < playerRows.length; i++) {
    const steamID = playerRows[i].id.split("_")[1];

    const rglElement = playerRows[i].firstChild;

    await updateRGLName(steamID, rglElement);
    await updateRGLDivision(steamID, rglElement);
  }
}

function UpdatePlayerRows() {
  // Do ETF2L first then do RGL
  UpdateETF2L();
  UpdateRGL();
}

const tableBody = document.getElementById("players");

const playerTableHead = tableBody.children[0].firstElementChild;
const playerTableBody = tableBody.children[1];

const rglNameHeader = document.createElement("th");
rglNameHeader.innerHTML = "ETF2L/RGL + 6s Division";

playerTableHead.insertBefore(rglNameHeader, playerTableHead.firstChild);

const playerRows = playerTableBody.children;

for (let i = 0; i < playerRows.length; i++) {
  const rglName = document.createElement("td");
  rglName.innerHTML = "Loading...";
  playerRows[i].insertBefore(rglName, playerRows[i].firstChild);
}

const mainElement = document.getElementsByClassName("container main")[0];
mainElement.style = "width: 1400px !important;";

UpdatePlayerRows();
