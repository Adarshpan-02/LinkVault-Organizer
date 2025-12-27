/**
 * LinkVault - Website Link Organizer
 * A creative and innovative link management application
 * Data persisted in browser's localStorage
 */

// ===== Storage Manager =====
const StorageManager = {
    STORAGE_KEY: 'linkvault_links',

    getLinks() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    },

    saveLinks(links) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(links));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
};

// ===== App State =====
const AppState = {
    links: [],
    currentCategory: 'all',
    searchQuery: '',
    deleteTargetId: null,
    editingId: null
};

// ===== DOM Elements =====
const DOM = {
    // Main elements
    linksContainer: document.getElementById('linksContainer'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    
    // Buttons
    addLinkBtn: document.getElementById('addLinkBtn'),
    importBtn: document.getElementById('importBtn'),
    exportBtn: document.getElementById('exportBtn'),
    
    // File inputs
    bookmarkFile: document.getElementById('bookmarkFile'),
    jsonFile: document.getElementById('jsonFile'),
    csvFile: document.getElementById('csvFile'),
    textFile: document.getElementById('textFile'),
    
    // Stats
    totalLinks: document.getElementById('totalLinks'),
    favoritesCount: document.getElementById('favoritesCount'),
    learningCount: document.getElementById('learningCount'),
    workCount: document.getElementById('workCount'),
    personalCount: document.getElementById('personalCount'),
    
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    
    // Modal elements
    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    linkForm: document.getElementById('linkForm'),
    linkTitle: document.getElementById('linkTitle'),
    linkUrl: document.getElementById('linkUrl'),
    linkDescription: document.getElementById('linkDescription'),
    linkId: document.getElementById('linkId'),
    closeModal: document.getElementById('closeModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    
    // Delete modal
    deleteModalOverlay: document.getElementById('deleteModalOverlay'),
    cancelDelete: document.getElementById('cancelDelete'),
    confirmDelete: document.getElementById('confirmDelete'),
    
    // Import modal
    importModalOverlay: document.getElementById('importModalOverlay'),
    closeImportModal: document.getElementById('closeImportModal'),
    importBookmarks: document.getElementById('importBookmarks'),
    importJSON: document.getElementById('importJSON'),
    importCSV: document.getElementById('importCSV'),
    importText: document.getElementById('importText'),
    importPaste: document.getElementById('importPaste'),
    
    // Paste modal
    pasteModalOverlay: document.getElementById('pasteModalOverlay'),
    closePasteModal: document.getElementById('closePasteModal'),
    pasteForm: document.getElementById('pasteForm'),
    pasteUrls: document.getElementById('pasteUrls'),
    cancelPaste: document.getElementById('cancelPaste'),
    
    // Export modal
    exportModalOverlay: document.getElementById('exportModalOverlay'),
    closeExportModal: document.getElementById('closeExportModal'),
    exportJSON: document.getElementById('exportJSON'),
    exportText: document.getElementById('exportText'),
    exportCSV: document.getElementById('exportCSV'),
    exportHTML: document.getElementById('exportHTML'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ===== Utility Functions =====
function showToast(message) {
    const toastMessage = DOM.toast.querySelector('.toast-message');
    toastMessage.textContent = message;
    DOM.toast.classList.add('show');
    
    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return url;
    }
}

function isValidUrlForOpening(url) {
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}

function openLinkSafely(url) {
    if (isValidUrlForOpening(url)) {
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        showToast('Invalid URL protocol');
    }
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// ===== Link Operations =====
function addLink(linkData) {
    const newLink = {
        id: StorageManager.generateId(),
        title: linkData.title.trim(),
        url: linkData.url.trim(),
        category: linkData.category,
        description: linkData.description?.trim() || '',
        createdAt: new Date().toISOString(),
        favorite: false
    };
    
    AppState.links.unshift(newLink);
    StorageManager.saveLinks(AppState.links);
    renderLinks();
    updateStats();
    showToast('Link added successfully!');
}

function updateLink(id, linkData) {
    const index = AppState.links.findIndex(link => link.id === id);
    if (index !== -1) {
        AppState.links[index] = {
            ...AppState.links[index],
            title: linkData.title.trim(),
            url: linkData.url.trim(),
            category: linkData.category,
            description: linkData.description?.trim() || ''
        };
        StorageManager.saveLinks(AppState.links);
        renderLinks();
        updateStats();
        showToast('Link updated successfully!');
    }
}

function deleteLink(id) {
    AppState.links = AppState.links.filter(link => link.id !== id);
    StorageManager.saveLinks(AppState.links);
    renderLinks();
    updateStats();
    showToast('Link deleted successfully!');
}

function toggleFavorite(id) {
    const link = AppState.links.find(l => l.id === id);
    if (link) {
        link.favorite = !link.favorite;
        StorageManager.saveLinks(AppState.links);
        renderLinks();
        updateStats();
        showToast(link.favorite ? 'Added to favorites!' : 'Removed from favorites');
    }
}

// ===== Rendering Functions =====
function renderLinks() {
    let filteredLinks = AppState.links;
    
    // Filter by category
    if (AppState.currentCategory === 'favorites') {
        filteredLinks = filteredLinks.filter(link => link.favorite === true);
    } else if (AppState.currentCategory !== 'all') {
        filteredLinks = filteredLinks.filter(link => link.category === AppState.currentCategory);
    }
    
    // Filter by search query
    if (AppState.searchQuery) {
        const query = AppState.searchQuery.toLowerCase();
        filteredLinks = filteredLinks.filter(link => 
            link.title.toLowerCase().includes(query) ||
            link.url.toLowerCase().includes(query) ||
            link.description.toLowerCase().includes(query)
        );
    }
    
    // Show/hide empty state
    if (filteredLinks.length === 0) {
        DOM.linksContainer.innerHTML = '';
        DOM.emptyState.classList.add('show');
        
        // Update empty state message based on current category
        const emptyStateTitle = DOM.emptyState.querySelector('h3');
        const emptyStateText = DOM.emptyState.querySelector('p');
        
        if (emptyStateTitle && emptyStateText) {
            if (AppState.currentCategory === 'favorites') {
                emptyStateTitle.textContent = 'No favorites yet!';
                emptyStateText.textContent = 'Star your favorite links to see them here.';
            } else if (AppState.currentCategory !== 'all') {
                emptyStateTitle.textContent = `No ${AppState.currentCategory} links yet!`;
                emptyStateText.textContent = `Start building your ${AppState.currentCategory} collection by adding your first link.`;
            } else {
                emptyStateTitle.textContent = 'No links yet!';
                emptyStateText.textContent = 'Start building your link collection by adding your first link or importing your browser bookmarks.';
            }
        }
    } else {
        DOM.emptyState.classList.remove('show');
        DOM.linksContainer.innerHTML = filteredLinks.map((link, index) => createLinkCard(link, index)).join('');
    }
}

function createLinkCard(link, index) {
    const categoryIcon = {
        learning: '📚',
        work: '💼',
        personal: '🏠'
    };
    
    const isFavorite = link.favorite === true;
    const starClass = isFavorite ? 'active' : '';
    const starIcon = isFavorite ? '★' : '☆';
    
    return `
        <div class="link-card" style="animation-delay: ${index * 0.05}s">
            <div class="link-card-header">
                <button class="action-btn favorite-btn ${starClass}" onclick="toggleFavorite('${link.id}')" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    ${starIcon}
                </button>
                <h3 class="link-title">${escapeHtml(link.title)}</h3>
                <div class="link-actions">
                    <button class="action-btn edit-btn" onclick="openEditModal('${link.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" onclick="openDeleteModal('${link.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
            <a href="${escapeHtml(link.url)}" class="link-url" target="_blank" rel="noopener noreferrer">
                ${truncateText(extractDomain(link.url), 40)}
            </a>
            ${link.description ? `<p class="link-description">${escapeHtml(truncateText(link.description, 100))}</p>` : ''}
            <div class="link-footer">
                <span class="category-tag ${link.category}">
                    ${categoryIcon[link.category]} ${link.category}
                </span>
                <span class="link-date">${formatDate(link.createdAt)}</span>
            </div>
            <button class="open-link-btn" onclick="openLinkSafely('${escapeHtml(link.url)}')">
                🔗 Open Link
            </button>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStats() {
    const total = AppState.links.length;
    const favorites = AppState.links.filter(l => l.favorite === true).length;
    const learning = AppState.links.filter(l => l.category === 'learning').length;
    const work = AppState.links.filter(l => l.category === 'work').length;
    const personal = AppState.links.filter(l => l.category === 'personal').length;
    
    animateNumber(DOM.totalLinks, total);
    animateNumber(DOM.favoritesCount, favorites);
    animateNumber(DOM.learningCount, learning);
    animateNumber(DOM.workCount, work);
    animateNumber(DOM.personalCount, personal);
}

function animateNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    const increment = target > current ? 1 : -1;
    const duration = 300;
    const steps = Math.abs(target - current);
    
    if (steps === 0) return;
    
    const stepDuration = duration / steps;
    let value = current;
    
    const timer = setInterval(() => {
        value += increment;
        element.textContent = value;
        
        if (value === target) {
            clearInterval(timer);
        }
    }, stepDuration);
}

// ===== Modal Functions =====
function openAddModal() {
    AppState.editingId = null;
    DOM.modalTitle.textContent = 'Add New Link';
    DOM.linkForm.reset();
    DOM.linkId.value = '';
    
    // Pre-select 'personal' category
    const personalRadio = document.querySelector('input[name="category"][value="personal"]');
    if (personalRadio) {
        personalRadio.checked = true;
    }
    
    DOM.modalOverlay.classList.add('show');
    DOM.linkTitle.focus();
}

function openEditModal(id) {
    const link = AppState.links.find(l => l.id === id);
    if (!link) return;
    
    AppState.editingId = id;
    DOM.modalTitle.textContent = 'Edit Link';
    DOM.linkTitle.value = link.title;
    DOM.linkUrl.value = link.url;
    DOM.linkDescription.value = link.description;
    DOM.linkId.value = link.id;
    
    // Set category radio
    const categoryRadio = document.querySelector(`input[name="category"][value="${link.category}"]`);
    if (categoryRadio) categoryRadio.checked = true;
    
    DOM.modalOverlay.classList.add('show');
}

function closeAddModal() {
    DOM.modalOverlay.classList.remove('show');
    AppState.editingId = null;
}

function openDeleteModal(id) {
    AppState.deleteTargetId = id;
    DOM.deleteModalOverlay.classList.add('show');
}

function closeDeleteModal() {
    DOM.deleteModalOverlay.classList.remove('show');
    AppState.deleteTargetId = null;
}

// ===== Bookmark Import =====
function parseBookmarkFile(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const anchors = doc.querySelectorAll('a');
    const bookmarks = [];
    
    anchors.forEach(anchor => {
        const href = anchor.getAttribute('href');
        const title = anchor.textContent.trim();
        
        if (href && href.startsWith('http') && title) {
            bookmarks.push({
                title: title,
                url: href,
                category: 'personal'
            });
        }
    });
    
    return bookmarks;
}

// ===== JSON Import =====
function parseJSONFile(content) {
    try {
        const data = JSON.parse(content);
        const links = Array.isArray(data) ? data : (data.links || data.bookmarks || []);
        
        return links.map(item => ({
            title: item.title || item.name || extractTitleFromUrl(item.url),
            url: item.url || item.link || item.href,
            category: normalizeCategory(item.category || item.type || 'personal'),
            description: item.description || item.desc || ''
        })).filter(item => item.url && isValidUrl(item.url));
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return [];
    }
}

// ===== CSV Import =====
function parseCSVFile(content) {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Check if first line is header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('title') || firstLine.includes('url') || firstLine.includes('link');
    const startIndex = hasHeader ? 1 : 0;
    
    const links = [];
    
    for (let i = startIndex; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 1) {
            // Try to find URL in any column
            let url = '', title = '', category = 'personal', description = '';
            
            for (const val of values) {
                if (isValidUrl(val)) {
                    url = val;
                } else if (['learning', 'work', 'personal'].includes(val.toLowerCase())) {
                    category = val.toLowerCase();
                } else if (!title) {
                    title = val;
                } else {
                    description = val;
                }
            }
            
            if (url) {
                links.push({
                    title: title || extractTitleFromUrl(url),
                    url: url,
                    category: category,
                    description: description
                });
            }
        }
    }
    
    return links;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current.trim());
    return values;
}

// ===== Text File Import =====
function parseTextFile(content) {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const links = [];
    
    for (const line of lines) {
        const url = line.trim();
        if (isValidUrl(url)) {
            links.push({
                title: extractTitleFromUrl(url),
                url: url,
                category: 'personal',
                description: ''
            });
        }
    }
    
    return links;
}

// ===== Paste URLs Import =====
function parsePastedUrls(content, category) {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const links = [];
    
    for (const line of lines) {
        let url = line.trim();
        
        // Try to add https:// if missing protocol
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        if (isValidUrl(url)) {
            links.push({
                title: extractTitleFromUrl(url),
                url: url,
                category: category,
                description: ''
            });
        }
    }
    
    return links;
}

// ===== Helper Functions for Import =====
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function extractTitleFromUrl(url) {
    try {
        const urlObj = new URL(url);
        let title = urlObj.hostname.replace('www.', '');
        // Capitalize first letter
        return title.charAt(0).toUpperCase() + title.slice(1);
    } catch {
        return url;
    }
}

function normalizeCategory(category) {
    const cat = category.toLowerCase().trim();
    if (['learning', 'education', 'study', 'tutorial'].includes(cat)) return 'learning';
    if (['work', 'business', 'professional', 'job'].includes(cat)) return 'work';
    return 'personal';
}

function importLinks(links, sourceName) {
    let imported = 0;
    const existingUrls = new Set(AppState.links.map(l => l.url.toLowerCase()));
    
    links.forEach(link => {
        if (!existingUrls.has(link.url.toLowerCase())) {
            const newLink = {
                id: StorageManager.generateId(),
                title: link.title,
                url: link.url,
                category: link.category,
                description: link.description || '',
                createdAt: new Date().toISOString(),
                favorite: link.favorite === true
            };
            AppState.links.unshift(newLink);
            existingUrls.add(link.url.toLowerCase());
            imported++;
        }
    });
    
    if (imported > 0) {
        StorageManager.saveLinks(AppState.links);
        renderLinks();
        updateStats();
        showToast(`Successfully imported ${imported} link(s) from ${sourceName}!`);
    } else {
        showToast('No new links to import (duplicates skipped).');
    }
}

// ===== Export Functions =====
function checkExportable() {
    if (AppState.links.length === 0) {
        showToast('No links to export.');
        return false;
    }
    return true;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportAsJSON() {
    if (!checkExportable()) return;
    
    const exportData = {
        exportDate: new Date().toISOString(),
        totalLinks: AppState.links.length,
        links: AppState.links.map(link => ({
            title: link.title,
            url: link.url,
            category: link.category,
            description: link.description,
            createdAt: link.createdAt,
            favorite: link.favorite
        }))
    };
    
    const filename = `linkvault-export-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');
    closeExportModalFn();
    showToast(`Exported ${AppState.links.length} links as JSON!`);
}

function exportAsText() {
    if (!checkExportable()) return;
    
    let content = `LinkVault Export - ${new Date().toLocaleDateString()}\n`;
    content += `Total Links: ${AppState.links.length}\n`;
    content += '='.repeat(50) + '\n\n';
    
    const categories = ['learning', 'work', 'personal'];
    
    categories.forEach(category => {
        const categoryLinks = AppState.links.filter(l => l.category === category);
        if (categoryLinks.length > 0) {
            content += `[${category.toUpperCase()}]\n`;
            content += '-'.repeat(30) + '\n';
            categoryLinks.forEach(link => {
                content += `${link.title}\n`;
                content += `  URL: ${link.url}\n`;
                if (link.description) {
                    content += `  Description: ${link.description}\n`;
                }
                content += '\n';
            });
            content += '\n';
        }
    });
    
    const filename = `linkvault-export-${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(content, filename, 'text/plain');
    closeExportModalFn();
    showToast(`Exported ${AppState.links.length} links as Text!`);
}

function exportAsCSV() {
    if (!checkExportable()) return;
    
    let content = 'Title,URL,Category,Description,Created At\n';
    
    AppState.links.forEach(link => {
        const title = `"${link.title.replace(/"/g, '""')}"`;
        const url = `"${link.url}"`;
        const category = link.category;
        const description = `"${(link.description || '').replace(/"/g, '""')}"`;
        const createdAt = link.createdAt;
        
        content += `${title},${url},${category},${description},${createdAt}\n`;
    });
    
    const filename = `linkvault-export-${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(content, filename, 'text/csv');
    closeExportModalFn();
    showToast(`Exported ${AppState.links.length} links as CSV!`);
}

function exportAsHTML() {
    if (!checkExportable()) return;
    
    let content = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>LinkVault Export</H1>
<DL><p>\n`;
    
    const categories = ['learning', 'work', 'personal'];
    const categoryNames = { learning: 'Learning', work: 'Work', personal: 'Personal' };
    
    categories.forEach(category => {
        const categoryLinks = AppState.links.filter(l => l.category === category);
        if (categoryLinks.length > 0) {
            content += `    <DT><H3>${categoryNames[category]}</H3>\n    <DL><p>\n`;
            categoryLinks.forEach(link => {
                const timestamp = Math.floor(new Date(link.createdAt).getTime() / 1000);
                content += `        <DT><A HREF="${link.url}" ADD_DATE="${timestamp}">${link.title}</A>\n`;
            });
            content += `    </DL><p>\n`;
        }
    });
    
    content += `</DL><p>`;
    
    const filename = `linkvault-bookmarks-${new Date().toISOString().split('T')[0]}.html`;
    downloadFile(content, filename, 'text/html');
    closeExportModalFn();
    showToast(`Exported ${AppState.links.length} links as HTML Bookmarks!`);
}

