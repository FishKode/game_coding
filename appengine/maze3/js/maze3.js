/**
 * Blockly Games: Maze
 *
 * Copyright 2012 Google Inc.
 * https://github.com/google/blockly-games
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview JavaScript for Blockly's Maze application.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Maze3');

goog.require('Blockly.FieldDropdown');
goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyInterface');
goog.require('Maze3.Blocks');
goog.require('Maze3.soy');

BlocklyGames.NAME = 'maze';
BlocklyGames.MAX_LEVEL = 2;
/**
 * Go to the next level.  Add skin parameter.
 * @suppress {duplicate}
 */
BlocklyInterface.nextLevel = function() {
  if (BlocklyGames.LEVEL < BlocklyGames.MAX_LEVEL) {
    window.location = window.location.protocol + '//' +
        window.location.host + window.location.pathname +
        '?lang=' + BlocklyGames.LANG + '&level=' + (BlocklyGames.LEVEL + 1) +
        '&skin=' + Maze3.SKIN_ID;
  } else {
    BlocklyInterface.indexPage();
  }
};

Maze3.MAX_BLOCKS = [undefined, // Level 0.
    5, 10][BlocklyGames.LEVEL];

// Crash type constants.
Maze3.CRASH_STOP = 1;
Maze3.CRASH_SPIN = 2;
Maze3.CRASH_FALL = 3;

Maze3.SKINS = [
  // sprite: A 1029x51 set of 21 avatar images.
  // tiles: A 250x200 set of 20 map images.
  // marker: A 20x34 goal image.
  // background: An optional 400x450 background image, or false.
  // graph: Colour of optional grid lines, or false.
  // look: Colour of sonar-like look icon.
  // winSound: List of sounds (in various formats) to play when the player wins.
  // crashSound: List of sounds (in various formats) for player crashes.
  // crashType: Behaviour when player crashes (stop, spin, or fall).
  {
    sprite: 'maze/pegman.png',
    tiles: 'maze/tiles_pegman.png',
    marker: 'maze/marker.png',
    background: false,
    graph: false,
    look: '#000',
    winSound: ['maze/win.mp3', 'maze/win.ogg'],
    crashSound: ['maze/fail_pegman.mp3', 'maze/fail_pegman.ogg'],
    crashType: Maze3.CRASH_STOP
  },
  {
    sprite: 'maze/astro.png',
    tiles: 'maze/tiles_astro.png',
    marker: 'maze/marker.png',
    background: 'maze/bg_astro.jpg',
    // Coma star cluster, photo by George Hatfield, used with permission.
    graph: false,
    look: '#fff',
    winSound: ['maze/win.mp3', 'maze/win.ogg'],
    crashSound: ['maze/fail_astro.mp3', 'maze/fail_astro.ogg'],
    crashType: Maze3.CRASH_SPIN
  },
  {
    sprite: 'maze/panda.png',
    tiles: 'maze/tiles_panda.png',
    marker: 'maze/marker.png',
    background: 'maze/bg_panda.jpg',
    // Spring canopy, photo by Rupert Fleetingly, CC licensed for reuse.
    graph: false,
    look: '#000',
    winSound: ['maze/win.mp3', 'maze/win.ogg'],
    crashSound: ['maze/fail_panda.mp3', 'maze/fail_panda.ogg'],
    crashType: Maze3.CRASH_FALL
  }
];
Maze3.SKIN_ID = BlocklyGames.getNumberParamFromUrl('skin', 0, Maze3.SKINS.length);
Maze3.SKIN = Maze3.SKINS[Maze3.SKIN_ID];

/**
 * Milliseconds between each animation frame.
 */
Maze3.stepSpeed;

/**
 * The types of squares in the maze, which is represented
 * as a 2D array of SquareType values.
 * @enum {number}
 */
Maze3.SquareType = {
  WALL: 0,
  OPEN: 1,
  START: 2,
  FINISH: 3
};

// The maze square constants defined above are inlined here
// for ease of reading and writing the static mazes.
Maze3.map = [
// Level 0.
 undefined,
// Level 1.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 0],
  [0, 2, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 0],
  [0, 1, 1, 3, 0, 1, 0, 0],
  [0, 1, 0, 1, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 2.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 1, 0, 0],
  [0, 2, 1, 1, 0, 3, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]]
][BlocklyGames.LEVEL];

/**
 * Measure maze dimensions and set sizes.
 * ROWS: Number of tiles down.
 * COLS: Number of tiles across.
 * SQUARE_SIZE: Pixel height and width of each maze square (i.e. tile).
 */
Maze3.ROWS = Maze3.map.length;
Maze3.COLS = Maze3.map[0].length;
Maze3.SQUARE_SIZE = 50;
Maze3.PEGMAN_HEIGHT = 52;
Maze3.PEGMAN_WIDTH = 49;

Maze3.MAZE_WIDTH = Maze3.SQUARE_SIZE * Maze3.COLS;
Maze3.MAZE_HEIGHT = Maze3.SQUARE_SIZE * Maze3.ROWS;
Maze3.PATH_WIDTH = Maze3.SQUARE_SIZE / 3;

/**
 * Constants for cardinal directions.  Subsequent code assumes these are
 * in the range 0..3 and that opposites have an absolute difference of 2.
 * @enum {number}
 */
Maze3.DirectionType = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3
};

/**
 * Outcomes of running the user program.
 */
Maze3.ResultType = {
  UNSET: 0,
  SUCCESS: 1,
  FAILURE: -1,
  TIMEOUT: 2,
  ERROR: -2
};

/**
 * Result of last execution.
 */
Maze3.result = Maze3.ResultType.UNSET;

/**
 * Starting direction.
 */
Maze3.startDirection = Maze3.DirectionType.EAST;

/**
 * PIDs of animation tasks currently executing.
 */
Maze3.pidList = [];

// Map each possible shape to a sprite.
// Input: Binary string representing Centre/North/West/South/East squares.
// Output: [x, y] coordinates of each tile's sprite in tiles.png.
Maze3.tile_SHAPES = {
  '10010': [4, 0],  // Dead ends
  '10001': [3, 3],
  '11000': [0, 1],
  '10100': [0, 2],
  '11010': [4, 1],  // Vertical
  '10101': [3, 2],  // Horizontal
  '10110': [0, 0],  // Elbows
  '10011': [2, 0],
  '11001': [4, 2],
  '11100': [2, 3],
  '11110': [1, 1],  // Junctions
  '10111': [1, 0],
  '11011': [2, 1],
  '11101': [1, 2],
  '11111': [2, 2],  // Cross
  'null0': [4, 3],  // Empty
  'null1': [3, 0],
  'null2': [3, 1],
  'null3': [0, 3],
  'null4': [1, 3]
};

/**
 * Create and layout all the nodes for the path, scenery, Pegman, and goal.
 */
