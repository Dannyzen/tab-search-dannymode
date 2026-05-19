async function getMru() {
    const data = await browser.storage.local.get('mruTabs');
    return data.mruTabs || [];
}

async function setMru(mruTabs) {
    await browser.storage.local.set({ mruTabs });
}

// Initialize on install or startup
async function initMru() {
    const mru = await getMru();
    if (mru.length === 0) {
        const tabs = await browser.tabs.query({});
        await setMru(tabs.map(t => t.id));
    }
}
browser.runtime.onStartup.addListener(initMru);
browser.runtime.onInstalled.addListener(initMru);

browser.tabs.onActivated.addListener(async (activeInfo) => {
    let mru = await getMru();
    const tabId = activeInfo.tabId;
    mru = mru.filter(id => id !== tabId);
    mru.unshift(tabId);
    await setMru(mru);
});

browser.tabs.onCreated.addListener(async (tab) => {
    if (tab.id) {
        let mru = await getMru();
        mru.unshift(tab.id);
        await setMru(mru);
    }
});

browser.tabs.onRemoved.addListener(async (tabId) => {
    let mru = await getMru();
    mru = mru.filter(id => id !== tabId);
    await setMru(mru);
});
