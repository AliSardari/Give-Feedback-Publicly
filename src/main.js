lucide.createIcons();

/**
 * @file Main JavaScript for the feedback application.
 * Handles rendering feedbacks, filtering by tags, adding new feedbacks, and sorting.
 */

// --- Initial Data ---

/**
 * @typedef {object} FeedbackItem
 * @property {number} id - Unique identifier for the feedback.
 * @property {string} text - The content of the feedback.
 * @property {string[]} tags - Array of tags associated with the feedback.
 * @property {Date} date - The date and time the feedback was created.
 * @property {number} views - The number of times the feedback has been viewed.
 */

/**
 * Sample feedback data.
 * Each item includes text, tags (1-3), date, and views.
 * @type {FeedbackItem[]}
 */
let feedbackData = [
    {
        id: 1,
        text: "Great product, easy to use and navigate!",
        tags: ["ui", "ux", "easy"],
        date: new Date("2023-10-26T10:00:00Z"),
        views: 15,
    },
    {
        id: 2,
        text: "The dark mode is a lifesaver for late-night use.",
        tags: ["ui", "dark-mode", "theme"],
        date: new Date("2023-10-25T22:30:00Z"),
        views: 28,
    },
    {
        id: 3,
        text: "User experience could be more intuitive, especially for new users.",
        tags: ["ux", "intuitive"],
        date: new Date("2023-10-26T11:45:00Z"),
        views: 8,
    },
    {
        id: 4,
        text: "Love the new theme options! Very customizable.",
        tags: ["theme", "customization", "ui"],
        date: new Date("2023-10-24T09:15:00Z"),
        views: 35,
    },
    {
        id: 5,
        text: "Performance seems a bit slow on initial load.",
        tags: ["performance", "speed"],
        date: new Date("2023-10-26T14:00:00Z"),
        views: 12,
    },
    {
        id: 6,
        text: "The user interface is clean, modern, and visually appealing.",
        tags: ["ui", "modern", "design"],
        date: new Date("2023-10-23T16:00:00Z"),
        views: 22,
    },
    {
        id: 7,
        text: "Dark mode implementation is flawless and works perfectly.",
        tags: ["dark-mode", "theme", "ui"],
        date: new Date("2023-10-25T23:00:00Z"),
        views: 18,
    },
    {
        id: 8,
        text: "Found it a bit difficult to navigate through the settings menu.",
        tags: ["ux", "navigation", "settings"],
        date: new Date("2023-10-26T08:00:00Z"),
        views: 7,
    },
    {
        id: 9,
        text: "Excellent speed and responsiveness overall, great job!",
        tags: ["performance", "speed", "ux"],
        date: new Date("2023-10-24T13:00:00Z"),
        views: 30,
    },
    {
        id: 10,
        text: "The customization options for the dashboard are fantastic and much needed.",
        tags: ["customization", "theme", "dashboard"],
        date: new Date("2023-10-22T10:30:00Z"),
        views: 25,
    },
    {
        id: 15,
        text: "Needs more performance tuning for faster loading times.",
        tags: ["performance", "optimization"],
        date: new Date("2023-10-26T15:00:00Z"),
        views: 9,
    },
];

/**
 * Stores all unique tags encountered. Used for rendering the tag filter bar.
 * @type {Set<string>}
 */
let popularTagsSet = new Set();

/**
 * The currently active filter tag. Null if no filter is active.
 * @type {string | null}
 */
let activeTag = null;

/**
 * The list of feedbacks currently displayed (can be filtered or sorted).
 * @type {FeedbackItem[]}
 */
let currentList = [...feedbackData]; // Initially, display all feedbacks

/**
 * Stores the current sorting mode.
 * Options: 'date-desc', 'date-asc', 'views-desc', 'views-asc'.
 * @type {string}
 */
let sortMode = "date-desc";

// --- DOM Element References ---

/** @type {HTMLElement | null} */
const feedbackListEl = document.getElementById("feedback-list"); // Assuming you have a div with id="feedback-list"
/** @type {HTMLElement | null} */
const popularTagsEl = document.getElementById("popular-tags"); // Assuming you have a div with id="popular-tags"
/** @type {HTMLFormElement | null} */
const form = document.querySelector("form"); // Assuming your form has no specific ID or class
/** @type {HTMLTextAreaElement | null} */
const textarea = document.querySelector("textarea"); // Assuming your textarea has no specific ID or class
/** @type {HTMLElement | null} */
const charCount = document.getElementById("char-count"); // Assuming you have an element for character count display
/** @type {HTMLElement | null} */
const feedbackList = document.getElementById("feedback-list"); // This seems redundant with feedbackListEl, ensure it's the correct element

