// Asteroids Passing Earth Today — STARTER FILE
// Open index.html with Live Server. Needs config.js with your API key.

// Adds one line of text (an <h2>, <p>, etc.) inside a card
function addLine(card, tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  card.append(element);
  return element;
}

async function main() {
  const status = document.querySelector('#status');

  // Stop early with a clear message if config.js is missing
  if (typeof NASA_API_KEY === 'undefined') {
    status.textContent = 'No API key found. Copy config.example.js to config.js and add your key.';
    return;
  }

  // Today's date as YYYY-MM-DD, e.g. 2026-11-04
  const today = new Date().toLocaleDateString('en-CA');

  // 1. Get the data
  // PART 1: build the NeoWs feed URL between the backticks, using today and NASA_API_KEY
  const url = ``;

  let data;

  try {
    const response = await fetch(url);
    if (response.status === 403) throw new Error('NASA rejected the API key. Check config.js.');
    if (response.status === 429) throw new Error('Too many requests. Wait an hour and try again.');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
    return;
  }

  console.log(data);  // see everything NASA sent back in the DevTools console

  // 2. Find the elements on the page
  // PART 2: select #summary and #asteroids


  // 3. Pull out the list of asteroids for today
  // PART 2: get today's array, clear "Loading...", and fill in the summary


  // 4. Build a card for each asteroid
  // PART 2: loop over the asteroids and add a card for each one


}

main();