Maze3.drawMap = function() {
  var svg = document.getElementById('svgMaze');
  var scale = Math.max(Maze3.ROWS, Maze3.COLS) * Maze3.SQUARE_SIZE;
  svg.setAttribute('viewBox', '0 0 ' + scale + ' ' + scale);

  // Draw the outer square.
  var square = document.createElementNS(Blockly.SVG_NS, 'rect');
  square.setAttribute('width', Maze3.MAZE_WIDTH);
  square.setAttribute('height', Maze3.MAZE_HEIGHT);
  square.setAttribute('fill', '#F1EEE7');
  square.setAttribute('stroke-width', 1);
  square.setAttribute('stroke', '#CCB');
  svg.appendChild(square);

  if (Maze3.SKIN.background) {
    var tile = document.createElementNS(Blockly.SVG_NS, 'image');
    tile.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
        Maze3.SKIN.background);
    tile.setAttribute('height', Maze3.MAZE_HEIGHT);
    tile.setAttribute('width', Maze3.MAZE_WIDTH);
    tile.setAttribute('x', 0);
    tile.setAttribute('y', 0);
    svg.appendChild(tile);
  }

  if (Maze3.SKIN.graph) {
    // Draw the grid lines.
    // The grid lines are offset so that the lines pass through the centre of
    // each square.  A half-pixel offset is also added to as standard SVG
    // practice to avoid blurriness.
    var offset = Maze3.SQUARE_SIZE / 2 + 0.5;
    for (var k = 0; k < Maze3.ROWS; k++) {
      var h_line = document.createElementNS(Blockly.SVG_NS, 'line');
      h_line.setAttribute('y1', k * Maze3.SQUARE_SIZE + offset);
      h_line.setAttribute('x2', Maze3.MAZE_WIDTH);
      h_line.setAttribute('y2', k * Maze3.SQUARE_SIZE + offset);
      h_line.setAttribute('stroke', Maze3.SKIN.graph);
      h_line.setAttribute('stroke-width', 1);
      svg.appendChild(h_line);
    }
    for (var k = 0; k < Maze3.COLS; k++) {
      var v_line = document.createElementNS(Blockly.SVG_NS, 'line');
      v_line.setAttribute('x1', k * Maze3.SQUARE_SIZE + offset);
      v_line.setAttribute('x2', k * Maze3.SQUARE_SIZE + offset);
      v_line.setAttribute('y2', Maze3.MAZE_HEIGHT);
      v_line.setAttribute('stroke', Maze3.SKIN.graph);
      v_line.setAttribute('stroke-width', 1);
      svg.appendChild(v_line);
    }
  }

  // Draw the tiles making up the maze map.

  // Return a value of '0' if the specified square is wall or out of bounds,
  // '1' otherwise (empty, start, finish).
  var normalize = function(x, y) {
    if (x < 0 || x >= Maze3.COLS || y < 0 || y >= Maze3.ROWS) {
      return '0';
    }
    return (Maze3.map[y][x] == Maze3.SquareType.WALL) ? '0' : '1';
  };

  // Compute and draw the tile for each square.
  var tileId = 0;
  for (var y = 0; y < Maze3.ROWS; y++) {
    for (var x = 0; x < Maze3.COLS; x++) {
      // Compute the tile shape.
      var tileShape = normalize(x, y) +
          normalize(x, y - 1) +  // North.
          normalize(x + 1, y) +  // West.
          normalize(x, y + 1) +  // South.
          normalize(x - 1, y);   // East.

      // Draw the tile.
      if (!Maze3.tile_SHAPES[tileShape]) {
        // Empty square.  Use null0 for large areas, with null1-4 for borders.
        // Add some randomness to avoid large empty spaces.
        if (tileShape == '00000' && Math.random() > 0.3) {
          tileShape = 'null0';
        } else {
          tileShape = 'null' + Math.floor(1 + Math.random() * 4);
        }
      }
      var left = Maze3.tile_SHAPES[tileShape][0];
      var top = Maze3.tile_SHAPES[tileShape][1];
      // Tile's clipPath element.
      var tileClip = document.createElementNS(Blockly.SVG_NS, 'clipPath');
      tileClip.setAttribute('id', 'tileClipPath' + tileId);
      var clipRect = document.createElementNS(Blockly.SVG_NS, 'rect');
      clipRect.setAttribute('width', Maze3.SQUARE_SIZE);
      clipRect.setAttribute('height', Maze3.SQUARE_SIZE);

      clipRect.setAttribute('x', x * Maze3.SQUARE_SIZE);
      clipRect.setAttribute('y', y * Maze3.SQUARE_SIZE);

      tileClip.appendChild(clipRect);
      svg.appendChild(tileClip);
      // Tile sprite.
      var tile = document.createElementNS(Blockly.SVG_NS, 'image');
      tile.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
          Maze3.SKIN.tiles);
      // Position the tile sprite relative to the clipRect.
      tile.setAttribute('height', Maze3.SQUARE_SIZE * 4);
      tile.setAttribute('width', Maze3.SQUARE_SIZE * 5);
      tile.setAttribute('clip-path', 'url(#tileClipPath' + tileId + ')');
      tile.setAttribute('x', (x - left) * Maze3.SQUARE_SIZE);
      tile.setAttribute('y', (y - top) * Maze3.SQUARE_SIZE);
      svg.appendChild(tile);
      tileId++;
    }
  }

  // Add finish marker.
  var finishMarker = document.createElementNS(Blockly.SVG_NS, 'image');
  finishMarker.setAttribute('id', 'finish');
  finishMarker.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
      Maze3.SKIN.marker);
  finishMarker.setAttribute('height', 34);
  finishMarker.setAttribute('width', 20);
  svg.appendChild(finishMarker);

  // Pegman's clipPath element, whose (x, y) is reset by Maze3.displayPegman
  var pegmanClip = document.createElementNS(Blockly.SVG_NS, 'clipPath');
  pegmanClip.setAttribute('id', 'pegmanClipPath');
  var clipRect = document.createElementNS(Blockly.SVG_NS, 'rect');
  clipRect.setAttribute('id', 'clipRect');
  clipRect.setAttribute('width', Maze3.PEGMAN_WIDTH);
  clipRect.setAttribute('height', Maze3.PEGMAN_HEIGHT);
  pegmanClip.appendChild(clipRect);
  svg.appendChild(pegmanClip);

  // Add Pegman.
  var pegmanIcon = document.createElementNS(Blockly.SVG_NS, 'image');
  pegmanIcon.setAttribute('id', 'pegman');
  pegmanIcon.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href',
      Maze3.SKIN.sprite);
  pegmanIcon.setAttribute('height', Maze3.PEGMAN_HEIGHT);
  pegmanIcon.setAttribute('width', Maze3.PEGMAN_WIDTH * 21); // 49 * 21 = 1029
  pegmanIcon.setAttribute('clip-path', 'url(#pegmanClipPath)');
  svg.appendChild(pegmanIcon);
};

