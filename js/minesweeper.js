const difficulties = {
  beginner: {
    width: 10, height: 10, quantity: 10
  },
  intermediate: {
    width: 16, height: 16, quantity: 40
  },
  expert: {
    width: 30, height: 16, quantity: 99
  }
}

class Location {
  col; row;
  constructor(col, row) {
    this.col = col;
    this.row = row;
  }
  equals(location) {
    return this.col === location.col && this.row === location.row;
  }
}

class MineFactory {
  /** @returns Coordinate[] */
  static buildMines(minefieldWidth, minefieldHeight, quantity) {
    const locations = [];
    while (locations.length < quantity) {
      let location = null;
      do {
        const col = Math.floor(Math.random() * (minefieldWidth - 1));
        const row = Math.floor(Math.random() * (minefieldHeight - 1));
        location = new Location(col, row);
      } while (locations.filter(c => c.equals(location)).length > 0);
      locations.push(location);
    }
    return locations;
  }
}


class Block {

  static DATA_COL = 'data-col';
  static DATA_ROW = 'data-row';

  /** @type {string} */
  _id;

  col; row;

  /** @type {number} */
  value;

  /** @type {boolean} */
  revealed;

  /** @type {boolean} */
  mine;

  /** @type {boolean} */
  flag;

  constructor(col, row, mine = false) {
    this.col = col;
    this.row = row;
    this.value = 0;
    this.setMine(mine);

    this._id = `col-${col}--row-${row}`;
  }

  setValue(value) { this.value = value; }

  hasFlag() { return this.flag; }
  setFlag(flag) { this.flag = flag; }

  hasMine() { return this.mine; }
  setMine(mine) { this.mine = mine; }

  isRevealed() { return this.revealed; }
  isRevealable() { return !this.isRevealed() && !this.hasFlag(); }

  reveal() { this.revealed = true; }

  _render(id, classlist, attributes, innerHTML = '<div></div>') {
    return `
      <div id="${id}" class="${classlist}" 
           onclick="minesweeper.onLeftClick(event)" 
           oncontextmenu="minesweeper.onRightClick(event)"
           ${attributes}>
        ${innerHTML}
      </div>
    `;
  }

  render() {
    const attributes = `data-col="${this.col}" data-row="${this.row}"`
    if (this.hasFlag())
      return this._render(this.id, 'minesweeper-block block-flag', attributes);
    if (this.isRevealed()) {
      if (this.hasMine())
        return this._render(this.id, 'minesweeper-block block-mine', attributes);
      const innerText = this.value > 0 ? `<div>${this.value}</div>` : `<div></div>`;
      return this._render(this.id, `minesweeper-block block-${this.value} block-tip`, attributes, innerText);
    }
    return this._render(this.id, `minesweeper-block`, attributes);
  }

}

class Minesweeper {

  blocks; mines;

  width = 10; height = 10; quantity = 99;

  constructor(settings) {
    this.width = settings.width;
    this.height = settings.height;
    this.quantity = settings.quantity;
    this.area = this.width * this.height;
    this.blocks = [];
    this.mines = MineFactory.buildMines(this.width, this.height, this.quantity);
  }

  locationHasMine = (location) => this.mines.some(m => m.col === location.col && m.row == location.row);
  locationMineCount = (col, row) => this.locationHasMine({ col, row }) ? 1 : 0;

  getBlock(col, row) { return this.blocks[col][row]; }
  setBlock(col, row, block) { this.blocks[col][row] = block; }

  isValidCol(col) { return col >= 0 && col < this.width; }
  isValidRow(row) { return row >= 0 && row < this.height; }
  isValidLocation(col, row) { return this.isValidCol(col) && this.isValidRow(row); }

  gameover() {
    let ms = 500;
    for (let i = 0; i < this.mines.length; i++) {
      ms += 50;
      const m = this.mines[i];
      setTimeout(() => {
        this.getBlock(m.col, m.row).reveal();
        this.render();
      }, ms);
    }
  }

  initialize() {
    for (let col = 0; col < this.width; col++) {
      this.blocks[col] = [];
      for (let row = 0; row < this.height; row++) {
        this.setBlock(col, row, new Block(col, row, this.locationHasMine({ col, row })));
      }
    }
    this.render();
  }

  flag(col, row) {
    if (this.isValidLocation(col, row)) {
      const block = this.getBlock(col, row);
      block.setFlag(!block.hasFlag());
      this.setBlock(col, row, block);
      this.render(); // TODO: only update the block 
    }
  }

  show(col, row) {
    if (!this.isValidLocation(col, row))
      return;
    const block = this.getBlock(col, row);
    if (!block.isRevealable())
      return;
    block.reveal();
    if (block.hasMine())
      return this.gameover();
    block.setValue(this.checkSurroundings(col, row));
    this.setBlock(col, row, block);
    if (block.value == 0) {
      this.show(col - 1, row - 1);
      this.show(col - 1, row);
      this.show(col - 1, row + 1);
      this.show(col, row - 1);
      this.show(col, row + 1);
      this.show(col + 1, row - 1);
      this.show(col + 1, row);
      this.show(col + 1, row + 1);
    }
    this.render();
  }

  checkSurroundings(col, row) {
    let counter = 0;
    counter += this.locationMineCount(col - 1, row - 1);
    counter += this.locationMineCount(col - 1, row);
    counter += this.locationMineCount(col - 1, row + 1);
    counter += this.locationMineCount(col, row - 1);
    counter += this.locationMineCount(col, row + 1);
    counter += this.locationMineCount(col + 1, row - 1);
    counter += this.locationMineCount(col + 1, row);
    counter += this.locationMineCount(col + 1, row + 1);
    return counter;
  }

  getEventTargetLocation(e) {
    return [parseInt(e.target.getAttribute(Block.DATA_COL)), parseInt(e.target.getAttribute(Block.DATA_ROW))];
  }

  onRightClick(event) {
    event.preventDefault();
    const [col, row] = this.getEventTargetLocation(event);
    this.flag(col, row);
  }

  onLeftClick(event) {
    const [col, row] = this.getEventTargetLocation(event);
    this.show(col, row);
  }

  render() {
    let html = '';
    for (let col = 0; col < this.width; col++) {
      html += `<div class="minesweeper-col">`;
      for (let row = 0; row < this.height; row++) {
        const block = this.getBlock(col, row);
        html += `<div class="minesweeper-row">`;
        html += block.render();
        html += `</div>`;
      }
      html += `</div>`;
    }
    document.getElementById('minesweeper-wrapper').innerHTML = html;
  }

}

class Difficulty {
  static DIFFICULTY_BEGINNER = 'beginner';
  static DIFFICULTY_INTERMEDIATE = 'intermediate';
  static DIFFICULTY_EXPERT = 'expert';
  static DIFFICULTY_CUSTOM = 'custom';
}

/** @type {Minesweeper} */
let minesweeper = null;

// custom game settings
let customWidth = 10, customHeight = 10, customQuantity = 4;

const DIFFICULTY_SETTINGS = {
  beginner: { width: 10, height: 10, quantity: 4 },
  intermediate: { width: 10, height: 10, quantity: 4 },
  expert: { width: 10, height: 10, quantity: 4 },
}

function restart(difficulty) {
  minesweeper = new Minesweeper(difficulties[difficulty]);
  minesweeper.initialize();
}

function changeDifficulty(event) {
  const difficulty = event.target.value;
  restart(difficulty);
}

restart(Difficulty.DIFFICULTY_INTERMEDIATE);
