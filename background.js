browser.runtime.onInstalled.addListener(async () => {
    await browser.storage.local.set({ showRGL: true });
    await browser.storage.local.set({ showETF2L: true });
})