// --- Constants ---
const MAX_LENGTH = 150; // Max characters allowed in textarea

// --- Utility Functions ---

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 * @param {string} str - The string to escape.
 * @returns {string} - The escaped string.
 */
const escapeHtml = (str) =>
    str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

/**
 * Extracts hashtags (like #tag) from a given text.
 * Ensures tags are lowercase and valid.
 * @param {string} text - The text to extract hashtags from.
 * @returns {string[]} - An array of extracted hashtags (lowercase).
 */
function extractHashtags(text) {
    const regex = /#(\w+)/g;
    const matches = [...text.matchAll(regex)];
    return matches.map((m) => m[1]);
}

textarea.addEventListener("input", () => {
    const remaining = MAX_LENGTH - textarea.value.length;
    charCount.textContent = remaining;
});

// --- Core Rendering Functions ---

/**
 * Renders the list of feedback items.
 * Adds event listeners for clicks on cards (to increase views) and tags (to filter).
 * Uses escapeHtml for security.
 * @param {FeedbackItem[]} list - The list of feedback items to render.
 */
function renderFeedbacks(list) {
    if (!feedbackList) return; // Exit if the feedback list element doesn't exist

    // Clear previous feedback items
    feedbackList.innerHTML = "";

    // Render each feedback item
    list.forEach((item) => {
        // Determine the badge letter from the first character of the first tag, or '?' if none
        const badgeLetter = (item.tags?.[0]?.[0] || "?").toUpperCase();

        // Create the main article element for the feedback card
        const article = document.createElement("article");
        article.className =
            "flex gap-4 px-6 py-5 bg-gray-800 hover:bg-slate-50 transition md:px-10 cursor-pointer dark:hover:bg-gray-700 "; // Tailwind classes for styling

        // Create the inner HTML for the feedback card
        article.innerHTML = `
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-700 font-bold text-white">
                ${badgeLetter}
            </div>

            <div class="flex-1">
                <p class="text-sm text-slate-700 dark:text-slate-300">
                    ${escapeHtml(item.text ?? "")}
                </p>

                <div class="mt-2 flex flex-wrap gap-2">
                    ${
                        // Map over tags to create clickable hashtag buttons
                        item.tags?.length
                            ? item.tags
                                  .map(
                                      (tag) => `
                                <button
                                  type="button"
                                  class="hashtag rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition"
                                  data-tag="${tag}"
                                >
                                  #${tag}
                                </button>
                              `,
                                  )
                                  .join("")
                            : ""
                    }
                </div>

                <div class="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    ${new Date(item.date).toLocaleString()} • 👁 ${item.views ?? 0}
                </div>
            </div>
        `;

        // Add event listener to the article for increasing views on click
        article.addEventListener("click", () => {
            // Increment views, ensuring it's a valid number
            item.views = (Number.isFinite(item.views) ? item.views : 0) + 1;
            renderFeedbacks(currentList); // Re-render the current list to show updated views
        });

        // Append the created article to the feedback list element
        feedbackList.appendChild(article);
    });

    // Add event listeners to the newly created hashtag buttons for filtering
    feedbackList.querySelectorAll(".hashtag").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent the article click event from firing
            const tag = btn.dataset.tag;
            if (!tag) return;

            activeTag = tag; // Set the globally active tag
            // Filter feedbackData by the selected tag
            currentList = feedbackData.filter(
                (f) => Array.isArray(f.tags) && f.tags.includes(tag),
            );

            renderFeedbacks(currentList); // Re-render the list with the filter applied
            // Update the popular tags UI, including the "Clear" button and active tag styling
            if (typeof renderPopularTags === "function") renderPopularTags();
        });
    });
}

/**
 * Renders the popular tags and the "Clear" button.
 * Handles click events for filtering by tags and clearing the filter.
 */
function renderPopularTags() {
    if (!popularTagsEl) return; // Exit if the popular tags element doesn't exist

    // Get all unique tags, sort them alphabetically
    const tags = [...popularTagsSet].sort((a, b) => a.localeCompare(b));

    // Map tags to button elements
    popularTagsEl.innerHTML = tags
        .map(
            (tag) => `
        <button
            type="button"
            class="popular-tag rounded-full px-3 py-1 text-xs font-semibold transition
                ${
                    // Style the button differently if it's the active tag
                    activeTag === tag
                        ? "bg-indigo-700 text-white"
                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                }
            "
            data-tag="${tag}"
        >
            #${tag}
        </button>`,
        )
        .join("");

    // If a tag is currently active, add a "Clear" button
    if (activeTag) {
        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.textContent = "Clear";
        clearBtn.className =
            "ml-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

        // Event listener to clear the filter
        clearBtn.addEventListener("click", () => {
            activeTag = null; // Reset active tag
            currentList = feedbackData; // Reset list to all feedbacks
            renderFeedbacks(currentList); // Re-render feedbacks
            renderPopularTags(); // Re-render tags UI (to remove active style and clear button)
        });
        popularTagsEl.appendChild(clearBtn);
    }

    // Add event listeners to the newly created popular tag buttons
    popularTagsEl.querySelectorAll(".popular-tag").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent default button action
            e.stopPropagation(); // Prevent click from bubbling up

            const tag = btn.dataset.tag;
            if (!tag) return;

            activeTag = tag; // Set the clicked tag as active
            // Filter the main feedbackData based on the selected tag
            currentList = feedbackData.filter(
                (f) => Array.isArray(f.tags) && f.tags.includes(tag),
            );
            renderFeedbacks(currentList); // Update the displayed feedbacks
            renderPopularTags(); // Update the tags UI to reflect the active tag
        });
    });
}

