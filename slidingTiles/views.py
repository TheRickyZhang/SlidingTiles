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
    rows = int(request.GET.get('rows', 4))
    cols = int(request.GET.get('cols', 4))
    game = slidingGrid(rows, cols)
    game.shuffle()

    request.session['game_board'] = json.dumps(game.grid)
    return JsonResponse({'board': game.grid})

# Expects: {direction}  (others loaded from session)
def make_move(request):
    # Map direction parameter to direction tuple
    direction_map = {
        'down': DOWN,
        'up': UP,
        'right': RIGHT,
        'left': LEFT
    }
    direction_tuple = direction_map.get(request.GET.get('direction', 'down'), DOWN)
    grid = json.loads(request.session.get('game_board'))

    game = slidingGrid(len(grid), len(grid[0]), grid)

    if not game.move(direction_tuple):
        return JsonResponse({'success': False, 'error': 'Move not possible'})

    request.session['game_board'] = json.dumps(game.grid)
    return JsonResponse({'success': True, 'board': game.grid, 'solved': game.is_solved()})

def solve_puzzle(request):
    try:
        grid = json.loads(request.session.get('game_board'))
        idaStar_moves = ai.idaStar(grid)

        return JsonResponse({'success': True, 'moves': idaStar_moves})

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

def auto_solve(request):
    try:
        grid = json.loads(request.session.get('game_board'))
        ida_star_moves = ai.idaStar(grid)

        return JsonResponse({'success': True, 'moves': ida_star_moves})
    except Exception as e:
        logger.error(f"Auto-solve failed: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)})
