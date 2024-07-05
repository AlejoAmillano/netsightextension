import { GoogleSafeBrowsingClient } from 'google-safe-browsing'
chrome.runtime.getManifest().GOOGLE_KEY
const client = new GoogleSafeBrowsingClient(`${process.env.GOOGLE_KEY}`)

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
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
    }
  )
})
