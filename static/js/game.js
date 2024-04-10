$(document).ready(function() {
    let rows = $('body').data('rows');
    let cols = $('body').data('cols');
    let gameActive = true;

    initializeGame(rows, cols);

    $('.make-move-button').click(function() {
        let direction = $(this).data('direction');
        makeMove(direction);
    });

    $(document).keydown(function(e) {
        if (!gameActive) return;
        let directionMap = { 'ArrowDown': '1,0', 'ArrowUp': '-1,0', 'ArrowRight': '0,1', 'ArrowLeft': '0,-1' };
        let direction = directionMap[e.key];
        if (direction !== undefined) {
            makeMove(direction);
        }
    });

    $('#auto-solve-button').click(function() {
        if (!gameActive) return;
        startAutoSolve();
    });

    function startAutoSolve() {
        $.ajax({
            url: '/auto_solve/',  // Make sure this URL matches the one in your Django urls.py
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    animateSolution(response.moves);
                } else {
                    console.error('Auto-solve failed:', response.error);
                    alert('Auto-solve failed: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
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
                makeMove(move);
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

    function makeMove(direction) {
        if (!gameActive) return;

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
