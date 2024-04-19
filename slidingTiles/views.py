from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.contrib import messages
from django.shortcuts import redirect
from django.contrib.messages import get_messages
from slidingTiles import ai
import json
import logging

from slidingTiles.SlidingGrid import slidingGrid

logger = logging.getLogger(__name__)

# New direction schema
UP = (1, 0)
DOWN = (-1, 0)
LEFT = (0, 1)
RIGHT = (0, -1)

# Expects: {gridSize}
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

def landing_view(request):
    return render(request, "landing.html")

# Expects: {rows, cols}
def start_game(request):
    #rows = int(request.GET.get('rows', 4))
    #cols = int(request.GET.get('cols', 4))
    game = slidingGrid(boardSize=4, shuffle=True, grid_=None)
    game.shuffle()

    request.session['game_board'] = json.dumps(game.board)
    return JsonResponse({'board': game.board})

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
    direction_tuple = direction_map.get(request.GET.get('direction', 0), 0)
    #direction_tuple = direction_map.get(request.GET.get('direction', 'down'), DOWN)
    grid = json.loads(request.session.get('game_board'))

    game = slidingGrid(boardSize=4, shuffle=False, grid_=grid)

    if not game.move(direction_tuple):
        return JsonResponse({'success': False, 'error': 'Move not possible'})

    request.session['game_board'] = json.dumps(game.board)
    return JsonResponse({'success': True, 'board': game.board, 'solved': game.checkWin()})


def solve_puzzle(request):
    try:
        grid = json.loads(request.session.get('game_board'))
        idaStar_moves = ai.idaStar(grid)

        return JsonResponse({'success': True, 'moves': idaStar_moves})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

def ida_solve(request):
    try:
        grid = json.loads(request.session.get('game_board'))
        game = slidingGrid(boardSize=4, shuffle=False, grid_=grid)
        ida_moves, decision_tree, tDelta = ai.idaStar(game)

        moves_str = [f"{move[0]},{move[1]}" for move in ida_moves]

        return JsonResponse({'success': True, 'moves': moves_str, 'decisionTree': decision_tree, 'time': tDelta, 'numMoves': len(ida_moves)})
    except Exception as e:
        logger.error(f"Auto-solve failed: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e), 'decisionTree': []})


def greedy_solve(request):
    try:
        grid = json.loads(request.session.get('game_board'))
        game = slidingGrid(boardSize=4, shuffle=False, grid_=grid)
        greedy_moves, tDelta, _ = ai.greedyFirstBest(game)

        # Convert moves from tuples to strings
        moves_str = [f"{move[0]},{move[1]}" for move in greedy_moves]

        return JsonResponse({'success': True, 'moves': moves_str, 'time': tDelta, 'numMoves': len(greedy_moves)})
    except Exception as e:
        logger.error(f"Greedy solve failed: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)})


