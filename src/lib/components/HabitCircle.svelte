<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { incrementViaApi } from '$lib/api';

  export let habit: any;
  export let index: number;
  export let canVibrate: boolean;
  export let timeToTriggerIncrement: number;

  const dispatch = createEventDispatcher();

  let isAnimating = false;
  let mouseDownTime: Date | null = null;
  let timeoutId: number | null = null;

  // Use reactive declarations to derive state from props, making the component "purer"
  // and avoiding the flash caused by local state being overwritten by prop updates.
  $: isIncremented = habit.incremented;
  $: isConfirmed = habit.confirmed;
  $: counterValue = habit.streak;

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
      isAnimating = false; // Animation is complete

      if (canVibrate) {
        navigator.vibrate(150);
      }

      // 1. Optimistic Update (Dispatch to parent)
      // Parent will update the habit prop, which updates the derived state (isIncremented, counterValue)
      dispatch('increment', {
        index,
        incremented: true,
        confirmed: false,
        counterChange: 1, // Signal parent to increment counter
      });

      // 2. API call
      const incremented = await incrementViaApi(habit);

      // 3. Final Update (Dispatch to parent)
      if (!incremented) {
        // API failed, revert state in parent
        dispatch('increment', {
          index,
          incremented: false,
          confirmed: false,
          counterChange: -1, // Signal parent to decrement counter
        });
        alert('Habitica API failed to increment. Reverting local count.');
      } else {
        // API succeeded, confirm state in parent
        dispatch('increment', {
          index,
          incremented: true,
          confirmed: true,
          counterChange: 0, // Counter already updated
        });
      }
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