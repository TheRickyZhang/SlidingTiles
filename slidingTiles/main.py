from slidingTiles import ai
from SlidingGrid import slidingGrid

global aiMoveIndex
global aiMoves
def main():

    strt_grid = slidingGrid()
    strt_grid.consoleprint()
    strt_grid.shuffle()
    #print("\nfsjdljfsgjfk;sd\n")
    strt_grid.consoleprint()

    aiMoves = ai.idaStar(strt_grid)
    #print(aiMoves)


if __name__ == "__main__":
    main()