/**
 * Initialize Blockly and the maze.  Called on page load.
 */
Maze3.init = function() {
  // Render the Soy template.
  document.body.innerHTML = Maze3.soy.start({}, null,
      {lang: BlocklyGames.LANG,
       level: BlocklyGames.LEVEL,
       maxLevel: BlocklyGames.MAX_LEVEL,
       skin: Maze3.SKIN_ID,
       html: BlocklyGames.IS_HTML});

  BlocklyInterface.init();

  // Setup the Pegman menu.
  var pegmanImg = document.querySelector('#pegmanButton>img');
  pegmanImg.style.backgroundImage = 'url(' + Maze3.SKIN.sprite + ')';
  var pegmanMenu = document.getElementById('pegmanMenu');
  var handlerFactory = function(n) {
    return function() {
      Maze3.changePegman(n);
    };
  };
  for (var i = 0; i < Maze3.SKINS.length; i++) {
    if (i == Maze3.SKIN_ID) {
      continue;
    }
    var div = document.createElement('div');
    var img = document.createElement('img');
    img.src = 'common/1x1.gif';
    img.style.backgroundImage = 'url(' + Maze3.SKINS[i].sprite + ')';
    div.appendChild(img);
    pegmanMenu.appendChild(div);
    Blockly.bindEvent_(div, 'mousedown', null, handlerFactory(i));
  }
  Blockly.bindEvent_(window, 'resize', null, Maze3.hidePegmanMenu);
  var pegmanButton = document.getElementById('pegmanButton');
  Blockly.bindEvent_(pegmanButton, 'mousedown', null, Maze3.showPegmanMenu);
  var pegmanButtonArrow = document.getElementById('pegmanButtonArrow');
  var arrow = document.createTextNode(Blockly.FieldDropdown.ARROW_CHAR);
  pegmanButtonArrow.appendChild(arrow);

  var rtl = BlocklyGames.isRtl();
  var blocklyDiv = document.getElementById('blockly');
  var visualization = document.getElementById('visualization');
  var onresize = function(e) {
    var top = visualization.offsetTop;
    blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
    blocklyDiv.style.left = rtl ? '10px' : '420px';
    blocklyDiv.style.width = (window.innerWidth - 440) + 'px';
  };
  window.addEventListener('scroll', function() {
    onresize(null);
    Blockly.svgResize(BlocklyGames.workspace);
  });
  window.addEventListener('resize', onresize);
  onresize(null);

  var toolbox = document.getElementById('toolbox');
  // Scale the workspace so level 1 = 1.3, and level 10 = 1.0.
  var scale = 1 + (1 - (BlocklyGames.LEVEL / BlocklyGames.MAX_LEVEL)) / 3;
  BlocklyGames.workspace = Blockly.inject('blockly',
      {'media': 'third-party/blockly/media/',
       'maxBlocks': Maze3.MAX_BLOCKS,
       'rtl': rtl,
       'toolbox': toolbox,
       'trashcan': true,
       'zoom': {'startScale': scale}});
  BlocklyGames.workspace.getAudioManager().load(Maze3.SKIN.winSound, 'win');
  BlocklyGames.workspace.getAudioManager().load(Maze3.SKIN.crashSound, 'fail');
  // Not really needed, there are no user-defined functions or variables.
  Blockly.JavaScript.addReservedWords('moveForward,moveBackward,' +
      'turnRight,turnLeft,isPathForward,isPathRight,isPathBackward,isPathLeft');

  Maze3.drawMap();

  var defaultXml =
      '<xml>' +
      '  <block movable="' + (BlocklyGames.LEVEL != 1) + '" ' +
      'type="maze_moveForward" x="70" y="70"></block>' +
      '</xml>';
  BlocklyInterface.loadBlocks(defaultXml, false);

  // Locate the start and finish squares.
  for (var y = 0; y < Maze3.ROWS; y++) {
    for (var x = 0; x < Maze3.COLS; x++) {
      if (Maze3.map[y][x] == Maze3.SquareType.START) {
        Maze3.start_ = {x: x, y: y};
      } else if (Maze3.map[y][x] == Maze3.SquareType.FINISH) {
        Maze3.finish_ = {x: x, y: y};
      }
    }
  }

  Maze3.reset(true);
  BlocklyGames.workspace.addChangeListener(function() {Maze3.updateCapacity()});

  document.body.addEventListener('mousemove', Maze3.updatePegSpin_, true);

  BlocklyGames.bindClick('runButton', Maze3.runButtonClick);
  BlocklyGames.bindClick('resetButton', Maze3.resetButtonClick);

  if (BlocklyGames.LEVEL == 1) {
    // Make connecting blocks easier for beginners.
    Blockly.SNAP_RADIUS *= 2;
  }
  if (BlocklyGames.LEVEL == 10) {
    if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                                          BlocklyGames.LEVEL)) {
      // Level 10 gets an introductory modal dialog.
      // Skip the dialog if the user has already won.
      var content = document.getElementById('dialogHelpWallFollow');
      var style = {
        'width': '30%',
        'left': '35%',
        'top': '12em'
      };
      BlocklyDialogs.showDialog(content, null, false, true, style,
          BlocklyDialogs.stopDialogKeyDown);
      BlocklyDialogs.startDialogKeyDown();
      setTimeout(BlocklyDialogs.abortOffer, 5 * 60 * 1000);
    }
  } else {
    // All other levels get interactive help.  But wait 5 seconds for the
    // user to think a bit before they are told what to do.
    setTimeout(function() {
      BlocklyGames.workspace.addChangeListener(Maze3.levelHelp);
      Maze3.levelHelp();
    }, 5000);
  }

  // Add the spinning Pegman icon to the done dialog.
  // <img id="pegSpin" src="common/1x1.gif">
  var buttonDiv = document.getElementById('dialogDoneButtons');
  var pegSpin = document.createElement('img');
  pegSpin.id = 'pegSpin';
  pegSpin.src = 'common/1x1.gif';
  pegSpin.style.backgroundImage = 'url(' + Maze3.SKIN.sprite + ')';
  buttonDiv.parentNode.insertBefore(pegSpin, buttonDiv);

  // Lazy-load the JavaScript interpreter.
  setTimeout(BlocklyInterface.importInterpreter, 1);
  // Lazy-load the syntax-highlighting.
  setTimeout(BlocklyInterface.importPrettify, 1);
};

/**
 * When the workspace changes, update the help as needed.
 * @param {Blockly.Events.Abstract=} opt_event Custom data for event.
 */
