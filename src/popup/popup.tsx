import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import './popup.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserCircle,
  faCheck,
  faCircleNotch,
  faX,
} from '@fortawesome/free-solid-svg-icons'

const App: React.FC<{}> = () => {
  const buttonRef = React.createRef<HTMLButtonElement>()
  const submitRef = React.createRef<HTMLSpanElement>()
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = document.getElementById('current-url')
    const url = new URL(tabs[0].url)
    const domain = url.hostname.replace(/^www\./, '')

    currentUrl.textContent = domain
  })

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Obtener el scanId desde localStorage
    console.log('this message is showing')
    chrome.storage.local.get(['token', 'userId'], (result) => {
      if (result.token && result.userId) {
        const userId = result.userId
        const token = result.token

        console.log(token)

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
            console.log(data)
            if (data.blacklist) {
              chrome.tabs.update(tabId, {
                url: 'chrome://net-error/-106',
              })
            }
          })
          .catch((error) => {
            console.error('Error:', error)
          })
      } else {
        console.log('No user or token')
      }
    })
  })

  function toggleClass(event: React.TransitionEvent<HTMLButtonElement>) {
    event.currentTarget.classList.toggle('active')
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.currentTarget.classList.toggle('active')

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = new URL(tabs[0].url).hostname
      chrome.runtime.sendMessage({ action: 'checkUrl', url: url })

      chrome.storage.local.get(['token', 'userId'], (result) => {
        if (result.token && result.userId) {
          chrome.storage.local.get('isSafe', (isSafeResult) => {
            let resultScan
            let bloqued
            if (isSafeResult.isSafe) {
              resultScan = 'Safe'
              bloqued = false
            } else {
              resultScan = 'Phishing'
              bloqued = true
            }

            const newScan = {
              userId: result.userId,
              url: url,
              result: resultScan,
              blacklist: bloqued,
            }

            fetch(`${process.env.API_URL}scan/save`, {
              method: 'POST',
              body: JSON.stringify(newScan),
              headers: {
                'Content-Type': 'application/json',
                Authorization: result.token,
              },
            })
              .then((response) => {
                console.log(response.json())
              })
              .catch((error) => {
                console.error('Error:' + error)
              })
          })
        } else {
          console.error('No token or user')
        }
      })
    })
  }

  function addClass(event: React.TransitionEvent<HTMLButtonElement>) {
    event.currentTarget.classList.add('finished')
    chrome.storage.local.get('isSafe', (result) => {
      if (result.isSafe) {
        document.getElementById('result').textContent = 'Safe from phishing :)'
        buttonRef.current.style.backgroundColor = '#34c759'
        document.getElementById('check').style.display = 'block'
        document.getElementById('cross').style.display = 'none'
      } else {
        document.getElementById('result').textContent =
          'Malicious URL detected!'
        buttonRef.current.style.backgroundColor = '#c73434'
        document.getElementById('check').style.display = 'none'
        document.getElementById('cross').style.display = 'block'
      }
    })
  }

  function handleTransitionEnd(
    event: React.TransitionEvent<HTMLButtonElement>
  ) {
    toggleClass(event)
    addClass(event)
  }

  function resetButton(event: React.MouseEvent<HTMLButtonElement>) {
    this.classList.remove('active', 'finished')
  }

  useEffect(() => {
    const profileIcon = document.getElementById('profile')

    if (profileIcon) {
      profileIcon.addEventListener('click', async () => {
        window.open('https://netsight.vercel.app', '_blank')
      })
    }

    return () => {
      if (profileIcon) {
        profileIcon.removeEventListener('click', () => {})
      }
    }
  }, [])

  return (
    <div>
      <header>
        <div className="logo">
          <img src="icon.png" alt="Logo" />
          <h3>NETSIGHT</h3>
        </div>
        <a id="profile">
          <FontAwesomeIcon className="material-icon" icon={faUserCircle} />
        </a>
      </header>
      <div className="main">
        <div className="popup-container">
          <span id="current-url"></span>
          <button
            className="button"
            onClick={handleClick}
            onTransitionEnd={handleTransitionEnd}
            ref={buttonRef}
          >
            <span className="submit" ref={submitRef}>
              Analyze page
            </span>
            <span className="loading">
              <FontAwesomeIcon icon={faCircleNotch} spin />
            </span>
            <span className="check" id="check">
              <FontAwesomeIcon icon={faCheck} />
            </span>
            <span className="cross" id="cross">
              <FontAwesomeIcon icon={faX} />
            </span>
          </button>
          <span id="result"></span>
        </div>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.render(<App />, root)
