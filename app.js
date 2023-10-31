import PianoRoll from './pianoroll.js';

class PianoRollDisplay {
  constructor(csvURL) {
    this.csvURL = csvURL;
    this.data = null;
  }

  async loadPianoRollData() {
    try {
      const response = await fetch('https://pianoroll.ai/random_notes');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      this.data = await response.json();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  preparePianoRollCard(rollId) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('piano-roll-card');

    // Create and append other elements to the card container as needed
    const descriptionDiv = document.createElement('div');
    descriptionDiv.classList.add('description');
    descriptionDiv.textContent = `This is a piano roll number ${rollId}`;
    cardDiv.appendChild(descriptionDiv);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('piano-roll-svg');
    svg.setAttribute('width', '80%');
    svg.setAttribute('height', '150');

    // Append the SVG to the card container
    cardDiv.appendChild(svg);
    return { cardDiv, svg }
  }

  async generateSVGs() {
    if (!this.data) await this.loadPianoRollData();
    if (!this.data) return;

    const pianoRollContainer = document.getElementById('pianoRollContainer');
    pianoRollContainer.innerHTML = '';
    for (let it = 0; it < 20; it++) {
      const start = it * 60;
      const end = start + 60;
      const partData = this.data.slice(start, end);
      const { cardDiv, svg } = this.preparePianoRollCard(it)

      pianoRollContainer.appendChild(cardDiv);
      const roll = new PianoRoll(svg, partData);
    }
  }
}

document.getElementById('loadCSV').addEventListener('click', async () => {
  const csvToSVG = new PianoRollDisplay();
  await csvToSVG.generateSVGs();

  // after all cards being rendered function call is made to work on them
  getPianoRollEls()
});




function getPianoRollEls() {

  // select all the cards to work on them
  let pianoRollCards = document.querySelectorAll('.piano-roll-card')

  pianoRollCards.forEach((pianoRollCardEl) => {
    setMainPianoRoll(pianoRollCardEl)
  })
}


// when piano-roll-card is clicked remind it
let lastMainPianoRollCard = null;

function setMainPianoRoll(pianoRollCardEl) {

  // get elements from html to change screen shape and children elements
  let screenChangeEl = document.getElementById('screenChange')
  let mainContainerEl = document.getElementById('mainContainer')
  let pianoRollContainerEl = document.getElementById('pianoRollContainer')


  pianoRollCardEl.addEventListener('click', () => {
    
    // on vertical line, when card clicked, the old selection_rectangle disappeared
    document.getElementById('selection-rectangle').style.display = 'none'

    // check if the last modiefied card exist, and remove mainCard class from it
    if (lastMainPianoRollCard) {
      lastMainPianoRollCard.classList.remove('mainPianoRollCard')
    }

    // on each card clicked, change screen shape and
    screenChangeEl.id = 'screenChangeUpdated'

    // add mainContainerUpdate class to make a parent of card and set it empty
    mainContainerEl.id = 'mainContainerUpdate'
    mainContainerEl.innerHTML = ''

    // add pianoRollContainerUpdate class to make vertical screen for cards
    pianoRollContainerEl.id = 'pianoRollContainerUpdate'

    // update clicked card class name
    pianoRollCardEl.classList.add('mainPianoRollCard')

    // get the clone of the clicked card, and add it to main container element
    let pianoRollCardChildEl = pianoRollCardEl.cloneNode(true);
    mainContainerEl.appendChild(pianoRollCardChildEl)

    // remember last modified piano Card
    lastMainPianoRollCard = pianoRollCardEl

    getSelectedPart(mainContainerEl.querySelector('.piano-roll-svg'))
  })
}

/* get Main piano Card and select part of it */
function getSelectedPart(mainPianoCard) {

  let isSelecting = false;
  let startCoords = { x: 0, y: 0 };
  let endCoords = { x: 0, y: 0 };

  let selectionRectangle = document.getElementById("selection-rectangle");

  mainPianoCard.addEventListener("mousedown", (e) => {
    isSelecting = true;
    startCoords.x = e.clientX;
    startCoords.y = e.clientY;

    let selectionRectangle = document.getElementById("selection-rectangle");
    selectionRectangle.innerText = ''
  });

  mainPianoCard.addEventListener("mousemove", (e) => {
    if (isSelecting) {
      endCoords.x = e.clientX;
      endCoords.y = e.clientY;
      updateSelectionRectangle();
    }
  });

  let lastModifiedNotes = null;
  mainPianoCard.addEventListener("mouseup", () => {
    isSelecting = false;
    lastModifiedNotes = selectCellsInRectangle();
  });

  function updateSelectionRectangle() {

    const left = Math.min(startCoords.x, endCoords.x);
    const top = Math.min(startCoords.y, endCoords.y);
    const width = Math.abs(startCoords.x - endCoords.x);
    const height = Math.abs(startCoords.y - endCoords.y);

    selectionRectangle.style.display = "block";
    
    selectionRectangle.style.left = left + "px";
    selectionRectangle.style.top = top + "px";
    selectionRectangle.style.width = width + "px";
    selectionRectangle.style.height = height + "px";
    

    /* before every update rectangle area drawn, get last modified notes and remove the class name */
    if(lastModifiedNotes) {
      lastModifiedNotes.forEach((lastModifiedNote)=> {
        lastModifiedNote.classList.remove('selected-note')
      })
    }

  }


  function selectCellsInRectangle() {
    let selectionRectangle = document.getElementById("selection-rectangle");

    // get size and position of each note Selection rectangle
    const selectionRect = selectionRectangle.getBoundingClientRect();

    const selectionRectLeft = selectionRect.left;
    const selectionRectTop = selectionRect.top;
    const selectionRectRight = selectionRect.right;
    const selectionRectBottom = selectionRect.bottom;

    // Select only Main updated container's notes, helps faster search
    let mainContainerUpdateEl = document.getElementById('mainContainerUpdate')
    const noteRectangles = mainContainerUpdateEl.querySelectorAll('.note-rectangle');
    let noteCounter = 0;
    let lastModifiedNotes = []
    
    noteRectangles.forEach((noteRectangle) => {

      // get size and position of each note
      const noteRect = noteRectangle.getBoundingClientRect();

      const noteRectLeft = noteRect.left;
      const noteRectTop = noteRect.top;
      const noteRectRight = noteRect.right;
      const noteRectBottom = noteRect.bottom;

      // if note is inside of the selected rectangle area
      if (
        noteRectLeft >= selectionRectLeft &&
        noteRectTop >= selectionRectTop &&
        noteRectRight <= selectionRectRight &&
        noteRectBottom <= selectionRectBottom
      ) {
        noteCounter ++
        // add selected-note class to get what I selected
        noteRectangle.classList.add('selected-note');

        // remember last modified notes to remove above class
        lastModifiedNotes.push(noteRectangle)
      }
    });

    selectionRectangle.textContent = `number of notes: ${noteCounter}`
    console.log('number of notes:', noteCounter);
    return lastModifiedNotes
    
  }

}