// ===== Export Modal Functions =====
function openExportModal() {
    if (AppState.links.length === 0) {
        showToast('No links to export.');
        return;
    }
    DOM.exportModalOverlay.classList.add('show');
}

function closeExportModalFn() {
    DOM.exportModalOverlay.classList.remove('show');
}

// ===== Import Modal Functions =====
function openImportModal() {
    DOM.importModalOverlay.classList.add('show');
}

function closeImportModalFn() {
    DOM.importModalOverlay.classList.remove('show');
}

function openPasteModal() {
    closeImportModalFn();
    DOM.pasteModalOverlay.classList.add('show');
    DOM.pasteUrls.focus();
}

function closePasteModalFn() {
    DOM.pasteModalOverlay.classList.remove('show');
    DOM.pasteForm.reset();
}

// ===== Event Listeners =====
function initEventListeners() {
    // Add Link Button
    DOM.addLinkBtn.addEventListener('click', openAddModal);
    
    // Close Modal
    DOM.closeModal.addEventListener('click', closeAddModal);
    DOM.cancelBtn.addEventListener('click', closeAddModal);
    DOM.modalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.modalOverlay) closeAddModal();
    });
    
    // Form Submit
    DOM.linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const categoryInput = document.querySelector('input[name="category"]:checked');
        
        const linkData = {
            title: DOM.linkTitle.value,
            url: DOM.linkUrl.value,
            category: categoryInput ? categoryInput.value : 'personal',
            description: DOM.linkDescription.value
        };
        
        // Validate URL before saving
        if (!isValidUrl(linkData.url)) {
            showToast('Please enter a valid URL (must start with http:// or https://)');
            return;
        }
        
        if (AppState.editingId) {
            updateLink(AppState.editingId, linkData);
        } else {
            addLink(linkData);
        }
        
        closeAddModal();
    });
    
    // Delete Modal
    DOM.cancelDelete.addEventListener('click', closeDeleteModal);
    DOM.confirmDelete.addEventListener('click', () => {
        if (AppState.deleteTargetId) {
            deleteLink(AppState.deleteTargetId);
            closeDeleteModal();
        }
    });
    DOM.deleteModalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.deleteModalOverlay) closeDeleteModal();
    });
    
    // Category Tabs
    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.currentCategory = btn.dataset.category;
            renderLinks();
        });
    });
    
    // Search Input
    let searchTimeout;
    DOM.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            AppState.searchQuery = e.target.value.trim();
            renderLinks();
        }, 300);
    });
    
    // Import Button - Opens Import Modal
    DOM.importBtn.addEventListener('click', openImportModal);
    
    // Export Button
    DOM.exportBtn.addEventListener('click', openExportModal);
    
    // Export Modal
    DOM.closeExportModal.addEventListener('click', closeExportModalFn);
    DOM.exportModalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.exportModalOverlay) closeExportModalFn();
    });
    
    // Export Options
    DOM.exportJSON.addEventListener('click', exportAsJSON);
    DOM.exportText.addEventListener('click', exportAsText);
    DOM.exportCSV.addEventListener('click', exportAsCSV);
    DOM.exportHTML.addEventListener('click', exportAsHTML);
    
    // Import Modal
    DOM.closeImportModal.addEventListener('click', closeImportModalFn);
    DOM.importModalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.importModalOverlay) closeImportModalFn();
    });
    
    // Import Options
    DOM.importBookmarks.addEventListener('click', () => {
        closeImportModalFn();
        DOM.bookmarkFile.click();
    });
    
    DOM.importJSON.addEventListener('click', () => {
        closeImportModalFn();
        DOM.jsonFile.click();
    });
    
    DOM.importCSV.addEventListener('click', () => {
        closeImportModalFn();
        DOM.csvFile.click();
    });
    
    DOM.importText.addEventListener('click', () => {
        closeImportModalFn();
        DOM.textFile.click();
    });
    
    DOM.importPaste.addEventListener('click', openPasteModal);
    
    // File Input Handlers
    DOM.bookmarkFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showLoading();
            const reader = new FileReader();
            reader.onload = (event) => {
                const bookmarks = parseBookmarkFile(event.target.result);
                if (bookmarks.length > 0) {
                    importLinks(bookmarks, 'bookmarks');
                } else {
                    showToast('No valid bookmarks found in file.');
                }
                hideLoading();
            };
            reader.onerror = () => {
                showToast('Error reading file. Please try again.');
                hideLoading();
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    });
    
    DOM.jsonFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showLoading();
            const reader = new FileReader();
            reader.onload = (event) => {
                const links = parseJSONFile(event.target.result);
                if (links.length > 0) {
                    importLinks(links, 'JSON file');
                } else {
                    showToast('No valid links found in JSON file.');
                }
                hideLoading();
            };
            reader.onerror = () => {
                showToast('Error reading file. Please try again.');
                hideLoading();
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    });
    
    DOM.csvFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showLoading();
            const reader = new FileReader();
            reader.onload = (event) => {
                const links = parseCSVFile(event.target.result);
                if (links.length > 0) {
                    importLinks(links, 'CSV file');
                } else {
                    showToast('No valid links found in CSV file.');
                }
                hideLoading();
            };
            reader.onerror = () => {
                showToast('Error reading file. Please try again.');
                hideLoading();
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    });
    
    DOM.textFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showLoading();
            const reader = new FileReader();
            reader.onload = (event) => {
                const links = parseTextFile(event.target.result);
                if (links.length > 0) {
                    importLinks(links, 'text file');
                } else {
                    showToast('No valid URLs found in text file.');
                }
                hideLoading();
            };
            reader.onerror = () => {
                showToast('Error reading file. Please try again.');
                hideLoading();
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    });
    
    // Paste Modal
    DOM.closePasteModal.addEventListener('click', closePasteModalFn);
    DOM.cancelPaste.addEventListener('click', closePasteModalFn);
    DOM.pasteModalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.pasteModalOverlay) closePasteModalFn();
    });
    
    DOM.pasteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const urls = DOM.pasteUrls.value;
        const categoryInput = document.querySelector('input[name="pasteCategory"]:checked');
        const category = categoryInput ? categoryInput.value : 'personal';
        
        if (urls.trim()) {
            const links = parsePastedUrls(urls, category);
            if (links.length > 0) {
                importLinks(links, 'pasted URLs');
                closePasteModalFn();
            } else {
                showToast('No valid URLs found. Please check format.');
            }
        } else {
            showToast('Please enter at least one URL.');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modals
        if (e.key === 'Escape') {
            if (DOM.modalOverlay.classList.contains('show')) {
                closeAddModal();
            }
            if (DOM.deleteModalOverlay.classList.contains('show')) {
                closeDeleteModal();
            }
            if (DOM.importModalOverlay.classList.contains('show')) {
                closeImportModalFn();
            }
            if (DOM.pasteModalOverlay.classList.contains('show')) {
                closePasteModalFn();
            }
            if (DOM.exportModalOverlay.classList.contains('show')) {
                closeExportModalFn();
            }
        }
        
        // Ctrl+K to focus search (this is usually okay, as many web apps use it)
        if (e.ctrlKey && e.key === 'k' && !e.shiftKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            DOM.searchInput.focus();
        }
        
        // Alt+N to add new link
        if (e.altKey && e.key === 'n' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
            e.preventDefault();
            openAddModal();
        }
        
        // Alt+I to open import
        if (e.altKey && e.key === 'i' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
            e.preventDefault();
            openImportModal();
        }
        
        // Alt+E to export
        if (e.altKey && e.key === 'e' && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
            e.preventDefault();
            openExportModal();
        }
    });
}

// ===== Initialization =====
function init() {
    // Load links from storage
    AppState.links = StorageManager.getLinks();
    
    // Initialize event listeners
    initEventListeners();
    
    // Render links and update stats
    renderLinks();
    updateStats();
    
    console.log('LinkVault initialized successfully!');
}

// Make functions globally accessible for onclick handlers
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.toggleFavorite = toggleFavorite;
window.openLinkSafely = openLinkSafely;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