// --- Sorting Functionality ---

/**
 * Sorts the currentList based on the sortMode and re-renders the feedbacks.
 */
function sortCurrentList() {
    const sorted = [...currentList]; // Create a mutable copy
    if (sortMode === "date-desc") {
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortMode === "date-asc") {
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortMode === "views-desc") {
        sorted.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    } else if (sortMode === "views-asc") {
        sorted.sort((a, b) => (a.views ?? 0) - (b.views ?? 0));
    }
    currentList = sorted; // Update the global currentList

    // Re-render the feedbacks with the sorted list
    // Note: The sort function is applied again here for date-desc, which is slightly redundant but ensures correctness.
    renderFeedbacks(
        sortMode === "date-desc"
            ? [...currentList].sort(
                  (a, b) => new Date(b.date) - new Date(a.date),
              )
            : currentList,
    );
}

// --- Event Listeners ---

// Event listener for form submission to add new feedback
form?.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent default form submission

    const text = textarea.value.trim();
    // Clear any previous error/success classes
    textarea.classList.remove("textarea-error", "textarea-success");

    // Validate if text is present
    if (!text) {
        textarea.classList.add("textarea-error");
        setTimeout(() => textarea.classList.remove("textarea-error"), 2000);
        return;
    }

    // Extract hashtags from the text
    const hashtags = extractHashtags(text);

    // Validate if at least one hashtag was found
    if (hashtags.length === 0) {
        textarea.classList.add("textarea-error");
        setTimeout(() => textarea.classList.remove("textarea-error"), 2000);
        return;
    }

    // Add success class briefly for visual feedback
    textarea.classList.add("textarea-success");
    setTimeout(() => textarea.classList.remove("textarea-success"), 1500);

    // Create the new feedback item object
    const feedbackItem = {
        id: Date.now(), // Simple unique ID using timestamp
        text,
        tags: hashtags,
        date: new Date(), // Current date and time
        views: 0, // Initial views count
    };

    // Add the new feedback to the beginning of the feedbackData array
    feedbackData.unshift(feedbackItem);

    // Update the currentList to include the new item
    // If a filter is active, filter feedbackData; otherwise, use all of it
    currentList = activeTag
        ? feedbackData.filter(
              (item) =>
                  Array.isArray(item.tags) && item.tags.includes(activeTag),
          )
        : feedbackData;

    // Add the new tags to the popularTagsSet
    hashtags.forEach((tag) => popularTagsSet.add(tag));

    // Re-render the popular tags UI to include new tags and update active state
    if (typeof renderPopularTags === "function") renderPopularTags();

    // Re-render the feedbacks list with the updated currentList
    renderFeedbacks(currentList);

    // Clear the textarea and reset character count
    textarea.value = "";
    if (charCount) charCount.textContent = String(MAX_LENGTH);
});

// Event listeners for sorting buttons
document.getElementById("sort-date")?.addEventListener("click", () => {
    sortMode = sortMode === "date-desc" ? "date-asc" : "date-desc";
    sortCurrentList();
});

document.getElementById("sort-views")?.addEventListener("click", () => {
    sortMode = sortMode === "views-desc" ? "views-asc" : "views-desc";
    sortCurrentList();
});

// --- Initial Render ---

// Populate the popularTagsSet initially from feedbackData
feedbackData.forEach((item) => {
    item.tags?.forEach((tag) => popularTagsSet.add(tag));
});

// Initial rendering of the feedback list and popular tags on page load
// Ensure currentList is correctly initialized before rendering
currentList = activeTag
    ? feedbackData.filter(
          (item) => Array.isArray(item.tags) && item.tags.includes(activeTag),
      )
    : feedbackData;

if (typeof renderPopularTags === "function") renderPopularTags();
renderFeedbacks(currentList);