Maze3.levelHelp = function(opt_event) {
  if (opt_event && opt_event.type == Blockly.Events.UI) {
    // Just a change to highlighting or somesuch.
    return;
  } else if (BlocklyGames.workspace.isDragging()) {
    // Don't change helps during drags.
    return;
  } else if (Maze3.result == Maze3.ResultType.SUCCESS ||
             BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                                               BlocklyGames.LEVEL)) {
    // The user has already won.  They are just playing around.
    return;
  }
  var rtl = BlocklyGames.isRtl();
  var userBlocks = Blockly.Xml.domToText(
      Blockly.Xml.workspaceToDom(BlocklyGames.workspace));
  var toolbar = BlocklyGames.workspace.flyout_.workspace_.getTopBlocks(true);
  var content = null;
  var origin = null;
  var style = null;
  if (BlocklyGames.LEVEL == 1) {
    if (BlocklyGames.workspace.getAllBlocks().length < 2) {
      content = document.getElementById('dialogHelpStack');
      style = {'width': '370px', 'top': '130px'};
      style[rtl ? 'right' : 'left'] = '215px';
      origin = toolbar[0].getSvgRoot();
    } else {
      var topBlocks = BlocklyGames.workspace.getTopBlocks(true);
      if (topBlocks.length > 1) {
        var xml = [
            '<xml>',
              '<block type="maze_moveForward" x="10" y="10">',
                '<next>',
                  '<block type="maze_moveForward"></block>',
                '</next>',
              '</block>',
            '</xml>'];
        BlocklyInterface.injectReadonly('sampleOneTopBlock', xml);
        content = document.getElementById('dialogHelpOneTopBlock');
        style = {'width': '360px', 'top': '120px'};
        style[rtl ? 'right' : 'left'] = '225px';
        origin = topBlocks[0].getSvgRoot();
      } else if (Maze3.result == Maze3.ResultType.UNSET) {
        // Show run help dialog.
        content = document.getElementById('dialogHelpRun');
        style = {'width': '360px', 'top': '410px'};
        style[rtl ? 'right' : 'left'] = '400px';
        origin = document.getElementById('runButton');
      }
    }
  } else if (BlocklyGames.LEVEL == 2) {
    if (Maze3.result != Maze3.ResultType.UNSET &&
        document.getElementById('runButton').style.display == 'none') {
      content = document.getElementById('dialogHelpReset');
      style = {'width': '360px', 'top': '410px'};
      style[rtl ? 'right' : 'left'] = '400px';
      origin = document.getElementById('resetButton');
    }
  } else if (BlocklyGames.LEVEL == 3) {
    if (userBlocks.indexOf('maze_forever') == -1) {
      if (BlocklyGames.workspace.remainingCapacity() == 0) {
        content = document.getElementById('dialogHelpCapacity');
        style = {'width': '430px', 'top': '310px'};
        style[rtl ? 'right' : 'left'] = '50px';
        origin = document.getElementById('capacityBubble');
      } else {
        content = document.getElementById('dialogHelpRepeat');
        style = {'width': '360px', 'top': '360px'};
        style[rtl ? 'right' : 'left'] = '425px';
        origin = toolbar[3].getSvgRoot();
      }
    }
  } else if (BlocklyGames.LEVEL == 4) {
    if (BlocklyGames.workspace.remainingCapacity() == 0 &&
        (userBlocks.indexOf('maze_forever') == -1 ||
         BlocklyGames.workspace.getTopBlocks(false).length > 1)) {
      content = document.getElementById('dialogHelpCapacity');
      style = {'width': '430px', 'top': '310px'};
      style[rtl ? 'right' : 'left'] = '50px';
      origin = document.getElementById('capacityBubble');
    } else {
      var showHelp = true;
      // Only show help if there is not a loop with two nested blocks.
      var blocks = BlocklyGames.workspace.getAllBlocks();
      for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        if (block.type != 'maze_forever') {
          continue;
        }
        var j = 0;
        while (block) {
          var kids = block.getChildren();
          block = kids.length ? kids[0] : null;
          j++;
        }
        if (j > 2) {
          showHelp = false;
          break;
        }
      }
      if (showHelp) {
        content = document.getElementById('dialogHelpRepeatMany');
        style = {'width': '360px', 'top': '360px'};
        style[rtl ? 'right' : 'left'] = '425px';
        origin = toolbar[3].getSvgRoot();
      }
    }
  } else if (BlocklyGames.LEVEL == 5) {
    if (Maze3.SKIN_ID == 0 && !Maze3.showPegmanMenu.activatedOnce) {
      content = document.getElementById('dialogHelpSkins');
      style = {'width': '360px', 'top': '60px'};
      style[rtl ? 'left' : 'right'] = '20px';
      origin = document.getElementById('pegmanButton');
    }
  } else if (BlocklyGames.LEVEL == 6) {
    if (userBlocks.indexOf('maze_if') == -1) {
      content = document.getElementById('dialogHelpIf');
      style = {'width': '360px', 'top': '430px'};
      style[rtl ? 'right' : 'left'] = '425px';
      origin = toolbar[4].getSvgRoot();
    }
  } else if (BlocklyGames.LEVEL == 7) {
    if (!Maze3.levelHelp.initialized7_) {
      // Create fake dropdown.
      var span = document.createElement('span');
      span.className = 'helpMenuFake';
      var options =
          [BlocklyGames.getMsg('Maze_pathAhead'),
           BlocklyGames.getMsg('Maze_pathLeft'),
           BlocklyGames.getMsg('Maze_pathRight')];
      var prefix = Blockly.utils.commonWordPrefix(options);
      var suffix = Blockly.utils.commonWordSuffix(options);
      if (suffix) {
        var option = options[0].slice(prefix, -suffix);
      } else {
        var option = options[0].substring(prefix);
      }
      // Add dropdown arrow: "option ▾" (LTR) or "▾ אופציה" (RTL)
      span.textContent = option + ' ' + Blockly.FieldDropdown.ARROW_CHAR;
      // Inject fake dropdown into message.
      var container = document.getElementById('helpMenuText');
      var msg = container.textContent;
      container.textContent = '';
      var parts = msg.split(/%\d/);
      for (var i = 0; i < parts.length; i++) {
        container.appendChild(document.createTextNode(parts[i]));
        if (i != parts.length - 1) {
          container.appendChild(span.cloneNode(true));
        }
      }
      Maze3.levelHelp.initialized7_ = true;
    }
    // The hint says to change from 'ahead', but keep the hint visible
    // until the user chooses 'right'.
    if (userBlocks.indexOf('isPathRight') == -1) {
      content = document.getElementById('dialogHelpMenu');
      style = {'width': '360px', 'top': '430px'};
      style[rtl ? 'right' : 'left'] = '425px';
      origin = toolbar[4].getSvgRoot();
    }
  } else if (BlocklyGames.LEVEL == 9) {
    if (userBlocks.indexOf('maze_ifElse') == -1) {
      content = document.getElementById('dialogHelpIfElse');
      style = {'width': '360px', 'top': '305px'};
      style[rtl ? 'right' : 'left'] = '425px';
      origin = toolbar[5].getSvgRoot();
    }
  }
  if (content) {
    if (content.parentNode != document.getElementById('dialog')) {
      BlocklyDialogs.showDialog(content, origin, true, false, style, null);
    }
  } else {
    BlocklyDialogs.hideDialog(false);
  }
};

