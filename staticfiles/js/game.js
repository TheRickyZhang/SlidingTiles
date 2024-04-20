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
        makeMove(direction, gameBoard1, "greedy");
        makeMove(direction, gameBoard2, "ida");
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
            makeMove(direction, gameBoard1, "greedy");
            makeMove(direction, gameBoard2, "ida");
        }
    });

    $('#IDA-solve-button').click(function() {
        if (!gameActive) return;
        startIdaSolve();
    });
    
    $('#both-solve-button').click(function() {
        if (!gameActive) return;
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
        $.getJSON('/start/', { 'gridSize': `${rows}` }, function(data) {
            board1 = data.board; // Initialize board1 array
            board2 = JSON.parse(JSON.stringify(data.board)); // Initialize board2 array with a deep copy of the data
            updateBoard(board1, gameBoard1); // Update gameBoard1
            updateBoard(board2, gameBoard2); // Update gameBoard2
            gameBoard1.css('display', 'grid');
            gameBoard2.css('display', 'grid');
        });
    }

    function makeMove(direction, boardToUpdate) {
        if (!gameActive) return;

        $.getJSON('/move/', { 'direction': direction }, function(data) {
            if (data.success) {
                updateBoard(data.board, boardToUpdate); // Update the specified game board
    
                if (data.solved) {
                    alert('Puzzle solved!');
                    gameActive = false;
                }
            } else {
                alert('Move not possible');
            }
        });
    }

    function updateBoard(board, boardDiv) {
        boardDiv.empty().css({
            'display': 'grid',
            'grid-template-columns': `repeat(${board.length}, 100px)`
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
