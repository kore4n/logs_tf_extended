const RGLDivisions = Object.freeze({
  None: 0,
  Newcomer: 1,
  Amateur: 2,
  Intermediate: 3,
  Main: 4,
  Advanced: 5,
  Invite: 6,
});

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

// gamemode = "Sixes" or "Highlander"
async function GetHighestGamemodeTeam(gamemode, steamID) {
  const res = await GetRGLPastTeams(steamID);

  if (res.status != 200) {
    console.log(res);
    return;
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

  await timer(300);

  return response;
}

async function GetRGLProfile(steamID) {
  const uri = `https://api.rgl.gg/v0/profile/${steamID}`;

  const response = await fetch(uri);

  // 325ms and below are too fast - it will exceed rate limit.
  // await timer(325);
  await timer(300);

  if (response.status != 200) {
    console.log(response);
    return;
  }

  const data = await response.json();

  return data;
}

async function GetETF2LName(steamID) {
  const uriETF2L = `https://api-v2.etf2l.org/player/${steamID}`;
  const responseETF2L = await fetch(uriETF2L);

  await timer(300);

  if (responseETF2L.status != 200) {
    console.log(responseETF2L);
    return;
  }

  const data = await responseETF2L.json();
  return data;
}

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

async function UpdateETF2LName(steamID, playerInfo, leagueElement) {
  // Get rid of 'Loading...' message
  leagueElement.innerHTML = "";

  if (!playerInfo.etf2l.name) return;

  // const data = await resETF2L.json();
  const etf2lLink = document.createElement("a");
  etf2lLink.innerHTML = playerInfo.etf2l.name;
  etf2lLink.href = `https://etf2l.org/search/${steamID}/`;
  etf2lLink.target = "_blank";
  etf2lLink.style.backgroundColor = "rgb(144, 238, 144)";
  etf2lLink.style.padding = "6px";
  leagueElement.appendChild(etf2lLink);
}

async function UpdateRGLName(steamID, playerInfo, leagueElement) {
  if (!playerInfo.rgl.name) return;

  const rglLink = document.createElement("a");
  rglLink.href = `https://rgl.gg/Public/PlayerProfile?p=${steamID}`;
  rglLink.target = "_blank";
  rglLink.style.backgroundColor = "rgb(255, 203, 108)";
  rglLink.style.padding = "6px";
  rglLink.style.marginLeft = "10px";

  const banWarning = playerInfo.rgl.isBanned;

  rglLink.innerHTML = playerInfo.rgl.name;

  leagueElement.appendChild(rglLink);

  if (!banWarning) return;

  const banWarningSpan = document.createElement("span");
  banWarningSpan.innerHTML = " (BANNED)";
  rglLink.style.backgroundColor = "rgb(255, 31, 31)";

  rglLink.appendChild(banWarningSpan);
}

async function UpdateRGLDivision(playerInfo, leagueElement) {
  if (!playerInfo.rgl.name) return;

  const highestSixesTeam = playerInfo.rgl.division;
  let sixesDivisionString = "";
  if (highestSixesTeam != "None") {
    sixesDivisionString = `${highestSixesTeam}`;

    const rglDivisionElement = document.createElement("span");

    rglDivisionElement.style.backgroundColor = "rgb(255, 255, 153)";

    rglDivisionElement.innerHTML = sixesDivisionString;
    rglDivisionElement.style.padding = "6px";
    rglDivisionElement.style.marginLeft = "10px";

    leagueElement.appendChild(rglDivisionElement);
  }
}

async function FetchPlayerInfo(steamID) {
  const RGL_profile_data = await GetRGLProfile(steamID);

  const etf2l_name = await GetETF2LName(steamID);

  const highest_rgl_division = await GetHighestGamemodeTeam("Sixes", steamID);

  const playerInfoToInsert = {
    rgl: {
      name: RGL_profile_data ? RGL_profile_data.name : null,
      isBanned: RGL_profile_data ? RGL_profile_data.status.isBanned : null,
      division: highest_rgl_division ? highest_rgl_division : null,
    },
    etf2l: {
      name: etf2l_name ? etf2l_name.player.name : null,
    },
  };

  return playerInfoToInsert;
}

async function UpdatePlayerRows() {
  const listOfSteamIDsInStorageThatMightNeedUpdating = [];

  for (let i = 0; i < playerRows.length; i++) {
    const steamID = playerRows[i].id.split("_")[1];

    const leagueElement = playerRows[i].firstChild;

    const playerInfoStorage = window.localStorage.getItem(steamID);
    let playerInfo;
    if (playerInfoStorage) {
      playerInfo = JSON.parse(playerInfoStorage);
      listOfSteamIDsInStorageThatMightNeedUpdating.push(steamID);
    } else {
      const playerInfoToInsert = await FetchPlayerInfo(steamID);

      window.localStorage.setItem(steamID, JSON.stringify(playerInfoToInsert));
      playerInfo = playerInfoToInsert;
    }

    UpdateETF2LName(steamID, playerInfo, leagueElement);
    UpdateRGLName(steamID, playerInfo, leagueElement);
    UpdateRGLDivision(playerInfo, leagueElement);
  }

  // Update all of them in local storage
  for (let i = 0; i < listOfSteamIDsInStorageThatMightNeedUpdating.length; i++) {
    const steamID = listOfSteamIDsInStorageThatMightNeedUpdating[i];
    const playerInfoToInsert = await FetchPlayerInfo(steamID);

    const a = window.localStorage.getItem(steamID);

    if (JSON.stringify(playerInfoToInsert) != a) {
      // console.log("mismatch. reloading.");
      window.location.reload(true);
    }

    window.localStorage.setItem(steamID, JSON.stringify(playerInfoToInsert));
    playerInfo = playerInfoToInsert;
  }
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