/**
 * Reload with a different Pegman skin.
 * @param {number} newSkin ID of new skin.
 */
Maze3.changePegman = function(newSkin) {
  Maze3.saveToStorage();
  window.location = window.location.protocol + '//' +
      window.location.host + window.location.pathname +
      '?lang=' + BlocklyGames.LANG + '&level=' + BlocklyGames.LEVEL +
      '&skin=' + newSkin;
};

/**
 * Save the blocks for a one-time reload.
 */
Maze3.saveToStorage = function() {
  // MSIE 11 does not support sessionStorage on file:// URLs.
  if (typeof Blockly != undefined && window.sessionStorage) {
    var xml = Blockly.Xml.workspaceToDom(BlocklyGames.workspace);
    var text = Blockly.Xml.domToText(xml);
    window.sessionStorage.loadOnceBlocks = text;
  }
};

/**
 * Display the Pegman skin-change menu.
 * @param {!Event} e Mouse, touch, or resize event.
 */
Maze3.showPegmanMenu = function(e) {
  var menu = document.getElementById('pegmanMenu');
  if (menu.style.display == 'block') {
    // Menu is already open.  Close it.
    Maze3.hidePegmanMenu(e);
    return;
  }
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var button = document.getElementById('pegmanButton');
  button.classList.add('buttonHover');
  menu.style.top = (button.offsetTop + button.offsetHeight) + 'px';
  menu.style.left = button.offsetLeft + 'px';
  menu.style.display = 'block';
  Maze3.pegmanMenuMouse_ =
      Blockly.bindEvent_(document.body, 'mousedown', null, Maze3.hidePegmanMenu);
  // Close the skin-changing hint if open.
  var hint = document.getElementById('dialogHelpSkins');
  if (hint && hint.className != 'dialogHiddenContent') {
    BlocklyDialogs.hideDialog(false);
  }
  Maze3.showPegmanMenu.activatedOnce = true;
};

/**
 * Hide the Pegman skin-change menu.
 * @param {!Event} e Mouse, touch, or resize event.
 */
Maze3.hidePegmanMenu = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  document.getElementById('pegmanMenu').style.display = 'none';
  document.getElementById('pegmanButton').classList.remove('buttonHover');
  if (Maze3.pegmanMenuMouse_) {
    Blockly.unbindEvent_(Maze3.pegmanMenuMouse_);
    delete Maze3.pegmanMenuMouse_;
  }
};

/**
 * Reset the maze to the start position and kill any pending animation tasks.
 * @param {boolean} first True if an opening animation is to be played.
 */
Maze3.reset = function(first) {
  // Kill all tasks.
  for (var i = 0; i < Maze3.pidList.length; i++) {
    window.clearTimeout(Maze3.pidList[i]);
  }
  Maze3.pidList = [];

  // Move Pegman into position.
  Maze3.pegmanX = Maze3.start_.x;
  Maze3.pegmanY = Maze3.start_.y;

  if (first) {
    Maze3.pegmanD = Maze3.startDirection + 1;
    Maze3.scheduleFinish(false);
    Maze3.pidList.push(setTimeout(function() {
      Maze3.stepSpeed = 100;
      Maze3.schedule([Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4],
                    [Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4 - 4]);
      Maze3.pegmanD++;
    }, Maze3.stepSpeed * 5));
  } else {
    Maze3.pegmanD = Maze3.startDirection;
    Maze3.displayPegman(Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4);
  }

  // Move the finish icon into position.
  var finishIcon = document.getElementById('finish');
  finishIcon.setAttribute('x', Maze3.SQUARE_SIZE * (Maze3.finish_.x + 0.5) -
      finishIcon.getAttribute('width') / 2);
  finishIcon.setAttribute('y', Maze3.SQUARE_SIZE * (Maze3.finish_.y + 0.6) -
      finishIcon.getAttribute('height'));

  // Make 'look' icon invisible and promote to top.
  var lookIcon = document.getElementById('look');
  lookIcon.style.display = 'none';
  lookIcon.parentNode.appendChild(lookIcon);
  var paths = lookIcon.getElementsByTagName('path');
  for (var i = 0, path; (path = paths[i]); i++) {
    path.setAttribute('stroke', Maze3.SKIN.look);
  }
};

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */
Maze3.runButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  BlocklyDialogs.hideDialog(false);
  // Only allow a single top block on level 1.
  if (BlocklyGames.LEVEL == 1 &&
      BlocklyGames.workspace.getTopBlocks(false).length > 1 &&
      Maze3.result != Maze3.ResultType.SUCCESS &&
      !BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                                         BlocklyGames.LEVEL)) {
    Maze3.levelHelp();
    return;
  }
  var runButton = document.getElementById('runButton');
  var resetButton = document.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  runButton.style.display = 'none';
  resetButton.style.display = 'inline';
  Maze3.reset(false);
  Maze3.execute();
};

/**
 * Updates the document's 'capacity' element with a message
 * indicating how many more blocks are permitted.  The capacity
 * is retrieved from BlocklyGames.workspace.remainingCapacity().
 */
Maze3.updateCapacity = function() {
  var cap = BlocklyGames.workspace.remainingCapacity();
  var p = document.getElementById('capacity');
  if (cap == Infinity) {
    p.style.display = 'none';
  } else {
    p.style.display = 'inline';
    p.innerHTML = '';
    cap = Number(cap);
    var capSpan = document.createElement('span');
    capSpan.className = 'capacityNumber';
    capSpan.appendChild(document.createTextNode(cap));
    if (cap == 0) {
      var msg = BlocklyGames.getMsg('Maze_capacity0');
    } else if (cap == 1) {
      var msg = BlocklyGames.getMsg('Maze_capacity1');
    } else {
      var msg = BlocklyGames.getMsg('Maze_capacity2');
    }
    var parts = msg.split(/%\d/);
    for (var i = 0; i < parts.length; i++) {
      p.appendChild(document.createTextNode(parts[i]));
      if (i != parts.length - 1) {
        p.appendChild(capSpan.cloneNode(true));
      }
    }
  }
};

/**
 * Click the reset button.  Reset the maze.
 * @param {!Event} e Mouse or touch event.
 */
