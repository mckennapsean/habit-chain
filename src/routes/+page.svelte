<script lang="ts">
  export let params;
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
  let isLoading = true; // Added state to track loading

  // Constants from main.js
  const canVibrate = 'vibrate' in navigator;
  const timeToTriggerIncrement = 500;

  // Function to check if all habits are confirmed
  function checkForCompletedDay() {
    isComplete = habits.length > 0 && habits.every(h => h.confirmed);
  }

  // The main application logic, replacing onLoad and populateHabits
  async function loadHabits() {
    determineApiKey();

    if (!makeRequests) {
      showInput = true;
      isLoading = false; // Set to false if we need input
      return;
    }

    showInput = false;

    await processStartOfDay();
    const userData = await getHabiticaUserData();

    if (userData && userData.data) {
      // The Habitica API returns a flat array of tasks.
      // Filter for habits AND dailies, as the user's data contains dailies.
      habits = userData.data
        .filter((task: any) => task.type === 'habit' || task.type === 'daily')
        .map((habit: any) => ({
          ...habit,
          streak: habit.streak, // Use the correct 'streak' property from the API
          incremented: habit.completed, // 'completed' status from API
          confirmed: habit.completed, // 'confirmed' status from API
        }));
    }

    checkForCompletedDay(); // Manual call after habits are loaded
    isLoading = false; // Set to false when loading is complete
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
    const { index, incremented, confirmed, counterChange } = event.detail;
    
    // Update completion status
    habits[index].incremented = incremented;
    habits[index].confirmed = confirmed;

    // Update counter based on counterChange signal (for optimistic/revert updates)
    if (counterChange !== 0) {
      habits[index].streak += counterChange;
    }

    habits = [...habits]; // Trigger Svelte reactivity
    checkForCompletedDay(); // Manual call after habits are updated
  }

  // Manually set body class based on isComplete state
  $: if (typeof document !== 'undefined') {
    if (isComplete) {
      document.body.classList.add('complete');
    } else {
      document.body.classList.remove('complete');
    }
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
<div class="habit-grid">
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
      {#if isLoading}
        <p>Loading habits...</p>
      {:else}
        <p>No habits found. Please create some in Habitica.</p>
      {/if}
    {/if}
  {/each}
</div>

<style>
  .habit-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 20px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
</style>