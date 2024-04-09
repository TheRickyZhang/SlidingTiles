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


# Expects: {rows, cols}
def game_view(request):
    rows = request.GET.get('rows', '3')
    cols = request.GET.get('columns', '3')
    # logger.debug(f"Received rows: {rows}, cols: {cols}")
    try:
        rows = int(rows)
        cols = int(cols)
        if not (2 <= rows <= 12) or not (2 <= cols <= 12):
            raise ValueError("Rows and columns must be between 2 and 12.")
    except (ValueError, TypeError) as e:
        # Remove all other messages and push this error when redirecting to landing page
        storage = get_messages(request)
        for message in storage:
            pass
        messages.error(request, str(e))
        return redirect('landing')

    return render(request, 'game.html', {'rows': rows, 'cols': cols})


def landing_view(request):
    return render(request, "landing.html")


# Expects: {rows, cols}
def start_game(request):
    # Retrieve rows and cols from the session (default always 3)
    rows = int(request.GET.get('rows', 4))
    cols = int(request.GET.get('cols', 4))
    game = slidingGrid(rows, cols)
    game.shuffle()

    # Save the game state in the session
    request.session['game_board'] = json.dumps(game.grid)
    return JsonResponse({'board': game.grid})


# Expects: {direction}  (others loaded from session)
def make_move(request):
    direction = int(request.GET.get('direction', 0))
    grid = json.loads(request.session.get('game_board'))  # Deserialize grid from JSON

    game = slidingGrid(len(grid), len(grid[0]), grid)

    if not game.move(direction):
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
