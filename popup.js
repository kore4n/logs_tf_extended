const isFirefox = typeof browser !== "undefined";
const currentBrowser = isFirefox ? browser : chrome;

async function setETF2LValue(newValue) {
  await currentBrowser.storage.local.set({ showETF2L: newValue });
}

async function setRGLValue(newValue) {
  await currentBrowser.storage.local.set({ showRGL: newValue });
}

async function setGetHighestDivision(newValue) {
  await currentBrowser.storage.local.set({ getHighestDivisionPlayed: newValue });
}

async function populateETF2LCheckbox(etf2lInput) {
  const showETF2L = await currentBrowser.storage.local.get("showETF2L");
  etf2lInput.checked = showETF2L.showETF2L;
}

async function populateRGLCheckbox(rglInput) {
  const showRGL = await currentBrowser.storage.local.get("showRGL");
  rglInput.checked = showRGL.showRGL;
}

async function populateHighestDivisionPlayedToggle(getHighestDivisonPlayedInput) {
  const getHighestDivisionPlayed = await currentBrowser.storage.local.get("getHighestDivisionPlayed");
  getHighestDivisonPlayedInput.checked = getHighestDivisionPlayed.getHighestDivisionPlayed;
}

document.addEventListener("DOMContentLoaded", async () => {
  const etf2lInput = document.getElementById("etf2l-input");
  const rglInput = document.getElementById("rgl-input");
  const getHighestDivisionPlayedInput = document.getElementById("get-highest-division-toggle");

  populateETF2LCheckbox(etf2lInput);
  populateRGLCheckbox(rglInput);
  populateHighestDivisionPlayedToggle(getHighestDivisionPlayedInput);

  etf2lInput.addEventListener("change", (e) => setETF2LValue(e.target.checked));
  rglInput.addEventListener("change", (e) => setRGLValue(e.target.checked));
  getHighestDivisionPlayedInput.addEventListener("change", (e) => setGetHighestDivision(e.target.checked));
});
