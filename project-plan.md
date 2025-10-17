### **Project Plan: Habit-Chain App Revamp (v3)**

---

### **Phase 1: Project Setup & Svelte Migration**

*Goal: Modernize the codebase by migrating to a SvelteKit project with TypeScript and establishing a clean, reactive state management pattern.*

* **Task 1: Initialize SvelteKit + TypeScript Project.**
    * **Action:** Use Vite to scaffold a new SvelteKit project with TypeScript support.
    * **Instructions:** In your terminal, run `npm create svelte@latest habit-chain-ts`. Follow the prompts, selecting "SvelteKit demo app" and choosing the "TypeScript" option.

* **Task 2: Migrate Existing HTML, CSS, and JS.**
    * **Action:** Move the existing application logic into the new Svelte project structure.
    * **Instructions:**
        1.  Copy the HTML body content from `index.html` into `src/routes/+page.svelte`.
        2.  Move the CSS rules from `main.css` into the `<style>` block of `+page.svelte`.
        3.  Transfer the JavaScript logic from `main.js` into the `<script lang="ts">` block of `+page.svelte`.

* **Task 3: Refactor to Svelte's Reactive State.**
    * **Action:** Convert global variables into reactive Svelte state and props.
    * **Instructions:**
        1.  Declare variables like `habiticaApiKey`, `habiticaUserId`, and `data` with `let` in the `<script>` block to make them reactive.
        2.  Define TypeScript types for your `userData` and `habit` objects to improve code quality and catch errors.

---

### **Phase 2: UI Revamp & Component-Based Architecture**

*Goal: Replicate the clean, modern aesthetic of the Streaks app by creating a component-based structure and a responsive grid layout.*

* **Task 4: Implement Responsive Grid Layout.**
    * **Action:** Re-style the main page to use a responsive CSS Grid for the habit circles, ensuring it looks great on both mobile and desktop.
    * **Inspiration Image:** [Streaks UI](https://streaksapp.com/images/demo2-with-watch.png)
    * **Instructions:** In the `<style>` block of `+page.svelte`, update the main container's CSS to use `display: grid` with `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));` and adjust `gap` and `padding`.

* **Task 5: Create a Reusable `HabitCircle` Component.**
    * **Action:** Encapsulate the logic and styling for a single habit into a `HabitCircle.svelte` component.
    * **Instructions:**
        1.  Create a new file at `src/lib/components/HabitCircle.svelte`.
        2.  Move the HTML and CSS for a single habit (circle, counter, text) into this component.
        3.  In `+page.svelte`, use an `#each` block to iterate over the habits data and render a `HabitCircle` for each one, passing in the habit data as props.

* **Task 6: Refine Animations (Two-Step Process).**
    * **Action:** First, port the existing animation. Then, implement the more advanced circular fill animation.
    * **Inspiration Image:** [Streaks Task Detail](https://streaksapp.com/images/iphone-task.png)
    * **Instructions:**
        1.  **Part A (Port Existing):** Ensure the current `fadecolor` CSS animation from `main.css` works correctly within the `HabitCircle.svelte` component on `mousedown`/`touchstart`.
        2.  **Part B (Implement Circular Fill):** Evolve the animation. Use a CSS `conic-gradient` background on the circle, controlled by custom properties. On hold, transition the gradient's angle to create a "filling" effect around the outer edge. Once the animation is complete, switch the component's state to "completed," which changes the entire circle's background color.

---

### **Phase 3: Polishing the User Experience**

*Goal: Streamline the setup process, improve error handling, and add proper attribution.*

* **Task 7: Redesign the Setup Flow.**
    * **Action:** Create a cleaner, more user-friendly setup view that is shown when API keys are missing.
    * **Instructions:** Use an `{#if}` block in `+page.svelte` to conditionally render either the habit grid or a dedicated setup component. This setup component should include clear input fields and a direct link to the Habitica settings page (`https://habitica.com/user/settings/siteData`).

* **Task 8: Implement Non-Blocking Notifications.**
    * **Action:** Replace jarring `alert()` calls with a subtle, non-blocking notification component for displaying API errors.
    * **Instructions:** Create a `Notification.svelte` component that appears at the top or bottom of the screen. When a `try...catch` block in your API calls catches an error, update a reactive store that the `Notification` component listens to, causing it to display the error message for a few seconds.

* **Task 9: Add Subtle Habitica Attribution.**
    * **Action:** Add a small, unobtrusive link to credit Habitica.
    * **Instructions:** In the footer or a corner of the main page, add a small text element that reads "Powered by the Habitica API" and links to `habitica.com`.

---

### **Phase 4: Adding Delight and Final Touches**

*Goal: Implement the "all done" celebration and conduct a final review before branding.*

* **Task 10: Implement "All Habits Complete" Celebration.**
    * **Action:** Create a delightful visual reward for when all daily habits are completed.
    * **Instructions:**
        1.  Create a Svelte derived store (`$: allDone = $habits.every(h => h.completed);`) that automatically tracks when all habits are done.
        2.  When `allDone` becomes `true`, keep the existing full-page background color change.
        3.  As an enhancement, also trigger a brief confetti animation using a lightweight library like `canvas-confetti` to add an extra layer of delight.

* **Task 11: Final Code Cleanup and Responsiveness Review.**
    * **Action:** Perform a full review of the codebase for consistency, remove unused code, add comments, and verify the UI is fully responsive.
    * **Instructions:** Test the app on various screen sizes, from a small mobile phone to a widescreen desktop, ensuring the grid and components look and function correctly.

---

### **Phase 5: Branding & Documentation**

*Goal: Give the project a unique identity and properly credit inspirations.*

* **Task 12: Brainstorm Name and Icon.**
    * **Action:** Come up with a list of potential names and concepts for a simple, memorable application icon.
    * **Instructions:**
        1.  **Naming:** Brainstorm 5-10 names that are short, catchy, and related to habits, chains, circles, or consistency.
        2.  **Iconography:** Sketch or describe 3-5 simple icon concepts. The icon should be clean, recognizable at a small size (like a favicon), and reflect the app's core function (e.g., a looping chain, a checkmark inside a circle, a series of connected circles).

* **Task 13: Update README with Inspiration Credit.**
    * **Action:** Add a section to the `README.md` file to credit the Streaks app.
    * **Instructions:** Edit the `README.md` to include a sentence such as, "This project's user interface is heavily inspired by the beautiful and simple design of the [Streaks app](https://streaksapp.com/)."