Maze3.resetButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  runButton.style.display = 'inline';
  document.getElementById('resetButton').style.display = 'none';
  BlocklyGames.workspace.highlightBlock(null);
  Maze3.reset(false);
  Maze3.levelHelp();
};

/**
 * Inject the Maze API into a JavaScript interpreter.
 * @param {!Interpreter} interpreter The JS Interpreter.
 * @param {!Interpreter.Object} scope Global scope.
 */
Maze3.initInterpreter = function(interpreter, scope) {
  // API
  var wrapper;
  wrapper = function(id) {
    Maze3.move(0, id);
  };
  interpreter.setProperty(scope, 'moveForward',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id) {
    Maze3.move(2, id);
  };
  interpreter.setProperty(scope, 'moveBackward',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id) {
    Maze3.turn(0, id);
  };
  interpreter.setProperty(scope, 'turnLeft',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id) {
    Maze3.turn(1, id);
  };
  interpreter.setProperty(scope, 'turnRight',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id) {
    return Maze3.isPath(0, id);
  };
  interpreter.setProperty(scope, 'isPathForward',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id) {
    return Maze3.isPath(1, id);
  };
  interpreter.setProperty(scope, 'isPathRight',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id) {
    return Maze3.isPath(2, id);
  };
  interpreter.setProperty(scope, 'isPathBackward',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id) {
    return Maze3.isPath(3, id);
  };
  interpreter.setProperty(scope, 'isPathLeft',
      interpreter.createNativeFunction(wrapper));
  wrapper = function() {
    return Maze3.notDone();
  };
  interpreter.setProperty(scope, 'notDone',
      interpreter.createNativeFunction(wrapper));
};

/**
 * Execute the user's code.  Heaven help us...
 */
Maze3.execute = function() {
  if (!('Interpreter' in window)) {
    // Interpreter lazy loads and hasn't arrived yet.  Try again later.
    setTimeout(Maze3.execute, 250);
    return;
  }

  Maze3.log = [];
  Blockly.selected && Blockly.selected.unselect();
  var code = Blockly.JavaScript.workspaceToCode(BlocklyGames.workspace);
  Maze3.result = Maze3.ResultType.UNSET;
  var interpreter = new Interpreter(code, Maze3.initInterpreter);

  // Try running the user's code.  There are four possible outcomes:
  // 1. If pegman reaches the finish [SUCCESS], true is thrown.
  // 2. If the program is terminated due to running too long [TIMEOUT],
  //    false is thrown.
  // 3. If another error occurs [ERROR], that error is thrown.
  // 4. If the program ended normally but without solving the maze [FAILURE],
  //    no error or exception is thrown.
  try {
    var ticks = 10000;  // 10k ticks runs Pegman for about 8 minutes.
    while (interpreter.step()) {
      if (ticks-- == 0) {
        throw Infinity;
      }
    }
    Maze3.result = Maze3.notDone() ?
        Maze3.ResultType.FAILURE : Maze3.ResultType.SUCCESS;
  } catch (e) {
    // A boolean is thrown for normal termination.
    // Abnormal termination is a user error.
    if (e === Infinity) {
      Maze3.result = Maze3.ResultType.TIMEOUT;
    } else if (e === false) {
      Maze3.result = Maze3.ResultType.ERROR;
    } else {
      // Syntax error, can't happen.
      Maze3.result = Maze3.ResultType.ERROR;
      alert(e);
    }
  }

  // Fast animation if execution is successful.  Slow otherwise.
  if (Maze3.result == Maze3.ResultType.SUCCESS) {
    Maze3.stepSpeed = 100;
    Maze3.log.push(['finish', null]);
  } else {
    Maze3.stepSpeed = 150;
  }

  // Maze3.log now contains a transcript of all the user's actions.
  // Reset the maze and animate the transcript.
  Maze3.reset(false);
  Maze3.pidList.push(setTimeout(Maze3.animate, 100));
};

/**
 * Iterate through the recorded path and animate pegman's actions.
 */
Maze3.animate = function() {
  var action = Maze3.log.shift();
  if (!action) {
    BlocklyInterface.highlight(null);
    Maze3.levelHelp();
    return;
  }
  BlocklyInterface.highlight(action[1]);

  switch (action[0]) {
    case 'north':
      Maze3.schedule([Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4],
                    [Maze3.pegmanX, Maze3.pegmanY - 1, Maze3.pegmanD * 4]);
      Maze3.pegmanY--;
      break;
    case 'east':
      Maze3.schedule([Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4],
                    [Maze3.pegmanX + 1, Maze3.pegmanY, Maze3.pegmanD * 4]);
      Maze3.pegmanX++;
      break;
    case 'south':
      Maze3.schedule([Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4],
                    [Maze3.pegmanX, Maze3.pegmanY + 1, Maze3.pegmanD * 4]);
      Maze3.pegmanY++;
      break;
    case 'west':
      Maze3.schedule([Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4],
                    [Maze3.pegmanX - 1, Maze3.pegmanY, Maze3.pegmanD * 4]);
      Maze3.pegmanX--;
      break;
    case 'look_north':
      Maze3.scheduleLook(Maze3.DirectionType.NORTH);
      break;
    case 'look_east':
      Maze3.scheduleLook(Maze3.DirectionType.EAST);
      break;
    case 'look_south':
      Maze3.scheduleLook(Maze3.DirectionType.SOUTH);
      break;
    case 'look_west':
      Maze3.scheduleLook(Maze3.DirectionType.WEST);
      break;
    case 'fail_forward':
      Maze3.scheduleFail(true);
      break;
    case 'fail_backward':
      Maze3.scheduleFail(false);
      break;
    case 'left':
      Maze3.schedule([Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4],
                    [Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4 - 4]);
      Maze3.pegmanD = Maze3.constrainDirection4(Maze3.pegmanD - 1);
      break;
    case 'right':
      Maze3.schedule([Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4],
                    [Maze3.pegmanX, Maze3.pegmanY, Maze3.pegmanD * 4 + 4]);
      Maze3.pegmanD = Maze3.constrainDirection4(Maze3.pegmanD + 1);
      break;
    case 'finish':
      Maze3.scheduleFinish(true);
      BlocklyInterface.saveToLocalStorage();
      setTimeout(BlocklyDialogs.congratulations, 1000);
  }

  Maze3.pidList.push(setTimeout(Maze3.animate, Maze3.stepSpeed * 5));
};

/**
 * Point the congratulations Pegman to face the mouse.
 * @param {Event} e Mouse move event.
 * @private
 */
