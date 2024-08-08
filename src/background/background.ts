import { GoogleSafeBrowsingClient } from 'google-safe-browsing'
chrome.runtime.getManifest().GOOGLE_KEY
const client = new GoogleSafeBrowsingClient(`${process.env.GOOGLE_KEY}`)

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'setToken') {
    chrome.storage.local.set({ token: request.token }, () => {
      sendResponse({ token: request.token })
    })
    return true
  } else if (request.action === 'setUser') {
    chrome.storage.local.set({ userId: request.userId }, () => {
      sendResponse({ userId: request.userId })
    })
    return true
  } else if (request.action === 'clearData') {
    chrome.storage.local.remove('token', function () {
      sendResponse({ token: null })
    })
    chrome.storage.local.remove('userId', function () {
      sendResponse({ userId: null })
    })
    return true
  } else if (request.action === 'getToken') {
    chrome.storage.local.get('token', (result) => {
      sendResponse({ token: result.token })
    })
    return true
  } else if (request.action === 'getUser') {
    chrome.storage.local.get('userId', (result: { userId: string }) => {
      sendResponse({ userId: result.userId })
    })
    return true
  } else if (request.action === 'checkUrl') {
    try {
      const isSafe = await client.isUrlSafe(request.url)
      chrome.storage.local.set({ isSafe: isSafe })
    } catch (error) {
      console.error(error)
      chrome.storage.local.set({ error: 'Failed to check URL' })
    }
    return true
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    checkIfBlocked(tabId, tab.url)
  }
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkIfBlocked(activeInfo.tabId, tab.url)
  })
})

function checkIfBlocked(tabId, url) {
  chrome.storage.local.get(['token', 'userId'], (result) => {
    const userId = result.userId
    const token = result.token
    const domain = new URL(url).hostname.replace(/^www\./, '')

    if (userId && token) {
      fetch(`${process.env.API_URL}scan/user/${userId}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const hasBlacklist = data.scans.some(
            (scan) => scan.url === domain && scan.blacklist === true
          )
          if (hasBlacklist) {
            console.log('page is blocked')
            chrome.tabs.update(tabId, {
              url: 'chrome://net-error/-106',
            })
          } else {
            console.log('page is not blocked')
          }
        })
        .catch((error) => {
          console.error('Error:', error)
        })
    } else {
      console.log('No user or token')
    }
  })
}
