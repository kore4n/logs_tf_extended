const isFirefox = typeof browser !== "undefined";
const currentBrowser = isFirefox ? browser : chrome;

const sendMessageAndWait = async (type, steamID) => {
  const data = await currentBrowser.runtime.sendMessage({ type, steamID });
  return data;
};

const getShowETF2L = async () => {
  const showETF2L = await currentBrowser.storage.local.get("showETF2L");
  return showETF2L.showETF2L;
};

const getShowRGL = async () => {
  const showRGL = await currentBrowser.storage.local.get("showRGL");
  return showRGL.showRGL;
};

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
    backgroundColor: "gray",
    textColor: "black",
    shortenedName: "NEW",
  },
  Newcomer: {
    backgroundColor: "#c54c36",
    textColor: "white",
    shortenedName: "NC",
  },
  Amateur: {
    backgroundColor: "#d0cd36",
    textColor: "black",
    shortenedName: "AM",
  },
  Intermediate: {
    backgroundColor: "#4ee16b",
    textColor: "black",
    shortenedName: "IM",
  },
  Main: {
    backgroundColor: "#55d1ce",
    textColor: "black",
    shortenedName: "MAIN",
  },
  Advanced: {
    backgroundColor: "#5f6bf6",
    textColor: "white",
    shortenedName: "ADV",
  },
  Invite: {
    backgroundColor: "#e049b2",
    textColor: "white",
    shortenedName: "INV",
  },
});
const timer = (ms) => new Promise((res) => setTimeout(res, ms));

// gamemode = "Sixes" or "Highlander"
async function GetHighestGamemodeTeam(gamemode, steamID) {
  const data = await sendMessageAndWait("rgl_past_teams", steamID);
  if (!data) return "";

  const pastTeams = data;

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

async function UpdateETF2L() {
  for (let i = 0; i < playerRows.length; i++) {
    const steamID = playerRows[i].id.split("_")[1];
    const resETF2L = await sendMessageAndWait("etf2l_profile", steamID);
    if (!resETF2L) return;

    const leagueElement = playerRows[i].firstChild;

    // Get rid of 'Loading...' message
    leagueElement.innerHTML = "";

    if (resETF2L.status != 200) {
      console.log(resETF2L);
      continue;
    }

    // const data = await resETF2L.json();
    const data = await resETF2L;
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

  if (!RGLDivisionSpecs[highestSixesTeam]) {
    console.log(playerInfo.rgl.name);
    console.log(`highestSixesTeam: ${highestSixesTeam}`);
    console.log(JSON.stringify(!RGLDivisionSpecs[highestSixesTeam], null, 2));
    return;
  }

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
  const resRGL = await sendMessageAndWait("rgl_profile", steamID);
  const resETF2LName = await sendMessageAndWait("etf2l_profile", steamID);
  const RGL_profile_data = resRGL;
  const etf2l_name = resETF2LName;

  const highest_rgl_division = await GetHighestGamemodeTeam("Sixes", steamID);

  const localPlayerInfo = window.localStorage.getItem(steamID) ?? null;

  const localPlayerInfoJson = JSON.parse(localPlayerInfo);

  const playerInfoToInsert = {
    rgl: {
      name: RGL_profile_data ? RGL_profile_data.name : localPlayerInfoJson ? localPlayerInfoJson.rgl.name : null,
      isBanned: RGL_profile_data
        ? RGL_profile_data.status.isBanned
        : localPlayerInfoJson
        ? localPlayerInfoJson.rgl.isBanned
        : false,
      division: highest_rgl_division
        ? highest_rgl_division
        : localPlayerInfoJson
        ? localPlayerInfoJson.rgl.division
        : "None",
    },
    etf2l: {
      name: etf2l_name ? etf2l_name.player.name : localPlayerInfoJson ? localPlayerInfoJson.etf2l.name : null,
    },
  };

  return playerInfoToInsert;
}

async function UpdatePlayerRows() {
  const listOfSteamIDsInStorageThatMightNeedUpdating = [];
  const arrayOfPlayerRows = [...playerRows];
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
    if (localPlayerData != null && fetchedPlayerData != localPlayerData) {
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
