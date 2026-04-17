import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';


let updateTimer;

function renderMessageList(){
  console.log("ready render once all load rows test.");
}

function debouncedUpdateUI() {
  // 1. Clear the "waiting" timer every time a new message hits
  clearTimeout(updateTimer);

  // 2. Start a new "rest" timer
  updateTimer = setTimeout(() => {
    console.log("Messages have stopped. Updating UI now.");
    renderMessageList(); // This runs only AFTER the 2-second rest
  }, 2000); // 2000ms = 2 seconds of "rest"
}

//-----------------------------------------------
// TWEAKPANE
//-----------------------------------------------
const pane = new Pane();


pane.addButton({title: 'Create'}).on('click',()=>{
  // Every time a row is inserted, we reset the wait
  console.log('click...')
  debouncedUpdateUI();
});