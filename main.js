let habiticaApiKey = ''
let habiticaUserId = ''
const useApi = true
// minimize requests (no daily cron, no incrementing)
const debugMode = false
let makeRequests = false
const localStorageApiKey = 'habits-habitica-api-key'
const localStorageUserIdKey = 'habits-habitica-user-id-key'
const canVibrate = 'vibrate' in navigator
// in ms: matches ".fadecolor duration" & time to vibrate on android
const timeToTriggerIncrement = 500
function onLoad() {
  determineApiKey()
  function determineApiKey() {
    if (!useApi) {
      return
    }
    const key = localStorage.getItem(localStorageApiKey)
    if (key) {
      habiticaApiKey = key
    }
    const id = localStorage.getItem(localStorageUserIdKey)
    if (id) {
      habiticaUserId = id
    }
    if (!key || !id) {
      // wait for user input... maybe communicate it?
      document.querySelector('.input').style.display = 'block'
      makeRequests = false
    } else {
      makeRequests = true
    }
  }
  if (useApi) {
    if (!makeRequests) {
      return
    }
    processStartOfDay().then(() => {
      getHabiticaUserData().then((userData) => {
        data = userData
        populateHabits()
      })
    })
  } else {
    populateHabits()
  }
}
function populateHabits() {
  function getWrapper(index) {
    return [...document.querySelectorAll('.habit')][index]
  }
  function getCounter(index) {
    return [...document.querySelectorAll('.counter')][index]
  }
  function getHabit(index) {
    return [...document.querySelectorAll('.text')][index]
  }
  function getCircle(index) {
    return [...document.querySelectorAll('.circle')][index]
  }
  let mouseDownTime = new Date()
  let active = undefined
  const habits = new Set()
  const incremented = new Set()
  const confirmed = new Set()
  function incrementCounter(index) {
    const difference = new Date().getTime() - mouseDownTime.getTime()
    const circle = getCircle(index)
    if (active !== circle || incremented.has(circle)) {
      return
    }
    circle.classList.add('paused')
    circle.classList.remove('fadecolor')

    if (difference >= timeToTriggerIncrement) {
      // Should this increment beyond the daily count...?
      const element = getCounter(index)
      element.textContent++
      element.classList.add('completed')
      circle.classList.add('completed')
      incremented.add(circle)
      if (canVibrate) {
        navigator.vibrate(150)
      }
      if (useApi && !debugMode) {
        const promise = incrementViaApi(index)
        promise.then((incremented) => {
          if (!incremented) {
            decrementCounter(index)
          } else {
            confirmed.add(circle)
            checkForCompletedDay()
          }
        })
      }
    }
    active = undefined
  }
  function checkForCompletedDay() {
    if (confirmed.size === habits.size) {
      document.querySelector('body').classList.add('complete')
    } else {
      document.querySelector('body').classList.remove('complete')
    }
  }
  function decrementCounter(index) {
    const element = getCounter(index)
    element.textContent--
    element.classList.remove('completed')
    const circle = getCircle(index)
    circle.classList.remove('completed')
    incremented.delete(circle)
    confirmed.delete(circle)
  }
  function mouseDownGetter(circle, index) {
    return () => {
      if (incremented.has(circle)) {
        return
      }
      if (canVibrate) {
        navigator.vibrate(1)
      }
      mouseDownTime = new Date()
      active = circle
      circle.classList.remove('paused')
      circle.classList.add('fadecolor')
      setTimeout(() => {
        incrementCounter(index)
      }, timeToTriggerIncrement)
    }
  }
  function indexGetter(index, data, circle) {
    if (!data) {
      return
    }
    const element = getCounter(index)
    const streaks = data.streak
    element.textContent = streaks
    const habit = getHabit(index)
    habit.textContent = data.text
    return () => {
      return incrementCounter(index)
    }
  }
  const circles = [...document.querySelectorAll('.circle')]
  let index = 0
  const count = data.data.length
  for (const circle of circles) {
    if (index >= count) {
      getWrapper(index).classList.add('hidden')
      continue
    }
    habits.add(circle)
    getWrapper(index).classList.remove('hidden')
    circle.addEventListener('mousedown', mouseDownGetter(circle, index))
    document.addEventListener('mouseup', indexGetter(index, data.data[index], circle))
    circle.addEventListener('touchstart', mouseDownGetter(circle, index))
    window.addEventListener('touchend', indexGetter(index, data.data[index], circle))
    const habit = data.data[index]
    if (habit.completed) {
      const element = getCounter(index)
      element.classList.add('completed')
      circle.classList.add('completed')
      incremented.add(circle)
      confirmed.add(circle)
    }
    index++
  }
  checkForCompletedDay()
}
function submitApiKey() {
  habiticaApiKey = document.querySelector('#key').value
  habiticaUserIdKey = document.querySelector('#user').value
  localStorage.setItem(localStorageApiKey, habiticaApiKey)
  localStorage.setItem(localStorageUserIdKey, habiticaUserIdKey)
  document.querySelector('.input').style.display = 'none'
  onLoad()
}
async function processStartOfDay() {
  try {
    if (debugMode) {
      return
    }
    const response = await fetch('https://habitica.com/api/v3/cron', {
        method: "POST",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
          "x-api-user": habiticaUserId,
          "x-api-key": habiticaApiKey,
          "x-client": `${habiticaUserId}-HabitWebApp`,
        },
      });
    if (!response.ok) {
      throw new Error('Received an error in start of day request')
    }
    return response.json()
  } catch {
    alert('Unable to ping habitica cron.')
  }
}
async function getHabiticaUserData() {
  try {
    const response = await fetch('https://habitica.com/api/v3/tasks/user', {
      method: "GET",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        "x-api-user": habiticaUserId,
        "x-api-key": habiticaApiKey,
        "x-client": `${habiticaUserId}-HabitWebApp`,
      },
    });
    if (!response.ok) {
      throw new Error('Received an error in user data request')
    }
    return response.json()
  } catch {
    alert('Unable to request user data.')
  }

}
async function incrementViaApi(index) {
  const habit = data.data[index]
  if (habit.completed) {
    return
  }
  const taskId = habit.id
  const url = `https://habitica.com/api/v3/tasks/${taskId}/score/up`
  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        "x-api-user": habiticaUserId,
        "x-api-key": habiticaApiKey,
        "x-client": `${habiticaUserId}-HabitWebApp`,
      },
    });
    if (!response.ok) {
      throw new Error('Received an error in habit increment request')
    }
    const val = await response.json()
    return val
  } catch {
    alert('Unable to increment habit.')
    return
  }
}
window.onload = onLoad
// prevents ALL context menus from working, at least for windows
window.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};
// cleared for anonymity
var data = {}