Maze3.updatePegSpin_ = function(e) {
  if (document.getElementById('dialogDone').className ==
      'dialogHiddenContent') {
    return;
  }
  var pegSpin = document.getElementById('pegSpin');
  var bBox = BlocklyDialogs.getBBox_(pegSpin);
  var x = bBox.x + bBox.width / 2 - window.pageXOffset;
  var y = bBox.y + bBox.height / 2 - window.pageYOffset;
  var dx = e.clientX - x;
  var dy = e.clientY - y;
  var angle = Math.atan(dy / dx);
  // Convert from radians to degrees because I suck at math.
  angle = angle / Math.PI * 180;
  // 0: North, 90: East, 180: South, 270: West.
  if (dx > 0) {
    angle += 90;
  } else {
    angle += 270;
  }
  // Divide into 16 quads.
  var quad = Math.round(angle / 360 * 16);
  if (quad == 16) {
    quad = 15;
  }
  // Display correct Pegman sprite.
  pegSpin.style.backgroundPosition = (-quad * Maze3.PEGMAN_WIDTH) + 'px 0px';
};

/**
 * Schedule the animations for a move or turn.
 * @param {!Array.<number>} startPos X, Y and direction starting points.
 * @param {!Array.<number>} endPos X, Y and direction ending points.
 */
Maze3.schedule = function(startPos, endPos) {
  var deltas = [(endPos[0] - startPos[0]) / 4,
                (endPos[1] - startPos[1]) / 4,
                (endPos[2] - startPos[2]) / 4];
  Maze3.displayPegman(startPos[0] + deltas[0],
                     startPos[1] + deltas[1],
                     Maze3.constrainDirection16(startPos[2] + deltas[2]));
  Maze3.pidList.push(setTimeout(function() {
      Maze3.displayPegman(startPos[0] + deltas[0] * 2,
          startPos[1] + deltas[1] * 2,
          Maze3.constrainDirection16(startPos[2] + deltas[2] * 2));
    }, Maze3.stepSpeed));
  Maze3.pidList.push(setTimeout(function() {
      Maze3.displayPegman(startPos[0] + deltas[0] * 3,
          startPos[1] + deltas[1] * 3,
          Maze3.constrainDirection16(startPos[2] + deltas[2] * 3));
    }, Maze3.stepSpeed * 2));
  Maze3.pidList.push(setTimeout(function() {
      Maze3.displayPegman(endPos[0], endPos[1],
          Maze3.constrainDirection16(endPos[2]));
    }, Maze3.stepSpeed * 3));
};

/**
 * Schedule the animations and sounds for a failed move.
 * @param {boolean} forward True if forward, false if backward.
 */
Maze3.scheduleFail = function(forward) {
  var deltaX = 0;
  var deltaY = 0;
  switch (Maze3.pegmanD) {
    case Maze3.DirectionType.NORTH:
      deltaY = -1;
      break;
    case Maze3.DirectionType.EAST:
      deltaX = 1;
      break;
    case Maze3.DirectionType.SOUTH:
      deltaY = 1;
      break;
    case Maze3.DirectionType.WEST:
      deltaX = -1;
      break;
  }
  if (!forward) {
    deltaX = -deltaX;
    deltaY = -deltaY;
  }
  if (Maze3.SKIN.crashType == Maze3.CRASH_STOP) {
    // Bounce bounce.
    deltaX /= 4;
    deltaY /= 4;
    var direction16 = Maze3.constrainDirection16(Maze3.pegmanD * 4);
    Maze3.displayPegman(Maze3.pegmanX + deltaX,
                       Maze3.pegmanY + deltaY,
                       direction16);
    BlocklyGames.workspace.getAudioManager().play('fail', 0.5);
    Maze3.pidList.push(setTimeout(function() {
      Maze3.displayPegman(Maze3.pegmanX,
                         Maze3.pegmanY,
                         direction16);
      }, Maze3.stepSpeed));
    Maze3.pidList.push(setTimeout(function() {
      Maze3.displayPegman(Maze3.pegmanX + deltaX,
                         Maze3.pegmanY + deltaY,
                         direction16);
      BlocklyGames.workspace.getAudioManager().play('fail', 0.5);
    }, Maze3.stepSpeed * 2));
    Maze3.pidList.push(setTimeout(function() {
        Maze3.displayPegman(Maze3.pegmanX, Maze3.pegmanY, direction16);
      }, Maze3.stepSpeed * 3));
  } else {
    // Add a small random delta away from the grid.
    var deltaZ = (Math.random() - 0.5) * 10;
    var deltaD = (Math.random() - 0.5) / 2;
    deltaX += (Math.random() - 0.5) / 4;
    deltaY += (Math.random() - 0.5) / 4;
    deltaX /= 8;
    deltaY /= 8;
    var acceleration = 0;
    if (Maze3.SKIN.crashType == Maze3.CRASH_FALL) {
      acceleration = 0.01;
    }
    Maze3.pidList.push(setTimeout(function() {
      BlocklyGames.workspace.getAudioManager().play('fail', 0.5);
    }, Maze3.stepSpeed * 2));
    var setPosition = function(n) {
      return function() {
        var direction16 = Maze3.constrainDirection16(Maze3.pegmanD * 4 +
                                                    deltaD * n);
        Maze3.displayPegman(Maze3.pegmanX + deltaX * n,
                           Maze3.pegmanY + deltaY * n,
                           direction16,
                           deltaZ * n);
        deltaY += acceleration;
      };
    };
    // 100 frames should get Pegman offscreen.
    for (var i = 1; i < 100; i++) {
      Maze3.pidList.push(setTimeout(setPosition(i),
          Maze3.stepSpeed * i / 2));
    }
  }
};

/**
 * Schedule the animations and sound for a victory dance.
 * @param {boolean} sound Play the victory sound.
 */
Maze3.scheduleFinish = function(sound) {
  var direction16 = Maze3.constrainDirection16(Maze3.pegmanD * 4);
  Maze3.displayPegman(Maze3.pegmanX, Maze3.pegmanY, 16);
  if (sound) {
    BlocklyGames.workspace.getAudioManager().play('win', 0.5);
  }
  Maze3.stepSpeed = 150;  // Slow down victory animation a bit.
  Maze3.pidList.push(setTimeout(function() {
    Maze3.displayPegman(Maze3.pegmanX, Maze3.pegmanY, 18);
    }, Maze3.stepSpeed));
  Maze3.pidList.push(setTimeout(function() {
    Maze3.displayPegman(Maze3.pegmanX, Maze3.pegmanY, 16);
    }, Maze3.stepSpeed * 2));
  Maze3.pidList.push(setTimeout(function() {
      Maze3.displayPegman(Maze3.pegmanX, Maze3.pegmanY, direction16);
    }, Maze3.stepSpeed * 3));
};

/**
 * Display Pegman at the specified location, facing the specified direction.
 * @param {number} x Horizontal grid (or fraction thereof).
 * @param {number} y Vertical grid (or fraction thereof).
 * @param {number} d Direction (0 - 15) or dance (16 - 17).
 * @param {number=} opt_angle Optional angle (in degrees) to rotate Pegman.
 */
