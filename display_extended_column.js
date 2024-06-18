const getShowETF2L = async () => {
    const showETF2L = await browser.storage.local.get("showETF2L");
    return showETF2L.showETF2L;
}

const getShowRGL = async () => {
    const showRGL = await browser.storage.local.get("showRGL");
    return showRGL.showRGL;
}

const RGLDivisions = Object.freeze({
  None: 0,
  Newcomer: 1,
  Amateur: 2,
  Intermediate: 3,
  Main: 4,
  Advanced: 5,
  Invite: 6,
});

const RGLDivisionSpecs = Object.freeze({
  None: {
    backgroundColor: 'gray',
    textColor: 'black',
    shortenedName: 'NEW',
  },
  Newcomer: {
    backgroundColor: '#c54c36',
    textColor: 'white',
    shortenedName: 'NC',
  },
  Amateur: {
    backgroundColor: '#d0cd36',
    textColor: 'black',
    shortenedName: 'AM',
  },
  Intermediate: {
    backgroundColor: '#4ee16b',
    textColor: 'black',
    shortenedName: "IM"
  },
  Main: {
    backgroundColor: '#55d1ce',
    textColor: 'black',
    shortenedName: "MAIN"
  },
  Advanced: {
    backgroundColor: '#5f6bf6',
    textColor: 'white',
    shortenedName: "ADV"
  },
  Invite: {
    backgroundColor: '#e049b2',
    textColor: 'white',
    shortenedName: "INV"
  },
})
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

  await timer(400);

  const response = await fetch(uri);

  return response;
}

async function GetRGLProfile(steamID) {
  const uri = `https://api.rgl.gg/v0/profile/${steamID}`;

  // 325ms and below are too fast - it will exceed rate limit.
  await timer(350);
  // await timer(300);

  const response = await fetch(uri);

  if (response.status != 200) {
    console.log(response);
    return;
  }

  const data = await response.json();

  return data;
}

async function GetETF2LName(steamID) {
  const uriETF2L = `https://api-v2.etf2l.org/player/${steamID}`;
  
  await timer(300);

  const responseETF2L = await fetch(uriETF2L);

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

  const rglDivisionElement = document.createElement("span");

  rglDivisionElement.style.backgroundColor = RGLDivisionSpecs[highestSixesTeam].backgroundColor;
  rglDivisionElement.style.color = RGLDivisionSpecs[highestSixesTeam].textColor;

  rglDivisionElement.style.fontWeight = "bold";
  rglDivisionElement.style.minWidth = "40px";
  rglDivisionElement.style.display = "inline-block";
  rglDivisionElement.style.textAlign = "center";
  
  rglDivisionElement.innerHTML = RGLDivisionSpecs[highestSixesTeam].shortenedName;
  rglDivisionElement.style.padding = "6px";
  rglDivisionElement.style.marginLeft = "10px";

  leagueElement.appendChild(rglDivisionElement);
}

async function FetchPlayerInfo(steamID) {
  const RGL_profile_data = await GetRGLProfile(steamID);

  const etf2l_name = await GetETF2LName(steamID);

  const highest_rgl_division = await GetHighestGamemodeTeam("Sixes", steamID);

  const localPlayerInfo = window.localStorage.getItem(steamID) ?? null;

  const playerInfoToInsert = {
    rgl: {
      name: RGL_profile_data ? RGL_profile_data.name : (localPlayerInfo ? localPlayerInfo.name : null),
      isBanned: RGL_profile_data ? RGL_profile_data.status.isBanned : (localPlayerInfo ? localPlayerInfo.status.isBanned : null),
      division: highest_rgl_division ? highest_rgl_division : (localPlayerInfo ? localPlayerInfo.highest_rgl_division : null),
    },
    etf2l: {
      name: etf2l_name ? etf2l_name.player.name : (localPlayerInfo ? localPlayerInfo.player.name : null),
    },
  };

  return playerInfoToInsert;
}

async function UpdatePlayerRows() {
  const listOfSteamIDsInStorageThatMightNeedUpdating = [];
  const arrayOfPlayerRows = [...playerRows]
  const listOfSteamIDs = arrayOfPlayerRows.map((playerRow) => playerRow.id.split("_")[1]);

  for (let i = 0; i < listOfSteamIDs.length; i++) {
    const steamID = listOfSteamIDs[i];
    const leagueElement = arrayOfPlayerRows.find((playerRow) => playerRow.id.split("_")[1] == steamID).firstChild; 

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

    // true/false
    const showETF2L = await getShowETF2L();
    const showRGL = await getShowRGL();

    showETF2L && UpdateETF2LName(steamID, playerInfo, leagueElement);
    showRGL && UpdateRGLName(steamID, playerInfo, leagueElement);
    showRGL && UpdateRGLDivision(playerInfo, leagueElement);
  }

  // Update all of them in local storage
  for (let i = 0; i < listOfSteamIDsInStorageThatMightNeedUpdating.length; i++) {
    const steamID = listOfSteamIDsInStorageThatMightNeedUpdating[i];
    const playerInfoToInsert = await FetchPlayerInfo(steamID);

    const localPlayerData = window.localStorage.getItem(steamID);
    const fetchedPlayerData = JSON.stringify(playerInfoToInsert);
    if (fetchedPlayerData != localPlayerData) {
      // console.log("mismatch. reloading.");
      // console.log(`Recorded: ${localPlayerData}`)
      // console.log(`New one: ${fetchedPlayerData}`)
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
  const leagueData = document.createElement("td");
  // rglName.innerHTML = "Loading...";
  leagueData.innerHTML = "";
  playerRows[i].insertBefore(leagueData, playerRows[i].firstChild);
}

const mainElement = document.getElementsByClassName("container main")[0];
mainElement.style = "width: 1400px !important;";

UpdatePlayerRows();
