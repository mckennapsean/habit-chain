<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { incrementViaApi } from '$lib/api';

  export let habit: any;
  export let index: number;
  export let canVibrate: boolean;
  export let timeToTriggerIncrement: number;

  const dispatch = createEventDispatcher();

  let isIncremented = habit.incremented;
  let isConfirmed = habit.confirmed;
  let isAnimating = false;
  let counterValue = habit.streak;
  let mouseDownTime: Date | null = null;
  let timeoutId: number | null = null;

  // Reactive block to update local state when habit prop changes (e.g., on initial load)
  $: {
    isIncremented = habit.incremented;
    isConfirmed = habit.confirmed;
    counterValue = habit.streak;
  }

  function startPress() {
    if (isIncremented) {
      return;
    }

    if (canVibrate) {
      navigator.vibrate(1);
    }

    mouseDownTime = new Date();
    isAnimating = true;

    timeoutId = window.setTimeout(() => {
      // This is where the increment logic will run if the press is long enough
      incrementCounter();
    }, timeToTriggerIncrement);
  }

  function endPress() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // If the press was too short, stop the animation immediately
    if (!isIncremented) {
      isAnimating = false;
    }
  }

  async function incrementCounter() {
    if (isIncremented) {
      return;
    }

    const difference = new Date().getTime() - (mouseDownTime?.getTime() ?? 0);

    if (difference >= timeToTriggerIncrement) {
      // Local optimistic update
      counterValue++;
      isIncremented = true;
      isAnimating = false; // Animation is complete

      if (canVibrate) {
        navigator.vibrate(150);
      }

      // API call
      const incremented = await incrementViaApi(habit);

      if (!incremented) {
        // API failed, revert local state
        counterValue--;
        isIncremented = false;
        isConfirmed = false;
        alert('Habitica API failed to increment. Reverting local count.');
      } else {
        isConfirmed = true;
      }

      // Dispatch event to parent to update global state
      dispatch('increment', {
        index,
        incremented: isIncremented,
        confirmed: isConfirmed,
      });
    }
  }

  // The original code had a complex way to handle mouseup/touchend outside the circle.
  // Svelte's event modifiers simplify this.
</script>

<span class="habit" class:hidden={!habit.id}>
  <span
    class="circle"
    class:fadecolor={isAnimating}
    class:paused={!isAnimating && !isIncremented}
    class:completed={isIncremented}
    on:mousedown|preventDefault={startPress}
    on:mouseup|preventDefault={endPress}
    on:touchstart|preventDefault={startPress}
    on:touchend|preventDefault={endPress}
    on:contextmenu|preventDefault
  ></span>
  <span class="counter" class:completed={isIncremented}>{counterValue}</span>
  <span class="text">{habit.text}</span>
</span>

<style>
  /* Relying on global styles in app.css */
</style>