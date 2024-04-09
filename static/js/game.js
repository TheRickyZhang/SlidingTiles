
$(document).ready(function() {
    let rows = $('body').data('rows');
    let cols = $('body').data('cols');
    let gameActive = true;
    console.log(gameActive);

    initializeGame(rows, cols);

    $('.make-move-button').click(function() {
        let direction = $(this).data('direction');
        console.log(gameActive);
        makeMove(direction);
    });

    $(document).keydown(function(e) {
        if (!gameActive) return;
        let directionMap = { 'ArrowDown': 0, 'ArrowUp': 1, 'ArrowRight': 2, 'ArrowLeft': 3 };
        let direction = directionMap[e.key];
        if (direction !== undefined) {
            makeMove(direction);
        }
    });

    $('.solve-button').click(function() {
        if (!gameActive) return;
        solveIDAStar();
    });


    function initializeGame(rows, cols) {
        $.getJSON('/start/', { 'rows': rows, 'cols': cols }, function(data) {
            updateBoard(data.board);
            $('#game-board').css('display', 'grid');
        });
    }

    function makeMove(direction) {
        console.log(gameActive);
        if (!gameActive) return;

        const directionToButtonId = {
            0: "#move-down",
            1: "#move-up",
            2: "#move-right",
            3: "#move-left"
        };

        let $button = $(directionToButtonId[direction]);

        $.getJSON('/move/', { 'direction': direction }, function(data) {
            if (data.success) {
                $("#message-text").hide().empty();
                updateBoard(data.board);

                $button.stop(true, true).css("background-color", "#00ff00").delay(100).animate({ backgroundColor: "" }, 100);

                if (data.solved) {
                    $("#message-text").text("Puzzle solved!").css("background-color", "#00ff00").show();
                    gameActive = false;
                }
            } else {
                $("#message-text").text("Move not possible").css("background-color", "#ff0000").show();
            }
        });
    }

    function solveIDAStar() {
        $.getJSON('/solve/', { }, function(data) {
            if (data.success === true) {
                $("#message-text").hide().empty();
                updateBoard(data.board);

                // Add code to show more buttons that show solving process

                $button.stop(true, true).css("background-color", "#ff33ee").delay(100).animate({ backgroundColor: "" }, 500);
            } else {
                $("#message-text").text("Error transmitting data").css("background-color", "#ff0000").show();
            }
        });
    }

    function updateBoard(board) {
        let boardDiv = $('#game-board').empty().css({
            'display': 'grid',
            'grid-template-columns': `repeat(${board[0].length}, 100px)`
        });
        board.forEach(row => {
            row.forEach(tile => {
                let tileContent = tile === 0 ? '' : tile;
                boardDiv.append($('<div class="tile">').text(tileContent));
            });
        });
    }
});