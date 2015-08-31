var tetris = (function() {

  var gameStart = false;

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

    return function(pos) {
      return shapes[shapeID][(pos || turnPos)].map(function(block) {
        return [block[0] + x, block[1] + y];
      });
    };
  })();

  var randomFloor = function(max) {
    return Math.floor(Math.random() * max);
  };

  const emptyColor = '#f3f3f3';
  const deadColor = '#444444';
  const colors = ['#60C9F8', '#177EFB', '#FD9427', '#FECB2F', '#53D769', '#FC3159', '#FC3D39'];

  var x = 4;
  var y = 0;
  var turnPos = 0;
  var shapeID = randomFloor(7);
  var currentColor = colors[shapeID];
  var currentShape = updateShape();

  var createShape = function() {
    x = 4;
    y = 1;
    shapeID = randomFloor(7);
    turnPos = 0;
    currentColor = colors[shapeID];
    scoreColor();
  };

  var paint = function(shape, color, cellStatus) {
    shape.forEach(function(block) {
      $('.' + block[1]).find('#' + block[0])
        .css('background-color', color)
        .data('status', cellStatus);
    });
  };

  var refresh = function(cellStatus, color) {
    paint(currentShape, color, cellStatus);
    currentShape = updateShape();
    paint(currentShape, currentColor, 'active');
  }

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

  var rotate = function() {
    var shapeShift = function() {
      turnPos < 3 ? turnPos++ : turnPos = 0;
      return turnPos;
    };

    var currentPos = turnPos;
    if (validMove(updateShape(shapeShift()))) {
      refresh('empty', emptyColor);
    } else {
      turnPos = currentPos;
    }
  };

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
                    "class='hr'>Game Over. :(</a>");
          gameOver();
        }
      }
    }
  };

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

  var lines = 0;
  var lineClear = function() {
    var deadCount = 0;
    var fallingStatus;
    var fallingColor;
    var linesBelow;

    for (var y = 21; y > 1; y--) {
      var full = true;

      for (var x = 0; x < 10; x++) {
        if ($('.' + y).find('#' + x).data('status') !== 'dead') {
          full = false;
        }

        if (deadCount > 0) {
          linesBelow = deadCount;
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
        if (lines === 0) {
          clearInstructions();
        }

        lines++;
        scoreColor();
        fetchPost();
      }
    }
  };

  var clearInstructions = function() {
    $('#instructions').remove();
  };

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

  var finalAct = function() {
    $('#frame').on('click', '#sorry', function() {
      $(this).text(currentPost.title);
    });
  };

  var scoreColor = function() {
    $('#score').text(lines).css('color', currentColor);
  };

  var gameOver = function() {
    x = null;
    y = null;
    gameStart = null;
    updateShape = null;
    currentShape = null;
    gravity = null;
  }

  $(document).ready(function() {
    reddit();
    createGrid();
    finalAct();

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
