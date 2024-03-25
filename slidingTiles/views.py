from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
from slidingTiles.SlidingGrid import SlidingGrid
import json


def game_view(request):
    return render(request, 'game.html')


def start_game(request):
    game = SlidingGrid(4)
    game.shuffle()

    # Save the game state in the session
    request.session['game_board'] = json.dumps(game.grid)
    return JsonResponse({'board': game.grid})


def make_move(request):
    direction = int(request.GET.get('direction', 0))  # Get direction as an integer
    grid = json.loads(request.session.get('game_board'))  # Deserialize grid from JSON
    game = SlidingGrid(4, grid)
    if not game.move(direction):
        return JsonResponse({'success': False, 'error': 'Move not possible'})

    request.session['game_board'] = json.dumps(game.grid)
    return JsonResponse({'success': True, 'board': game.grid, 'solved': game.is_solved()})
