
# solve.py
from Algorithms import idaStar, greedyFirstBest
from SlidingGrid import SlidingGrid
from copy import deepcopy

def main():    
    # Create a shuffled 4x4 puzzle
    puzzle = SlidingGrid(boardSize=4)
    puzzle2 = deepcopy(puzzle)

    # Solve the puzzle using IDA*
    ida_moves, ida_time, ida_final_puzzle = idaStar(puzzle)
    print("\nIDA* Solution:")
    if ida_moves:
        print("Number of moves:", len(ida_moves))
        #print("Moves:", ida_moves)
        print("Time taken:", ida_time, "seconds")
        #print("Final grid:\n", ida_final_puzzle)
        puzzle.moveSolve(ida_moves)
    else:
        print("Failed to solve the puzzle using IDA*")

    # Solve the puzzle using Greedy First-Best Search
    greedy_moves, greedy_time, greedy_final_puzzle = greedyFirstBest(puzzle2)
    print("\nGreedy First-Best Search Solution:")
    if greedy_moves:
        print("Number of moves:", len(greedy_moves))
        #print("Moves:", greedy_moves)
        print("Time taken:", greedy_time, "seconds")
        #print("Final grid:\n", greedy_final_puzzle)
        puzzle2.moveSolve(greedy_moves)
    else:
        print("Failed to solve the puzzle using Greedy First-Best Search")

if __name__ == "__main__":
    main()