$(document).ready(function() {
    let rows = $('body').data('rows');
    let cols = $('body').data('cols');
    let gameActive = true;
    let gameBoard1 = $('#game-board1'); // First game board
    let gameBoard2 = $('#game-board2'); // Second game board
    let board1 = []; // First game board array
    let board2 = []; // Second game board array


    initializeGame(rows, cols);

    $('.make-move-button').click(function() {
        let direction = $(this).data('direction');
        makeMove(direction, false, gameBoard1);
        makeMove(direction, false, gameBoard2);
    });

    $('#new-game-button').click(function() {
        gameActive = true;
        initializeGame(rows, cols);
    });

    $(document).keydown(function(e) {
        if (!gameActive) return;
        let directionMap = { 'ArrowDown': '1,0', 'ArrowUp': '-1,0', 'ArrowRight': '0,1', 'ArrowLeft': '0,-1' };
        let direction = directionMap[e.key];
        console.log('Direction:', direction);
        if (direction !== undefined) {
            makeMove(direction, false, gameBoard1);
            makeMove(direction, false, gameBoard2);
        }
    });

    $('#IDA-solve-button').click(function() {
        if (!gameActive) return;
        startIdaSolve();
    });
    
    $('#both-solve-button').click(function() {
        if (!gameActive) return;
        /* Can duplicate the board for just this function, but I think it will be easier to have
        two boards to begin with. That will involve:

        1. Adding html element to support second board
        2. Modifying /start/, initializeGame, and updateBoard to handle both boards. Ensure most actions are
        applied to both boards to keep them in sync.
        3. Make each button solve their respective grid. After finishing, other grid should sync. Solving both follows trivially.
        4. Update checks such as gameActive to ensure no unexpected behavior

        */
        startGreedySolve();
        startIdaSolve();
    });


    $('#greedy-solve-button').click(function() {
        if (!gameActive) return;
        startGreedySolve();
    });

    function startGreedySolve() {
        gameActive = false;
        $.ajax({
            url: '/greedy_solve/',
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    $('#greedyTimeTaken').text(response.time);
                    $('#greedyNumMoves').text(response.numMoves);
                    drawDecisionTree(response.decisionTree, '#left-tree-svg-container');
                    animateSolution(response.moves, true);
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
    

    function startIdaSolve() {
        gameActive = false;
        $.ajax({
            url: '/ida_solve/',
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    $('#idaTimeTaken').text(response.time);  // Display tDelta
                    $('#idaNumMoves').text(response.numMoves);  // Display numMoves
                    drawDecisionTree(response.decisionTree, '#right-tree-svg-container');
                    animateSolution(response.moves);
                } else {
                    gameActive = true;
                    console.error('Ida-solve failed:', response.error);
                    alert('Ida-solve failed: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                gameActive = true;
                console.error('AJAX error during auto-solve:', error);
                alert('AJAX error during auto-solve: ' + error);
            }
        });
    }


    function animateSolution(moves, isGreedy = false) {
        let currentMove = 0;
    
        function performNextMove() {
            if (currentMove < moves.length) {
                const move = moves[currentMove];
                makeMove(move, true, isGreedy);
                currentMove++;
                setTimeout(performNextMove, 250);
            }
        }
    
        performNextMove();
    }
    function initializeGame(rows, cols) {
        $.getJSON('/start/', { 'rows': rows, 'cols': cols }, function(data) {
            board1 = data.board; // Initialize board1 array
            board2 = JSON.parse(JSON.stringify(data.board)); // Initialize board2 array with a deep copy of the data
            updateBoard(board1, gameBoard1); // Update gameBoard1
            updateBoard(board2, gameBoard2); // Update gameBoard2
            gameBoard1.css('display', 'grid');
            gameBoard2.css('display', 'grid');
        });
    }
    function makeMove(direction, bypass = false, boardToUpdate) {
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
                updateBoard(data.board, boardToUpdate); // Update the specified game board
    
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
    function updateBoard(board, gameBoard) {
        let boardDiv = gameBoard; // Use the specified game board
        updateSingleBoard(board, boardDiv);
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
        const depth = d3.hierarchy(treeData).height;
        const dynamicHeight = Math.max(height, depth * 100);

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
           // Show board state when node clicked
        .on('click', function(event, d) {
            event.stopPropagation();
            svgContainer.selectAll('.popup').remove();
            const [x, y] = d3.pointer(event, svgContainer.node());
            const popup = svgContainer.append('div')
                .attr('class', 'popup')
                .style('position', 'absolute')
                .style('left', `${x}px`)
                .style('top', `${y}px`)
                .style('background-color', 'white')
                .style('border', 'solid 1px black')
                .style('padding', '10px')
                .style('color', 'black')
                .style('min-width', '50px')
                .style('min-height', '50px')
                .style('z-index', '1000') // Make sure the popup is on top
                .text(`State: \n${JSON.stringify(d.data.state)}`)
                .on('click', function(e) {
                    e.stopPropagation();
                });
        });
    }
});
