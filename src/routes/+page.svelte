<script lang="ts">
  import { onMount } from 'svelte';
  import {
    determineApiKey,
    processStartOfDay,
    getHabiticaUserData,
    submitApiKey,
    makeRequests,
  } from '$lib/api';
  import HabitCircle from '$lib/components/HabitCircle.svelte';

  let showInput = false;
  let habits: any[] = [];
  let isComplete = false;
  let keyInput = '';
  let userInput = '';

  // Constants from main.js
  const canVibrate = 'vibrate' in navigator;
  const timeToTriggerIncrement = 500;

  // Function to check if all habits are confirmed
  function checkForCompletedDay() {
    isComplete = habits.every(h => h.confirmed);
  }

  // The main application logic, replacing onLoad and populateHabits
  async function loadHabits() {
    determineApiKey();

    if (!makeRequests) {
      showInput = true;
      return;
    }

    showInput = false;

    await processStartOfDay();
    const userData = await getHabiticaUserData();

    if (userData && userData.data) {
      // Filter for habits (type 'habit') and map to a reactive structure
      habits = userData.data
        .filter((task: any) => task.type === 'habit')
        .map((habit: any) => ({
          ...habit,
          streak: habit.value, // Assuming 'value' is the streak for habits
          incremented: habit.completed, // 'completed' status from API
          confirmed: habit.completed, // 'confirmed' status from API
        }));
    }

    checkForCompletedDay();
  }

  function handleSync() {
    submitApiKey(keyInput, userInput);
    loadHabits();
  }

  onMount(() => {
    loadHabits();
  });

  // Function to update habit state when a child component emits an increment event
  function handleIncrement(event: CustomEvent) {
    const { index, incremented, confirmed } = event.detail;
    habits[index].incremented = incremented;
    habits[index].confirmed = confirmed;
    habits = habits; // Trigger Svelte reactivity
    checkForCompletedDay();
  }
</script>

<!-- The input form, controlled by the showInput state -->
{#if showInput}
  <div class="input" style="display: block;">
    User Id: <input bind:value={userInput} class="setup" placeholder="User ID" />
    API Token: <input bind:value={keyInput} class="setup" placeholder="API Token" />
    <button on:click={handleSync} class="setup">Sync</button>
  </div>
{/if}

<!-- The habit circles -->
{#each habits as habit, index (habit.id)}
  <HabitCircle
    {habit}
    {index}
    {canVibrate}
    {timeToTriggerIncrement}
    on:increment={handleIncrement}
  />
{:else}
  {#if !showInput}
    <!-- Loading or no habits message -->
    <p>Loading habits...</p>
  {/if}
{/each}

<!-- Global style to apply 'complete' class to body. -->
<svelte:head>
  <style>
    {#if isComplete}
      body {
        background-color: #bfa6ff; /* body.complete style from main.css */
      }
    {/if}
  </style>
</svelte:head>