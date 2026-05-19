let allItems = [];
let filteredItems = [];
let selectedIndex = 0;
let currentWindowId = null;
const containerCache = new Map();

const searchBox = document.getElementById('search-box');
const clearSearchBtn = document.getElementById('clear-search');
const tabList = document.getElementById('tab-list');

function timeAgo(epochMs) {
    const seconds = Math.floor((new Date() - new Date(epochMs)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function highlightText(text, query) {
    if (!text) return '';
    if (!query) return escapeHTML(text);
    const lowerText = text.toLowerCase();
    const startIndex = lowerText.indexOf(query);
    if (startIndex === -1) return escapeHTML(text);
    
    const before = escapeHTML(text.slice(0, startIndex));
    const match = escapeHTML(text.slice(startIndex, startIndex + query.length));
    const after = escapeHTML(text.slice(startIndex + query.length));
    
    return `${before}<b class="highlight">${match}</b>${after}`;
}

async function getContainerInfo(cookieStoreId) {
    if (!cookieStoreId || cookieStoreId === 'firefox-default' || cookieStoreId === 'firefox-private') {
        return null;
    }
    if (containerCache.has(cookieStoreId)) {
        return containerCache.get(cookieStoreId);
    }
    try {
        const identity = await browser.contextualIdentities.get(cookieStoreId);
        containerCache.set(cookieStoreId, identity);
        return identity;
    } catch (e) {
        return null;
    }
}

async function init() {
    const currentWindow = await browser.windows.getCurrent();
    currentWindowId = currentWindow.id;

    const tabs = await browser.tabs.query({});
    const data = await browser.storage.local.get('mruTabs');
    const mruTabs = data.mruTabs || [];
    const mruOrder = new Map();
    mruTabs.forEach((id, index) => mruOrder.set(id, index));

    tabs.sort((a, b) => {
        const orderA = mruOrder.has(a.id) ? mruOrder.get(a.id) : Infinity;
        const orderB = mruOrder.has(b.id) ? mruOrder.get(b.id) : Infinity;
        return orderA - orderB;
    });

    const openItems = tabs.map(t => ({...t, itemType: 'open'}));

    const sessions = await browser.sessions.getRecentlyClosed();
    const closedItems = sessions
        .filter(s => s.tab)
        .map(s => ({...s.tab, sessionId: s.tab.sessionId, itemType: 'closed', lastModified: s.lastModified}));

    allItems = [...openItems, ...closedItems];
    
    if (openItems.length > 1) {
        selectedIndex = 1; 
    }

    filteredItems = [...allItems];
    await renderTabs();
    
    searchBox.focus();
}

function createIcon(svgString, className) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.documentElement;
    if (className) svg.setAttribute('class', className);
    return svg;
}

async function renderTabs() {
    tabList.innerHTML = '';
    const query = searchBox.value.trim().toLowerCase();

    if (filteredItems.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No results found';
        li.style.padding = '12px';
        li.style.textAlign = 'center';
        li.style.color = 'var(--url-color)';
        li.setAttribute('role', 'option');
        tabList.appendChild(li);
        searchBox.removeAttribute('aria-activedescendant');
        return;
    }

    let hasRenderedOpenHeader = false;
    let hasRenderedClosedHeader = false;
    let hasRenderedBookmarkHeader = false;

    for (let index = 0; index < filteredItems.length; index++) {
        const item = filteredItems[index];

        if (item.itemType === 'fallback') {
            const li = document.createElement('li');
            li.className = `search-fallback ${index === selectedIndex ? 'selected' : ''}`;
            li.id = `tab-item-${index}`;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', index === selectedIndex ? 'true' : 'false');
            if (index === selectedIndex) searchBox.setAttribute('aria-activedescendant', li.id);
            
            li.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                            <span>Search Google for "<b>${escapeHTML(item.query)}</b>"</span>`;
            li.addEventListener('click', () => activateItem(item));
            tabList.appendChild(li);
            continue;
        }

        if (item.itemType === 'open' && !hasRenderedOpenHeader && searchBox.value.trim() !== '') {
            const header = document.createElement('li');
            header.className = 'section-header';
            header.textContent = 'Open Tabs';
            tabList.appendChild(header);
            hasRenderedOpenHeader = true;
        }

        if (item.itemType === 'closed' && !hasRenderedClosedHeader) {
            const header = document.createElement('li');
            header.className = 'section-header';
            header.textContent = 'Recently Closed';
            tabList.appendChild(header);
            hasRenderedClosedHeader = true;
        }

        if (item.itemType === 'bookmark' && !hasRenderedBookmarkHeader) {
            const header = document.createElement('li');
            header.className = 'section-header';
            header.textContent = 'Bookmarks';
            tabList.appendChild(header);
            hasRenderedBookmarkHeader = true;
        }

        const li = document.createElement('li');
        li.className = `tab-item ${index === selectedIndex ? 'selected' : ''}`;
        li.id = `tab-item-${index}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', index === selectedIndex ? 'true' : 'false');
        
        if (index === selectedIndex) {
            searchBox.setAttribute('aria-activedescendant', li.id);
        }
        
        const img = document.createElement('img');
        img.className = 'tab-icon';
        const defaultIcon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239aa0a6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
        img.src = item.favIconUrl || defaultIcon;
        img.onerror = () => { img.src = defaultIcon; };

        const infoDiv = document.createElement('div');
        infoDiv.className = 'tab-info';
        
        const titleRow = document.createElement('div');
        titleRow.className = 'tab-title-row';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'tab-title';
        titleSpan.innerHTML = highlightText(item.title, query);
        titleRow.appendChild(titleSpan);

        if (item.pinned) {
            const pinBadge = document.createElement('span');
            pinBadge.className = 'container-badge';
            pinBadge.textContent = 'Pinned';
            pinBadge.style.borderColor = 'var(--url-color)';
            pinBadge.style.color = 'var(--url-color)';
            titleRow.appendChild(pinBadge);
        }

        if (item.windowId && item.windowId !== currentWindowId && item.itemType === 'open') {
            const winBadge = document.createElement('span');
            winBadge.className = 'window-badge';
            winBadge.textContent = 'Other Window';
            titleRow.appendChild(winBadge);
        }

        const containerInfo = await getContainerInfo(item.cookieStoreId);
        if (containerInfo) {
            const badge = document.createElement('span');
            badge.className = 'container-badge';
            badge.textContent = containerInfo.name;
            badge.style.color = containerInfo.colorCode;
            badge.style.borderColor = containerInfo.colorCode;
            titleRow.appendChild(badge);
        }

        const urlSpan = document.createElement('span');
        urlSpan.className = 'tab-url';
        urlSpan.innerHTML = highlightText(item.url, query);
        
        infoDiv.appendChild(titleRow);
        infoDiv.appendChild(urlSpan);

        li.appendChild(img);
        li.appendChild(infoDiv);

        if (item.itemType === 'closed' && item.lastModified) {
            const timeSpan = document.createElement('span');
            timeSpan.className = 'timestamp';
            const ms = item.lastModified > 1e11 ? item.lastModified : item.lastModified * 1000;
            timeSpan.textContent = timeAgo(ms);
            li.appendChild(timeSpan);
        }

        if (item.audible || (item.mutedInfo && item.mutedInfo.muted)) {
            const isMuted = item.mutedInfo && item.mutedInfo.muted;
            const audioSvg = isMuted 
                ? `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`
                : `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
            
            const audioIcon = createIcon(audioSvg, 'audio-icon' + (isMuted ? ' muted' : ''));
            audioIcon.title = isMuted ? 'Unmute tab (Alt+M)' : 'Mute tab (Alt+M)';
            audioIcon.style.cursor = 'pointer';
            
            audioIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMute(item);
            });
            li.appendChild(audioIcon);
        }

        if (item.itemType === 'open') {
            const closeBtn = document.createElement('div');
            closeBtn.className = 'close-btn';
            closeBtn.title = 'Close tab (Delete)';
            closeBtn.setAttribute('aria-label', 'Close tab');
            const closeSvg = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
            closeBtn.appendChild(createIcon(closeSvg));
            
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeTab(item.id);
            });
            li.appendChild(closeBtn);
        }

        li.addEventListener('click', () => {
            activateItem(item);
        });

        tabList.appendChild(li);
    }

    const selectedItem = tabList.querySelector('.selected');
    if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
    }
}

searchBox.addEventListener('input', async (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query === '') {
        clearSearchBtn.style.display = 'none';
        filteredItems = [...allItems];
        selectedIndex = filteredItems.length > 1 && filteredItems[0].itemType === 'open' ? 1 : 0;
    } else {
        clearSearchBtn.style.display = 'block';
        
        filteredItems = allItems.filter(item => {
            return (item.title && item.title.toLowerCase().includes(query)) ||
                   (item.url && item.url.toLowerCase().includes(query));
        });
        
        try {
            const bookmarks = await browser.bookmarks.search(query);
            const bms = bookmarks.filter(b => b.url).slice(0, 5).map(b => ({
                ...b, 
                itemType: 'bookmark', 
                favIconUrl: null 
            }));
            filteredItems = [...filteredItems, ...bms];
        } catch(e) {} // Ignore if bookmarks permission fails

        filteredItems.push({ itemType: 'fallback', query: query });
        selectedIndex = 0;
    }
    await renderTabs();
});

clearSearchBtn.addEventListener('click', async () => {
    searchBox.value = '';
    searchBox.focus();
    searchBox.dispatchEvent(new Event('input'));
});

function updateSelection(oldIndex, newIndex) {
    const oldLi = document.getElementById(`tab-item-${oldIndex}`);
    if (oldLi) {
        oldLi.classList.remove('selected');
        oldLi.setAttribute('aria-selected', 'false');
    }
    
    const newLi = document.getElementById(`tab-item-${newIndex}`);
    if (newLi) {
        newLi.classList.add('selected');
        newLi.setAttribute('aria-selected', 'true');
        searchBox.setAttribute('aria-activedescendant', newLi.id);
        newLi.scrollIntoView({ block: 'nearest' });
    }
}

document.addEventListener('keydown', async (e) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const oldIndex = selectedIndex;
        selectedIndex = (selectedIndex + 1) % filteredItems.length;
        updateSelection(oldIndex, selectedIndex);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const oldIndex = selectedIndex;
        selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
        updateSelection(oldIndex, selectedIndex);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedItem = filteredItems[selectedIndex];
        if (selectedItem) {
            if (e.shiftKey && selectedItem.itemType === 'open') {
                if (selectedItem.windowId !== currentWindowId) {
                    await browser.tabs.move(selectedItem.id, { windowId: currentWindowId, index: -1 });
                }
                await browser.tabs.update(selectedItem.id, { active: true });
                window.close();
            } else {
                activateItem(selectedItem);
            }
        }
    } else if (e.key === 'Delete') {
        const selectedItem = filteredItems[selectedIndex];
        if (selectedItem && selectedItem.itemType === 'open') {
            e.preventDefault();
            closeTab(selectedItem.id);
        }
    } else if (e.key.toLowerCase() === 'm' && e.altKey) {
        e.preventDefault();
        const selectedItem = filteredItems[selectedIndex];
        if (selectedItem && selectedItem.itemType === 'open') {
            toggleMute(selectedItem);
        }
    } else if (e.key.toLowerCase() === 'p' && e.altKey) {
        e.preventDefault();
        const selectedItem = filteredItems[selectedIndex];
        if (selectedItem && selectedItem.itemType === 'open') {
            togglePin(selectedItem);
        }
    }
});

async function activateItem(item) {
    if (item.itemType === 'open') {
        await browser.tabs.update(item.id, { active: true });
        await browser.windows.update(item.windowId, { focused: true });
        window.close();
    } else if (item.itemType === 'closed') {
        await browser.sessions.restore(item.sessionId);
        window.close();
    } else if (item.itemType === 'bookmark') {
        await browser.tabs.create({ url: item.url });
        window.close();
    } else if (item.itemType === 'fallback') {
        await browser.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(item.query)}` });
        window.close();
    }
}

async function closeTab(tabId) {
    await browser.tabs.remove(tabId);
    allItems = allItems.filter(i => i.id !== tabId);
    searchBox.dispatchEvent(new Event('input'));
}

async function toggleMute(item) {
    const newMutedState = !(item.mutedInfo && item.mutedInfo.muted);
    await browser.tabs.update(item.id, { muted: newMutedState });
    
    item.mutedInfo = item.mutedInfo || {};
    item.mutedInfo.muted = newMutedState;
    
    const ref = allItems.find(i => i.id === item.id);
    if (ref) {
        ref.mutedInfo = ref.mutedInfo || {};
        ref.mutedInfo.muted = newMutedState;
    }
    await renderTabs();
}

async function togglePin(item) {
    const newPinnedState = !item.pinned;
    await browser.tabs.update(item.id, { pinned: newPinnedState });
    
    item.pinned = newPinnedState;
    const ref = allItems.find(i => i.id === item.id);
    if (ref) ref.pinned = newPinnedState;
    
    await renderTabs();
}

init();
