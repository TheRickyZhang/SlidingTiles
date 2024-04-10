$(document).ready(function() {
    let rows = $('body').data('rows');
    let cols = $('body').data('cols');
    let gameActive = true;

    initializeGame(rows, cols);

    $('.make-move-button').click(function() {
        let direction = $(this).data('direction');
        makeMove(direction);
    });

    $('#new-game-button').click(function() {
        gameActive = true;
        initializeGame(rows, cols);
    });

    $(document).keydown(function(e) {
        if (!gameActive) return;
        let directionMap = { 'ArrowDown': '1,0', 'ArrowUp': '-1,0', 'ArrowRight': '0,1', 'ArrowLeft': '0,-1' };
        let direction = directionMap[e.key];
        if (direction !== undefined) {
            makeMove(direction);
        }
    });

    $('#IDA-solve-button').click(function() {
        if (!gameActive) return;
        startAutoSolve();
    });

    $('#greedy-solve-button').click(function() {
        if (!gameActive) return;
        startGreedySolve();
    });

function startGreedySolve() {
    gameActive = false;
    $.ajax({
        url: '/greedy_solve/',  // Make sure this URL matches the one in your Django urls.py
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                animateSolution(response.moves);
            } else {
                gameActive = true;
                console.error('Greedy solve failed:', response.error);
                alert('Greedy solve failed: ' + response.error);
            }
        },
        error: function(xhr, status, error) {
            gameActive = true;
            console.error('AJAX error during greedy solve:', error);
            alert('AJAX error during greedy solve: ' + error);
        }
    });
}


    function startAutoSolve() {
        gameActive = false;
        $.ajax({
            url: '/auto_solve/',  // Make sure this URL matches the one in your Django urls.py
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    animateSolution(response.moves);
                } else {
                    gameActive = true;
                    console.error('Auto-solve failed:', response.error);
                    alert('Auto-solve failed: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                gameActive = true;
                console.error('AJAX error during auto-solve:', error);
                alert('AJAX error during auto-solve: ' + error);
            }
        });
    }

    function animateSolution(moves) {
        let currentMove = 0;

        function performNextMove() {
            if (currentMove < moves.length) {
                const move = moves[currentMove];
                makeMove(move, true);
                currentMove++;
                setTimeout(performNextMove, 500);
            }
        }

        performNextMove();
    }

    function initializeGame(rows, cols) {
        $.getJSON('/start/', { 'rows': rows, 'cols': cols }, function(data) {
            updateBoard(data.board);
            $('#game-board').css('display', 'grid');
        });
    }

    function makeMove(direction, bypass = false) {
        if (!gameActive && !bypass) return;

        const directionToButtonId = {
            '1,0': "#move-down",
            '-1,0': "#move-up",
            '0,1': "#move-right",
            '0,-1': "#move-left"
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
