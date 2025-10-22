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
  >
    <span class="counter" class:completed={isIncremented}>{counterValue}</span>
  </span>
  <span class="text">{habit.text}</span>
</span>

<style>
  .habit {
    display: flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
    width: 100%; /* Fill the grid cell */
    padding: 10px; /* Add some breathing room */
    box-sizing: border-box;
  }
  .hidden {
    display: none;
  }
  .circle {
    /* Make the circle responsive and square */
    width: 100%;
    height: 0;
    padding-bottom: 100%; /* Creates a perfect square */
    margin: 0; /* Remove fixed margin */
    background-color: #DF8FFF; /* Base color */
    border-radius: 50%;
    cursor: pointer;
    position: relative; /* For positioning the counter and pseudo-element */
    overflow: hidden; /* To contain the fill animation */
    transition: background-color 0.3s ease; /* For the final completed state */

    /*  these alone don't seem to stop windows from opening up context menu on long press... annoying  */
    -webkit-touch-callout:none;
    -webkit-user-select:none;
    -khtml-user-select:none;
    -moz-user-select:none;
    -ms-user-select:none;
    user-select:none;
    -webkit-touch-callout: none; /* Safari Touch */
    -webkit-user-select: none;   /* Webkit */
    -moz-user-select: none;      /* Firefox */
    -ms-user-select: none;       /* Edge*/
    user-select: none;       /* Future-proof*/
    -webkit-tap-highlight-color:rgba(0,0,0,0);
  }

  /* The fill animation using a pseudo-element and transform: scale() */
  .circle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #7e4dff; /* Fill color */
    transform: scale(0); /* Start hidden */
    /* Transition allows for smooth fill and smooth reset on release */
    transition: transform 0.5s linear;
  }

  /* When animating, the scale goes to 1 (full fill) */
  .circle.fadecolor::before {
    transform: scale(1);
  }

  /* Final completed state */
  .circle.completed {
    background-color: #7e4dff;
  }
  /* Ensure the fill is visible in the completed state */
  .circle.completed::before {
    transform: scale(1);
    transition: none; /* Prevent transition on load */
  }

  .counter {
    /* Center the counter inside the circle */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2.5em; /* Use relative units */
    pointer-events: none;
    height: auto;
    z-index: 1; /* Ensure counter is above the fill pseudo-element */
  }
  .counter.completed {
    color: white;
  }
  .text {
    font-size: 1.5em; /* Use relative units */
    margin-top: 10px;
    margin-bottom: 32px;
    max-width: 100%;
    text-align: center;
  }
</style>