Maze3.displayPegman = function(x, y, d, opt_angle) {
  var pegmanIcon = document.getElementById('pegman');
  pegmanIcon.setAttribute('x',
      x * Maze3.SQUARE_SIZE - d * Maze3.PEGMAN_WIDTH + 1);
  pegmanIcon.setAttribute('y',
      Maze3.SQUARE_SIZE * (y + 0.5) - Maze3.PEGMAN_HEIGHT / 2 - 8);
  if (opt_angle) {
    pegmanIcon.setAttribute('transform', 'rotate(' + opt_angle + ', ' +
        (x * Maze3.SQUARE_SIZE + Maze3.SQUARE_SIZE / 2) + ', ' +
        (y * Maze3.SQUARE_SIZE + Maze3.SQUARE_SIZE / 2) + ')');
  } else {
    pegmanIcon.setAttribute('transform', 'rotate(0, 0, 0)');
  }

  var clipRect = document.getElementById('clipRect');
  clipRect.setAttribute('x', x * Maze3.SQUARE_SIZE + 1);
  clipRect.setAttribute('y', pegmanIcon.getAttribute('y'));
};

/**
 * Display the look icon at Pegman's current location,
 * in the specified direction.
 * @param {!Maze3.DirectionType} d Direction (0 - 3).
 */
Maze3.scheduleLook = function(d) {
  var x = Maze3.pegmanX;
  var y = Maze3.pegmanY;
  switch (d) {
    case Maze3.DirectionType.NORTH:
      x += 0.5;
      break;
    case Maze3.DirectionType.EAST:
      x += 1;
      y += 0.5;
      break;
    case Maze3.DirectionType.SOUTH:
      x += 0.5;
      y += 1;
      break;
    case Maze3.DirectionType.WEST:
      y += 0.5;
      break;
  }
  x *= Maze3.SQUARE_SIZE;
  y *= Maze3.SQUARE_SIZE;
  var deg = d * 90 - 45;

  var lookIcon = document.getElementById('look');
  lookIcon.setAttribute('transform',
      'translate(' + x + ', ' + y + ') ' +
      'rotate(' + deg + ' 0 0) scale(.4)');
  var paths = lookIcon.getElementsByTagName('path');
  lookIcon.style.display = 'inline';
  for (var i = 0, path; (path = paths[i]); i++) {
    Maze3.scheduleLookStep(path, Maze3.stepSpeed * i);
  }
};

/**
 * Schedule one of the 'look' icon's waves to appear, then disappear.
 * @param {!Element} path Element to make appear.
 * @param {number} delay Milliseconds to wait before making wave appear.
 */
Maze3.scheduleLookStep = function(path, delay) {
  Maze3.pidList.push(setTimeout(function() {
    path.style.display = 'inline';
    setTimeout(function() {
      path.style.display = 'none';
    }, Maze3.stepSpeed * 2);
  }, delay));
};

/**
 * Keep the direction within 0-3, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Maze3.constrainDirection4 = function(d) {
  d = Math.round(d) % 4;
  if (d < 0) {
    d += 4;
  }
  return d;
};

/**
 * Keep the direction within 0-15, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Maze3.constrainDirection16 = function(d) {
  d = Math.round(d) % 16;
  if (d < 0) {
    d += 16;
  }
  return d;
};

// Core functions.

/**
 * Attempt to move pegman forward or backward.
 * @param {number} direction Direction to move (0 = forward, 2 = backward).
 * @param {string} id ID of block that triggered this action.
 * @throws {true} If the end of the maze is reached.
 * @throws {false} If Pegman collides with a wall.
 */
Maze3.move = function(direction, id) {
  if (!Maze3.isPath(direction, null)) {
    Maze3.log.push(['fail_' + (direction ? 'backward' : 'forward'), id]);
    throw false;
  }
  // If moving backward, flip the effective direction.
  var effectiveDirection = Maze3.pegmanD + direction;
  var command;
  switch (Maze3.constrainDirection4(effectiveDirection)) {
    case Maze3.DirectionType.NORTH:
      Maze3.pegmanY--;
      command = 'north';
      break;
    case Maze3.DirectionType.EAST:
      Maze3.pegmanX++;
      command = 'east';
      break;
    case Maze3.DirectionType.SOUTH:
      Maze3.pegmanY++;
      command = 'south';
      break;
    case Maze3.DirectionType.WEST:
      Maze3.pegmanX--;
      command = 'west';
      break;
  }
  Maze3.log.push([command, id]);
};

/**
 * Turn pegman left or right.
 * @param {number} direction Direction to turn (0 = left, 1 = right).
 * @param {string} id ID of block that triggered this action.
 */
Maze3.turn = function(direction, id) {
  if (direction) {
    // Right turn (clockwise).
    Maze3.pegmanD++;
    Maze3.log.push(['right', id]);
  } else {
    // Left turn (counterclockwise).
    Maze3.pegmanD--;
    Maze3.log.push(['left', id]);
  }
  Maze3.pegmanD = Maze3.constrainDirection4(Maze3.pegmanD);
};

/**
 * Is there a path next to pegman?
 * @param {number} direction Direction to look
 *     (0 = forward, 1 = right, 2 = backward, 3 = left).
 * @param {?string} id ID of block that triggered this action.
 *     Null if called as a helper function in Maze3.move().
 * @return {boolean} True if there is a path.
 */
Maze3.isPath = function(direction, id) {
  var effectiveDirection = Maze3.pegmanD + direction;
  var square;
  var command;
  switch (Maze3.constrainDirection4(effectiveDirection)) {
    case Maze3.DirectionType.NORTH:
      square = Maze3.map[Maze3.pegmanY - 1] &&
          Maze3.map[Maze3.pegmanY - 1][Maze3.pegmanX];
      command = 'look_north';
      break;
    case Maze3.DirectionType.EAST:
      square = Maze3.map[Maze3.pegmanY][Maze3.pegmanX + 1];
      command = 'look_east';
      break;
    case Maze3.DirectionType.SOUTH:
      square = Maze3.map[Maze3.pegmanY + 1] &&
          Maze3.map[Maze3.pegmanY + 1][Maze3.pegmanX];
      command = 'look_south';
      break;
    case Maze3.DirectionType.WEST:
      square = Maze3.map[Maze3.pegmanY][Maze3.pegmanX - 1];
      command = 'look_west';
      break;
  }
  if (id) {
    Maze3.log.push([command, id]);
  }
  return square !== Maze3.SquareType.WALL && square !== undefined;
};

/**
 * Is the player at the finish marker?
 * @return {boolean} True if not done, false if done.
 */
Maze3.notDone = function() {
  return Maze3.pegmanX != Maze3.finish_.x || Maze3.pegmanY != Maze3.finish_.y;
};

window.addEventListener('load', Maze3.init);
