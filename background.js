const isFirefox = typeof browser !== "undefined";
const currentBrowser = isFirefox ? browser : chrome;

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

async function GetRGLPastTeams(steamID) {
  const uri = `https://api.rgl.gg/v0/profile/${steamID}/teams`;

  await timer(1500);

  const response = await fetch(uri);
  return await response.json();
}

async function GetRGLProfile(steamID) {
  const uri = `https://api.rgl.gg/v0/profile/${steamID}`;

  await timer(1500);

  const response = await fetch(uri);

  if (!response.ok) {
    console.log(response);
    return;
  }
  return await response.json();
}

async function GetETF2LName(steamID) {
  const uriETF2L = `https://api-v2.etf2l.org/player/${steamID}`;

  await timer(500);

  const response = await fetch(uriETF2L);

  if (!response.ok) {
    console.log(response);
    return;
  }

  return await response.json();
}

async function GetAllData(steamID, messageType) {
  let data;
  if (messageType === "rgl_profile") {
    data = await GetRGLProfile(steamID);
  } else if (messageType === "etf2l_profile") {
    data = await GetETF2LName(steamID);
  } else if (messageType === "rgl_past_teams") {
    data = await GetRGLPastTeams(steamID);
  }
  return data;
}

currentBrowser.runtime.onInstalled.addListener(async () => {
  await currentBrowser.storage.local.set({ showRGL: true });
  await currentBrowser.storage.local.set({ showETF2L: true });
});

currentBrowser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  GetAllData(message.steamID, message.type).then((data) => sendResponse(data));
  return true;
});
