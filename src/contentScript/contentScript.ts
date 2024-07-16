console.log('script')
const token = localStorage.getItem('token')
const userId =
  localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).id

console.log(token)
console.log(userId)

if (token && userId) {
  chrome.runtime.sendMessage({
    action: 'setToken',
    token: token,
  })
  chrome.runtime.sendMessage({
    action: 'setUser',
    userId: userId,
  })
} else {
  chrome.runtime.sendMessage({ action: 'clearData' })
}
