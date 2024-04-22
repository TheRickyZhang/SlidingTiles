$(document).ready(function() {
    let rows = $('body').data('rows');
    let cols = $('body').data('cols');
    let gameActive = true;
    let gameBoard1 = $('#game-board1'); // First game board
    let gameBoard2 = $('#game-board2'); // Second game board
    let numShuffles = $('#shuffleSlider').val();


    initializeGame(rows, cols, numShuffles);

    $('.make-move-button').click(function() {
        let direction = $(this).data('direction');
        makeMove(direction, false, true, true);
    });

    $('#new-game-button').click(function() {
        gameActive = true;
        initializeGame(rows, cols, numShuffles);
    });


    $('#shuffleSlider').on('input', function() {
        $('#shuffleValue').text(this.value);
        numShuffles = $('#shuffleSlider').val();
    });

    $('#shuffleButton').click(function() {
        if (!gameActive) {
            $("#message-text").text("Already solved. Start new game.").css("background-color", "#f6e51b").show();
            return;
        }
        $.getJSON('/shuffle/', { 'rows': rows, 'cols': cols, 'shuffles': numShuffles }, function(data) {
            updateSingleBoard(data.board, gameBoard1);
            updateSingleBoard(data.board_greedy, gameBoard2);
        });
    });

    $(document).keydown(function(e) {
        console.log(gameActive);
        if (!gameActive) {
            $("#message-text").text("Already solved. Start new game.").css("background-color", "#f6e51b").show();
            return;
        }
        let directionMap = { 'ArrowDown': '1,0', 'ArrowUp': '-1,0', 'ArrowRight': '0,1', 'ArrowLeft': '0,-1' };
        let direction = directionMap[e.key];
        console.log('Direction:', direction);
        if (direction !== undefined) {
            makeMove(direction, false, true, true); // Make move on gameBoard1
        }
    });

    $('#IDA-solve-button').click(function() {
        if (!gameActive) {
            $("#message-text").text("Already solved. Start new game.").css("background-color", "#f6e51b").show();
            return;
        }
        gameActive = false;
        startIdaSolve();
    });
    
    $('#both-solve-button').click(function() {
        if (!gameActive) {
            $("#message-text").text("Already solved. Start new game.").css("background-color", "#f6e51b").show();
            return;
        }
        solveBoth();
        $("#message-text").text("Animations currently running.").css("background-color", "#00d6ff").show();
    });


    $('#greedy-solve-button').click(function() {
        if (!gameActive) {
            $("#message-text").text("Already solved. Start new game.").css("background-color", "#f6e51b").show();
            return;
        }
        startGreedySolve();
        $("#message-text").text("Animations currently running.").css("background-color", "#00d6ff").show();
    });

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function solveBoth() {
        gameActive = false;
        startGreedySolve(function() {
            startIdaSolve();
        });
        $("#message-text").text("Animations currently running.").css("background-color", "#00d6ff").show();
    }

    function startGreedySolve(callback = null) {
        $.ajax({
                url: '/greedy_solve/',
                type: 'GET',
                dataType: 'json',
                success: function(response) {
                    $('#greedyTimeTaken').text(response.time);
                    $('#greedyNumMoves').text(response.numMoves);
                    drawDecisionTree(response.decisionTree, '#left-tree-svg-container');
                    animateSolution(response.moves, true, false, callback);
                    if (!response.board_solved || !response.board_greedy_solved) {
                        gameActive = true;
                    }
                },
                error: function(xhr, status, error) {
                    gameActive = true;
                    console.error('AJAX error during greedy solve:', error);
                    reject(error);
                }
            });
        console.log(gameActive);
    }

    function startIdaSolve() {
        $.ajax({
            url: '/ida_solve/',
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                $('#idaTimeTaken').text(response.time);
                $('#idaNumMoves').text(response.numMoves);
                drawDecisionTree(response.decisionTree, '#right-tree-svg-container');
                animateSolution(response.moves, false, true);
                if (!response.board_solved || !response.board_greedy_solved) {
                    gameActive = true;
                }
            },
            error: function(xhr, status, error) {
                gameActive = true;
                console.error('AJAX error during IDA solve:', error);
                reject(error);
            }
        });
    }

    function animateSolution(moves, isGreedy = false, isIDA = false, callback = 0) {
        let currentMove = 0;

        function performNextMove() {
            if (currentMove < moves.length) {
                const move = moves[currentMove];
                makeMove(move, true, isGreedy, isIDA);
                currentMove++;
                setTimeout(performNextMove, 200);
            } else {
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }

        performNextMove();
    }
    function initializeGame(rows, cols, shuffles) {
        $.getJSON('/start/', { 'rows': rows, 'cols': cols, 'shuffles': shuffles }, function(data) {
            updateSingleBoard(data.board, gameBoard1);
            updateSingleBoard(data.board_greedy, gameBoard2);
            gameBoard1.css('display', 'grid');
            gameBoard2.css('display', 'grid');
        });
    }

    function makeMove(direction, bypass = false, isGreedy = false, isIDA = false) {
        if (!gameActive && !bypass) return;

        const directionToButtonId = {
            '1,0': "#move-down",
            '-1,0': "#move-up",
            '0,1': "#move-right",
            '0,-1': "#move-left"
        };

        $.getJSON('/move/', { 'direction': direction, 'isGreedy': isGreedy, 'isIDA': isIDA}, function(data) {
            if (data.success) {
                $("#message-text").hide().empty();
                updateSingleBoard(data.board, gameBoard2);
                updateSingleBoard(data.board_greedy, gameBoard1);

                const $button = $(directionToButtonId[direction]);
                $button.stop(true, true).css("background-color", "#00ff00").delay(100).animate({ backgroundColor: "" }, 100);

                if(data.solved && data.solved_greedy) {
                    $("#message-text").text("Puzzle solved!").css("background-color", "#00ff00").show();
                    gameActive = false;
                }

            } else {
                $("#message-text").text("Move not possible").css("background-color", "#ff0000").show();
            }
        });
    }

    function updateSingleBoard(board, boardDiv) {
        boardDiv.empty().css({
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
     function moveDirection(move) {
        const directionMap = {
            '1,0': 'D',
            '-1,0': 'U',
            '0,-1': 'L',
            '0,1': 'R'
        };
        return directionMap[move.join(',')] || '';
    }


    // Someone please organize this better if possible
    function drawDecisionTree(treeData, tree_container) {
        const margin = { top: 20, right: 90, bottom: 30, left: 90 };
        const width = 800;
        const height = 600;
        const dynamicHeight = height;    // dynamic height not needed

        d3.select(tree_container).html('');
        const svgContainer = d3.select(tree_container).append('div').style('position', 'relative');

        const svg = svgContainer.append('svg')
            .attr('viewBox', `0 0 ${width} ${dynamicHeight}`)
            .attr('preserveAspectRatio', "xMinYMin meet")
            .classed("svg-content", true);

        const zoom = d3.zoom().on('zoom', event => {
            mainGroup.attr('transform', event.transform);
        });

        svg.call(zoom);

        const mainGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Adjust spacing of tree here (node, space)
        const root = d3.hierarchy(treeData);
        const treeLayout = d3.tree().nodeSize([30, 40]);
        treeLayout(root);

        // Draw edges
        const linkGroup = mainGroup.selectAll('g.link')
            .data(root.links())
            .enter().append('g')
            .attr('class', 'link');

        linkGroup.append('path')
            .attr('d', d => `M${d.source.y},${d.source.x} L${d.target.y},${d.target.x}`)
            .attr('stroke', '#555')
            .attr('stroke-width', '1px');

        linkGroup.append('text')
            .attr('dy', 3)
            .attr('x', d => (d.source.y + d.target.y) / 2)
            .attr('y', d => (d.source.x + d.target.x) / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .text(d => moveDirection(d.target.data.move));

       // Draw vertices
       const nodes = mainGroup.selectAll('g.node')
       .data(root.descendants())
       .enter().append('g')
       .attr('class', 'node')
       .attr('transform', d => `translate(${d.y},${d.x})`);

       nodes.append('circle')
        .attr('r', 10)
        .style('fill', d => d.data.chosen ? '#1aff00' : '#ff1a1a')
        .style('stroke', '#fff')
        .on('click', function(event, d) {
            event.stopPropagation();
            svgContainer.selectAll('.popup').remove();
            const [x, y] = d3.pointer(event, svgContainer.node());

            const board = d.data.state; // assuming this is a 2D array representing the board
            const tileSize = 20; // Size of each tile in the board grid
            const boardWidth = board[0].length * tileSize;
            const boardHeight = board.length * tileSize;

            // Append an SVG element for the board
            const popup = svgContainer.append('svg')
                .attr('class', 'popup')
                .style('position', 'absolute')
                .style('left', `${x}px`)
                .style('top', `${y}px`)
                .attr('width', boardWidth + 10)
                .attr('height', boardHeight)
                .style('background-color', 'white')
                .style('border', 'solid 1px black')
                .style('padding', '10px')

            // Draw each tile as a rectangle
            board.forEach((row, rowIndex) => {
                row.forEach((tile, colIndex) => {
                    popup.append('rect')
                        .attr('x', colIndex * tileSize)
                        .attr('y', rowIndex * tileSize)
                        .attr('width', tileSize)
                        .attr('height', tileSize)
                        .style('fill', tile === 0 ? '#fff' : '#ccc')
                        .style('stroke', '#000');

                    if (tile !== 0) {
                        popup.append('text')
                            .attr('x', colIndex * tileSize + tileSize / 2)
                            .attr('y', rowIndex * tileSize + tileSize / 2)
                            .attr('text-anchor', 'middle')
                            .attr('dy', '0.35em') // vertical alignment
                            .text(tile);
                    }
                });
            });
            popup.on('click', function() {
                svgContainer.selectAll('.popup').remove();
            });
        });
    }
});
