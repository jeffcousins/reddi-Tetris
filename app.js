var tetris = (function() {
  var gameStart = false;

  /**
   * createGrid() generates a 10x22 grid using an HTML table. I'm mindful
   * about the unpopular use of single-character variables, but I use the
   * local variables x and y here to represent each cell's (x, y) coordinates.
   * Note that the "global" x and y variables represent the center point
   * of the current shape and its location on the #grid.
   */
  var createGrid = function() {
    var gameTable = document.getElementById("grid");
    for (var y = 0; y < 22; y++) {
      var newRow = document.createElement("tr");
      newRow.setAttribute("class", y);
      if (y === 1) {
        newRow.setAttribute("style", "border-bottom: 1px double tomato");
      }

      for (var x = 0; x < 10; x++) {
        var newCell = document.createElement("td");
        newCell.setAttribute("id", x);
        newCell.setAttribute("data-status", "empty");
        newRow.appendChild(newCell);
      }

      gameTable.appendChild(newRow);
    }
  };

  /**
   * updateShape() is an IIFE that first stores the relative coordinates of
   * the seven shapes and then returns a function that will return an array
   * quartet based on the current shape, rotation, and the x and y values.
   * The IIFE will prevent the program from reassigning the shapes in
   * different scopes. I'm not sure if it's even helping performance at all,
   * but it seems like it would be.
   * I plotted these shapes and their turn positions based on the Super
   * Rotation System found here: http://tetris.wikia.com/wiki/SRS
   * Hierarchy of arrays:
   * 7 shapes > each 'type' > each rotation > [x, y] of each of four blocks.
   */
  var updateShape = (function() {
    var shapes = [ [ [ [ 0,  0 ], [-1,  0 ], [ 1,  0 ], [ 2,  0 ] ],
                     [ [ 1, -1 ], [ 1,  0 ], [ 1,  1 ], [ 1,  2 ] ],
                     [ [-1,  1 ], [ 0,  1 ], [ 1,  1 ], [ 2,  1 ] ],
                     [ [ 0,  0 ], [ 0, -1 ], [ 0,  1 ], [ 0,  2 ] ]  ],

                   [ [ [ 0,  0 ], [ 1,  0 ], [-1,  0 ], [-1, -1 ] ],
                     [ [ 0,  0 ], [ 0,  1 ], [ 0,  -1], [ 1, -1 ] ],
                     [ [ 0,  0 ], [-1,  0 ], [ 1,  0 ], [ 1,  1 ] ],
                     [ [ 0,  0 ], [ 0, -1 ], [ 0,  1 ], [-1,  1 ] ]  ],

                   [ [ [ 0,  0 ], [-1,  0 ], [ 1,  0 ], [ 1, -1 ] ],
                     [ [ 0,  0 ], [ 0, -1 ], [ 0,  1 ], [ 1,  1 ] ],
                     [ [ 0,  0 ], [-1,  0 ], [ 1,  0 ], [-1,  1 ] ],
                     [ [ 0,  0 ], [ 0,  1 ], [ 0, -1 ], [-1, -1 ] ]  ],

                   [ [ [ 0,  0 ], [ 1,  0 ], [ 0, -1 ], [ 1, -1 ] ],
                     [ [ 0,  0 ], [ 1,  0 ], [ 0, -1 ], [ 1, -1 ] ],
                     [ [ 0,  0 ], [ 1,  0 ], [ 0, -1 ], [ 1, -1 ] ],
                     [ [ 0,  0 ], [ 1,  0 ], [ 0, -1 ], [ 1, -1 ] ]  ],

                   [ [ [ 0,  0 ], [-1,  0 ], [ 0, -1 ], [ 1, -1 ] ],
                     [ [ 0,  0 ], [ 0, -1 ], [ 1,  0 ], [ 1,  1 ] ],
                     [ [ 0,  0 ], [ 1,  0 ], [ 0,  1 ], [-1,  1 ] ],
                     [ [ 0,  0 ], [-1, -1 ], [-1,  0 ], [ 0,  1 ] ]  ],

                   [ [ [ 0,  0 ], [-1,  0 ], [ 0, -1 ], [ 1,  0 ] ],
                     [ [ 0,  0 ], [ 0, -1 ], [ 1,  0 ], [ 0,  1 ] ],
                     [ [ 0,  0 ], [-1,  0 ], [ 1,  0 ], [ 0,  1 ] ],
                     [ [ 0,  0 ], [-1,  0 ], [ 0, -1 ], [ 0,  1 ] ]  ],

                   [ [ [ 0,  0 ], [ 1,  0 ], [ 0, -1 ], [-1, -1 ] ],
                     [ [ 0,  0 ], [ 0,  1 ], [ 1,  0 ], [ 1, -1 ] ],
                     [ [ 0,  0 ], [-1,  0 ], [ 0,  1 ], [ 1,  1 ] ],
                     [ [ 0,  0 ], [-1,  0 ], [ 0, -1 ], [-1,  1 ] ]  ]  ];

    /**
     * Since a shapeID doesn't change until a new shape is created, an
     * optional parameter (pos) can be passed in to shift the shape's
     * positional ID (turnPos) via rotate().
     */
    return function(pos) {
      return shapes[shapeID][(pos || turnPos)].map(function(block) {
        return [block[0] + x, block[1] + y];
      });
    };
  })();

  // randomFloor() creates a random integer between 0 and (max - 1).
  var randomFloor = function(max) {
    return Math.floor(Math.random() * max);
  };

  const emptyColor = '#f3f3f3';
  const deadColor = '#444444';
  const colors = ['#60C9F8', '#177EFB', '#FD9427', '#FECB2F', '#53D769', '#FC3159', '#FC3D39'];

  /**
   * The Primary Variables:
   * The variables x and y represent the current center point at any given
   * time. They begin and reset back to (4, 1) with every createShape() call.
   * They are updated with every   ->   refresh() { ...updateShape() }   <-
   * call within move() or rotate(). Applied to updateShape(), these make
   * up the active shape.
   */
  var x = 4;
  var y = 0;
  var turnPos = 0;
  var shapeID = randomFloor(7);
  var currentColor = colors[shapeID];

  // currentShape always hold one array housing a quartet of [x, y] values.
  var currentShape = updateShape();

  // createShape() resets the primary variables to generate a new shape at
  // the top of the grid.
  var createShape = function() {
    x = 4;
    y = 1;
    shapeID = randomFloor(7);
    turnPos = 0;
    currentColor = colors[shapeID];
    scoreColor();
  };

  // Passing in a shape, paint() takes its array quartet and issues the
  // passed-in color and data 'status' for each block's location on the grid.
  var paint = function(shape, color, cellStatus) {
    shape.forEach(function(block) {
      $('.' + block[1]).find('#' + block[0])
        .css('background-color', color)
        .data('status', cellStatus);
    });
  };

  /**
   * refresh() is invoked when the primary shape values have changed and the
   * grid needs to reflect them.
   * e.g., the primary shape values change (but currentShape is still the
   * same four [x, y] arrays) -> paint() currentShape to 'empty' -> update
   * currentShape to match the primary values -> paint the new coordinates
   */
  var refresh = function(cellStatus, color) {
    paint(currentShape, color, cellStatus);
    currentShape = updateShape();
    paint(currentShape, currentColor, 'active');
  }

  /**
   * validMove() returns a boolean value based on the array quartet of
   * an attempted move. A block moving out of bounds or into a 'dead' cell
   * returns false.
   */
  var validMove = function(shapeToTest) {
    var result = true;
    shapeToTest.forEach(function(block) {
      if (block[0] > 9 || block[0] < 0 || block[1] > 21 ||
          $('.' + block[1]).find('#' + block[0]).data('status') === 'dead') {
        result = false;
      }
    });

    return result;
  };

  /**
   * rotate() cycles through the four "turnPos" array sets of the current
   * shapes[shapeID] and will updateShape() the currentShape to
   * the correct quartet of [x, y] coordinates.
   *
   * shapeShift() cycles through positional ID integers [0] to [3] and
   * then returns that integer. We pass it into updateShape() which will
   * return and pass the next quartet into validMove() for deliberation.
   */
  var rotate = function() {
    var shapeShift = function() {
      turnPos < 3 ? turnPos++ : turnPos = 0;
      return turnPos;
    };

    // currentPos temporarily stores the present turnPos value in case the
    // move comes out false.
    var currentPos = turnPos;
    if (validMove(updateShape(shapeShift()))) {
      refresh('empty', emptyColor);
    } else {
      turnPos = currentPos;
    }
  };

  /**
   * move() is invoked when the Left, Right, or Down key is pressed.
   * Every setTimeout call of gravity() invokes it with the 'down' argument.
   * The function first duplicates a testShape by mapping the values of the
   * current shape and shifting each block's [x, y] according to the
   * proposed move. This way, the "global" x and y variables aren't modified
   * if all four blocks can't shift together.
   * If the testShape is out of bounds or trespasses a cell with a 'dead'
   * status--by passing the testShape through validMove()--nothing happens.
   * ...Unless it's a 'down' move.
   */
  var move = function(dir) {
    var testShape;
    var xTest = 0;
    var yTest = 0;
    if (dir === 'right') {
      xTest = 1;
    } else if (dir === 'left') {
      xTest = -1;
    } else if (dir === 'down') {
      yTest = 1;
    }

    testShape = currentShape.map(function(block) {
      return [block[0] + xTest, block[1] + yTest];
    });

    // Test the testShape with validMove(). If true, update x or y and call
    // refresh() to empty the shape before updating the currentShape.
    if (validMove(testShape)) {
      if (dir === 'right') {
        x++;
      } else if (dir === 'left') {
        x--;
      } else if (dir === 'down') {
        y++;
      }

      refresh('empty', emptyColor);
    } else {

    /**
     * If a proposed 'down' move returns false, call createShape() to reset
     * the primary variables, call refresh() to "kill" the currentShape,
     * then update the currentShape with the new createShape() values.
     * Invoke lineClear() to check if any rows are completely full
     * of 'dead' shapes. If one of the four innermost cells in the third row
     * at $('.2') is dead, end the game with gameOver(). It will also
     * terminate if any cell in the second row is dead.
     */
      if (dir === 'down') {
        createShape();
        refresh('dead', deadColor);
        lineClear();
        if ( $('.2').find('#3').data('status') === 'dead' ||
             $('.2').find('#4').data('status') === 'dead' ||
             $('.2').find('#5').data('status') === 'dead' ||
             $('.2').find('#6').data('status') === 'dead' ||
             $('.1').children().data('status') === 'dead') {

          // Clear #instructions if it hasn't already.
          if (lines === 0) {
            clearInstructions();
          }
          fetchPost("<a href='http://bit.ly/18gECvy' id='sorry' target='_blank' " +
                    "class='hr'>Game Over.</a> :(");
          gameOver();
        }
      }
    }
  };

  // gravity() continuously moves your shape down. The function calls itself
  // with setTimeout and shortens the tempo each time.
  var tempo = 600;
  var gravity = function() {
    move('down');
    if (tempo > 500) {
      tempo -= 2;
    } else if (tempo > 350) {
      tempo -= 1;
    } else if (tempo > 175) {
      tempo -= 0.25;
    }

    setTimeout(gravity, tempo);
  };

  /**
   * Starting from the bottom of the grid, lineClear() goes row-by-row and
   * checks if all 10 cells have a 'dead' data status. This function is
   * called every time a move('down') is unsuccessful.
   * deadCount keeps track of the number of full rows.
   * Note that the x and y variables here are local and refer to the current
   * cell inspection on the present grid environment.
   */
  var lines = 0;
  var lineClear = function() {
    var deadCount = 0;
    var fallingStatus;
    var fallingColor;
    var linesBelow;

    // (y > 1) because the top two rows are out of bounds and needn't be
    // cloned onto any other rows.
    for (var y = 21; y > 1; y--) {
      var full = true;

      for (var x = 0; x < 10; x++) {
        if ($('.' + y).find('#' + x).data('status') !== 'dead') {
          full = false;
        }

        /**
         * As lineClear() is doing its individual cell checks, if there
         * have been any full rows so far, it will record the color and
         * status of every cell thereafter. It will then copy those values
         * onto the corresponding cell located (linesBelow) rows below
         * after its inspection.
         */
        if (deadCount > 0) {
          linesBelow = deadCount;

        /**
         * The reason I'm passing linesBelow instead of deadCount is because
         * of a minor bug. Let's say dead blocks were stacked near the top
         * on the far-left side, and I clear the bottom four lines with a
         * "straight line" shape vie the empty space to get there on the
         * right side of the grid. Cells on the third row (y) would be
         * copied to cells on the seventh row (y + deadCount) at the end of
         * this block of code, but there's no way to duplicate an out-of-
         * bounds cell to the third row.
         * Once lineClear() reaches the point where all distinct cells have
         * dropped, it will pick up where it left off, stop copying values
         * downward, and instead revert the subsequent cells to the 'empty'
         * values.
         */
          if (y - 1 <= deadCount) {
            fallingStatus = 'empty';
            fallingColor = emptyColor;
            linesBelow = 0;
          } else {
            var fallingStatus = $('.' + y).find('#' + x).data('status');
            var fallingColor = $('.' + y).find('#' + x).css('background-color');
          }

          $('.' + (y + linesBelow)).find('#' + x)
            .css('background-color', fallingColor)
            .data('status', fallingStatus);
        }
      }

      if (full) {
        deadCount++;

        // Remove the #instructions div/text for the incoming Reddit posts
        // after clearing the first line.
        if (lines === 0) {
          clearInstructions();
        }

        // Update score for each line cleared and rewards the player
        // with a well-deserved Reddit post.
        lines++;
        scoreColor();
        fetchPost();
      }
    }
  };

  /**
   * clearInstructions() removes the introductory text inside the #frame div.
   * It will be called once: after the first line clear or when the user
   * loses the game, whichever comes first.
   */
  var clearInstructions = function() {
    $('#instructions').remove();
  };

  /**
   * reddit() uses jQuery.AJAX to retrieve the top 100 Reddit /r/aww posts
   * of the last 24 hours in JSON format. Upon success, it will map an array
   * of objects, each with a thumbnail image URL and title to represent each
   * post. This will be stored in redditMap.
   * e.g. [[{image: 'a URL', title: 'a title'}], [{image..., title...}] ... ]
   */
  var redditMap;
  var reddit = function() {
    $.ajax({
      type: "GET",
      url: "http://www.reddit.com/r/aww.json?sort=top&t=day&limit=100",
      success: function(JSON) {
        redditMap = JSON.data.children.slice(0, 100).map(function(post) {
          return {
            image: post.data.thumbnail,
            title: post.data.title
          };
        });
      }
    });
  };

  /**
   * randomPost() removes an element from an array and returns that element.
   * randomFloor() will be reused as the callback function when invoked.
   * Since .splice() returns an array, affixing [0] to it will return the
   * object within.
   *
   * fetchPost() extracts a random {image, title} object from the redditMap
   * array by invoking randomPost(), followed by using jQuery to display it.
   * The jQuery methods append a nice .postBox to the DOM element #frame and
   * scrolls it into view. If an argument is passed in for fetchPost(), it
   * will override the title property.
   */
  var currentPost;
  var fetchPost = function(endPost) {
    var randomPost = function(callback, array) {
      return array.splice(callback(array.length), 1)[0];
    };

    currentPost = randomPost(randomFloor, redditMap);
    $('#frame').append("<div class='postBox'><img src='" + currentPost.image +
      "'><p class='title'>" + (endPost || currentPost.title) + "</p>");
    $('#frame').animate({"scrollTop": $('#frame').prop('scrollHeight')}, 1000);
  };

  /**
   * finalAct() adds some "Game Over" functionality to be executed on an ID
   * that doesn't exist at the time the document loads. I had to use event
   * delegation on '#frame' since '#sorry' is created later ad lib. Tricky.
   * P.S. Sorry! ¯\_(ツ)_/¯
   */
  var finalAct = function() {
    $('#frame').on('click', '#sorry', function() {
      $(this).text(currentPost.title);
    });
  };

  // scoreColor() changes the #score and its color to match the latest shape.
  var scoreColor = function() {
    $('#score').text(lines).css('color', currentColor);
  };

  // I can't think of any other way to end the game. This works, I guess.
  var gameOver = function() {
    x = null;
    y = null;
    gameStart = null;
    updateShape = null;
    currentShape = null;
    gravity = null;
  }

  // Pull data from Reddit, generate the table, and set up some event
  // delegation after the DOM is established.
  $(document).ready(function() {
    reddit();
    createGrid();
    finalAct();

    // The control center. Spacebar to start the game. While running, use
    // event.preventDefault() to stop any scrolling with the arrow keys.
    $(document).keydown(function(event) {
      if (!gameStart) {
        if (event.keyCode === 32) {
          paint(currentShape, currentColor, 'active');
          $('#score').css('color', currentColor);
          gravity();
          gameStart = true;
        }
      } else {
        if (event.keyCode === 37) {
          event.preventDefault();
          move('left')
        } else if (event.keyCode === 39) {
          event.preventDefault();
          move('right');
        } else if (event.keyCode === 40) {
          event.preventDefault();
          move('down');
        } else if (event.keyCode === 38) {
          event.preventDefault();
          rotate();
        }
      }
    });
  });
})();
