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
        startIdaSolve();
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


    function startIdaSolve() {
        gameActive = false;
        $.ajax({
            url: '/ida_solve/',
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    animateSolution(response.moves);
                    drawDecisionTree(response.decisionTree);
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

    function animateSolution(moves) {
        let currentMove = 0;

        function performNextMove() {
            if (currentMove < moves.length) {
                const move = moves[currentMove];
                makeMove(move, true);
                currentMove++;
                setTimeout(performNextMove, 250);
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

     function moveDirection(move) {
        const directionMap = {
            '1,0': 'D',
            '-1,0': 'U',
            '0,-1': 'L',
            '0,1': 'R'
        };
        return directionMap[move.join(',')] || '';
    }


    // Someone please organize this better
    function drawDecisionTree(treeData) {
        const margin = { top: 20, right: 90, bottom: 30, left: 90 };
        const width = 800;
        const height = 600;
        const depth = d3.hierarchy(treeData).height;
        const dynamicHeight = Math.max(height, depth * 100);

        d3.select('#tree-container').html('');

        const svg = d3.select('#tree-container').append('svg')
            .attr('viewBox', `0 0 ${width} ${dynamicHeight}`)
            .attr('preserveAspectRatio', "xMinYMin meet")
            .classed("svg-content", true);

        const zoom = d3.zoom().on('zoom', event => {
            mainGroup.attr('transform', event.transform);
        });

        svg.call(zoom);

        const mainGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const root = d3.hierarchy(treeData);
        const treeLayout = d3.tree()
            .nodeSize([30, 40]);
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
         .style('fill', '#1aff00')
         .style('stroke', '#fff')
         .on('click', function(event, d) {
             // Create the popup
             const popup = mainGroup.append('g')
                     .attr('id', 'statePopup')
                     .style('display', 'none')
                     .style('position', 'absolute')
                     .style('background-color', 'white')
                     .style('border', '1px solid gray')
                     .style('padding', '10px');

             const tileSize = 25;
            const boardWidth = tileSize * d.data.state[0].length;
            const boardHeight = tileSize * d.data.state.length;

            popup.append('rect') // Background rectangle
                .attr('width', boardWidth)
                .attr('height', boardHeight)
                .attr('fill', 'lightgray');

            for (let row = 0; row < d.data.state.length; row++) {
                for (let col = 0; col < d.data.state[0].length; col++) {
                    let tileContent = d.data.state[row][col] === 0 ? '' : d.data.state[row][col];

                    popup.append('rect')
                        .attr('x', col * tileSize)
                        .attr('y', row * tileSize)
                        .attr('width', tileSize)
                        .attr('height', tileSize)
                        .attr('fill', 'white')
                        .attr('stroke', 'black');

                    popup.append('text')
                        .attr('x', col * tileSize + tileSize/2 )
                        .attr('y', row * tileSize + tileSize/2 )
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
                        .text(tileContent);
                }
            }

            // FIX for quality of life
             // This code doesn't work and I'm not going to find out why. (popup always at first node)
             // Also boards are stacking for reason, even when I try to delete them
             // const svgElement = d3.select(this.parentNode.parentNode).node();
             // const [clickX, clickY] = d3.pointer(event, svgElement);
             // const mainGroupTransform = d3.select('g').attr('transform');
             // const transformValues = mainGroupTransform.substring(10, mainGroupTransform.length - 1).split(',');
             // const translateX = +transformValues[0];
             // const translateY = +transformValues[1];
             // popup.attr('transform', `translate(${clickX + translateX + 10}, ${clickY + translateY + 10})`);

             popup.style('display', 'block'); // Show the popup

             // Click to hide the popup
             popup.on('click', function() {
                popup.style('display', 'none');
             });
         });

        svg.select('svg').call(d3.zoom().on('zoom', event => {
                mainGroup.attr('transform', event.transform);
            }))
            .call(d3.zoom().translateTo, margin.left, margin.top);
    }
});
