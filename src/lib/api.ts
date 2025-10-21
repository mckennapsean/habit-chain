// src/lib/api.ts

export let habiticaApiKey = '';
export let habiticaUserId = '';
export let data: any = {}; // Habitica user data
export let makeRequests = false;

const useApi = true;
// minimize requests (no daily cron, no incrementing)
const debugMode = false;
const localStorageApiKey = 'habits-habitica-api-key';
const localStorageUserIdKey = 'habits-habitica-user-id-key';

export function determineApiKey() {
  if (!useApi) {
    return;
  }
  const key = localStorage.getItem(localStorageApiKey);
  if (key) {
    habiticaApiKey = key;
  }
  const id = localStorage.getItem(localStorageUserIdKey);
  if (id) {
    habiticaUserId = id;
  }
  if (!key || !id) {
    makeRequests = false;
  } else {
    makeRequests = true;
  }
}

export function submitApiKey(key: string, user: string) {
  habiticaApiKey = key;
  habiticaUserId = user;
  localStorage.setItem(localStorageApiKey, habiticaApiKey);
  localStorage.setItem(localStorageUserIdKey, habiticaUserId);
  makeRequests = true;
}

export async function processStartOfDay() {
  try {
    if (debugMode) {
      return;
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
      throw new Error('Received an error in start of day request');
    }
    return response.json();
  } catch {
    alert('Unable to ping habitica cron.');
  }
}

export async function getHabiticaUserData() {
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
      throw new Error('Received an error in user data request');
    }
    const userData = await response.json();
    data = userData; // Update global data object
    return userData;
  } catch {
    alert('Unable to request user data.');
  }
}

export async function incrementViaApi(habit: any) {
  if (habit.completed) {
    return;
  }
  const taskId = habit.id;
  const url = `https://habitica.com/api/v3/tasks/${taskId}/score/up`;
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
      throw new Error('Received an error in habit increment request');
    }
    const val = await response.json();
    return val;
  } catch {
    alert('Unable to increment habit.');
    return;
  }
}