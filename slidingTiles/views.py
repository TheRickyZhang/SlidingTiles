from django.http import JsonResponse
from django.shortcuts import render
from django.contrib import messages
from django.shortcuts import redirect
from slidingTiles import ai
import json
import logging

from slidingTiles.SlidingGrid import slidingGrid

logger = logging.getLogger(__name__)

# This file essentially serves as a intermediary between game.js and ai.py. It takes info from game.js and sends it
# to ai.py, sending the results back to game.js. It also handles the initial setup of the game board and the
# shuffling of the board.

# Note: board corresponds to the right (IDA*) board, board_greedy corresponds to the left (Greedy) board

# direction schema (y,x)
UP = (1, 0)
DOWN = (-1, 0)
LEFT = (0, 1)
RIGHT = (0, -1)

# Renders the game in game.html
def game_view(request):
    size = request.GET.get('gridSize', '4')
    try:
        size = int(size)
        if size not in [3, 4]:
            raise ValueError("Grid size must be 3 or 4.")
    except (ValueError, TypeError) as e:
        messages.error(request, str(e))
        return redirect('landing')

    return render(request, 'game.html', {'rows': size, 'cols': size})
# Creates the landing page
def landing_view(request):
    return render(request, "landing.html")

# starts the game and returns the boards to game.js
def start_game(request):
    numShuffles = int(request.GET.get('shuffles', 0))
    game = slidingGrid(boardSize=4, shuffle=numShuffles, grid_=None)
    request.session['game_board'] = json.dumps(game.board)
    request.session['game_board_greedy'] = json.dumps(game.board)

    return JsonResponse({'board': game.board, 'board_greedy': game.board})

# calls shuffle and returns the new boards to game.js
def shuffle(request):
    numShuffles = int(request.GET.get('shuffles', 0))
    grid = json.loads(request.session.get('game_board'))
    grid_2 = json.loads(request.session.get('game_board_greedy'))
    game = slidingGrid(boardSize=4, shuffle=numShuffles, grid_=grid)

    request.session['game_board'] = json.dumps(game.board)
    request.session['game_board_greedy'] = json.dumps(game.board)

    return JsonResponse({'board': game.board, 'board_greedy': game.board})

# moves the tile and returns the new boards to game.js
def make_move(request):
    direction_map = {
        '-1,0': DOWN,
        '1,0': UP,
        '0,-1': RIGHT,
        '0,1': LEFT,
        'UP':UP,
        'DOWN':DOWN,
        'LEFT':LEFT,
        'RIGHT':RIGHT
    }
    # checks which boards the moves apply to
    isIDA = request.GET.get('isIDA', "")
    isGreedy = request.GET.get('isGreedy', "")
    direction_tuple = direction_map.get(request.GET.get('direction', 0), 0)
    grid = json.loads(request.session.get('game_board'))
    grid_2 = json.loads(request.session.get('game_board_greedy'))

    game = slidingGrid(boardSize=4, shuffle=0, grid_=grid)
    game_2 = slidingGrid(boardSize=4, shuffle=0, grid_=grid_2)
    if isIDA.lower() == 'true':
        if not game.move(direction_tuple):
            return JsonResponse({'success': False, 'error': 'Move not possible'})
    if isGreedy.lower() == 'true':
        if not game_2.move(direction_tuple):
            return JsonResponse({'success': False, 'error': 'Move not possible'})

    # returns the new boards, with a boolean that indicates whether the game has been solved
    request.session['game_board'] = json.dumps(game.board)
    request.session['game_board_greedy'] = json.dumps(game_2.board)
    return JsonResponse({'success': True, 'board': game.board, 'solved': game.checkWin(), 'board_greedy': game_2.board, 'solved_greedy': game_2.checkWin()})


# solves the puzzle using the IDA* algorithm
def ida_solve(request):
    try:
        # gets a copy of the game board
        grid = json.loads(request.session.get('game_board'))
        game = slidingGrid(boardSize=4, shuffle=0, grid_=grid)
        # passes info to ai.py's idaStar function to solve the puzzle and gets data
        ida_moves, decision_tree, tDelta = ai.idaStar(game)

        moves_str = [f"{move[0]},{move[1]}" for move in ida_moves]
        # returns data to game.js
        return JsonResponse({'success': True, 'moves': moves_str, 'decisionTree': decision_tree, 'time': tDelta,
                             'numMoves': len(ida_moves)})
    except Exception as e:
        logger.error(f"Auto-solve failed: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e), 'decisionTree': []})

# solves the puzzle using the greedy algorithm
def greedy_solve(request):
    try:
        # requests a copy of the inital game board (both boards should have the same initial state so the specific board does not matter)
        grid = json.loads(request.session.get('game_board_greedy'))
        game = slidingGrid(boardSize=4, shuffle=0, grid_=grid)

        # calls ai.py's greedy function to solve the puzzle and stores the data
        greedy_moves, tDelta, _, decision_tree = ai.greedyFirstBest(game)

        # Convert moves from tuples to strings
        moves_str = [f"{move[0]},{move[1]}" for move in greedy_moves]

        # returns the moves, time, number of moves, and decision tree
        return JsonResponse({'success': True, 'moves': moves_str, 'time': tDelta, 'numMoves': len(greedy_moves),
                             'decisionTree': json.loads(serialize_decision_tree(decision_tree))})
    except Exception as e:
        logger.error(f"Greedy solve failed: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e), 'decisionTree': []})


# converts the decision tree to a json object that can easily be processed and sent to game.js so the tree can be displayed
# Prevents circular linkage error by excluding parent references
def serialize_decision_tree(tree_root):
    def serialize(node):
        result = {k: v for k, v in node.items() if k != 'parent'}
        if 'children' in result:
            result['children'] = [serialize(child) for child in result['children']]
        return result

    return json.dumps(serialize(tree_root))