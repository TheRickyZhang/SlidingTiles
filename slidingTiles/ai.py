#import model
# import NPuzzleSolvers
import pickle
import heapq
from time import perf_counter_ns

NANO_TO_SEC = 1000000000
INF = 100000
groups = []
patternDbDict = []

class State:
    def __init__(self, puzzle, g, h, moves=[]):
        self.puzzle = puzzle
        self.g = g  # Cost from start node to current node
        self.h = h  # Heuristic cost from current node to goal node
        self.moves = moves  # List of moves taken to reach this state

    def __lt__(self, other):
        # Compare nodes based on their f = g + h values
        return (self.g + self.h) < (other.g + other.h)

def init(boardSize):
    global groups
    global patternDbDict
    print("Initializing pattern DB...")
    with open("patternDb_"+str(boardSize)+".dat", "rb") as patternDbFile:
        groups = pickle.load(patternDbFile)
        patternDbDict = pickle.load(patternDbFile)
        for i in range(len(patternDbDict)):
            print("Group {}: {}, {:,} entries.".format(i,groups[i],len(patternDbDict[i])))

def idaStar(puzzle):
    if puzzle.checkWin():
        return [], {}
    if not patternDbDict:
        init(puzzle.boardSize)

    t1 = perf_counter_ns()
    bound = hScore(puzzle)
    path = [puzzle]
    dirs = []

    # Initialize the root of the decision tree
    decision_tree = {
        "state": puzzle.state(),
        "move": None,
        "children": []
    }

    while True:
        rem = search(path, 0, bound, dirs, decision_tree)
        if rem == True:
            tDelta = (perf_counter_ns()-t1)/NANO_TO_SEC
            print("Took {} seconds to find a solution of {} moves".format(tDelta, len(dirs)))
            return dirs, decision_tree, tDelta  # Return the decision tree root node
        elif rem == INF:
            return None, {}
        bound = rem

def greedyFirstBest(puzzle):
    if puzzle.checkWin():
        return [], 0, puzzle
    if not patternDbDict:
        init(puzzle.boardSize)

    t1 = perf_counter_ns()
    openList = []
    closedSet = set()
    startState = State(puzzle, 0, hScore(puzzle))
    heapq.heappush(openList, startState)

    while openList:
        curState = heapq.heappop(openList)
        if curState.puzzle.checkWin():
            tDelta = (perf_counter_ns() - t1) / NANO_TO_SEC
            print("Took {} seconds to find a solution of {} moves using Greedy First-Best Search".format(tDelta, len(curState.moves)))
            return curState.moves, tDelta, curState.puzzle

        closedSet.add(curState.puzzle.hash())

        for move in curState.puzzle.DIRECTIONS:
            validMove, simPuzzle = curState.puzzle.simulateMove(move)
            if validMove and simPuzzle.hash() not in closedSet:
                h = hScore(simPuzzle)
                nextState = State(simPuzzle, 0, h, curState.moves + [move])  # Set g=0 for greedy search
                heapq.heappush(openList, nextState)

    return None, 0, puzzle


def search(path, g, bound, dirs, tree_node):
    cur = path[-1]
    f = g + hScore(cur)

    if f > bound:
        return f
    if cur.checkWin():
        return True
    min = INF

    for _dir in cur.DIRECTIONS:
        if dirs and (-_dir[0], -_dir[1]) == dirs[-1]:
            continue
        validMove, simPuzzle = cur.simulateMove(_dir)
        if not validMove or simPuzzle in path:
            continue

        path.append(simPuzzle)
        dirs.append(_dir)

        child_node = {
            "state": simPuzzle.state(),
            "move": _dir,
            "children": []
        }
        tree_node["children"].append(child_node)

        t = search(path, g + 1, bound, dirs, child_node)
        if t == True:
            return True
        if t < min:
            min = t

        path.pop()
        dirs.pop()

    # If a node has no children added, it's a leaf, so remove the children property
    if not tree_node["children"]:
        tree_node.pop("children", None)

    return min


def hScore(puzzle):
    h = 0
    for g in range(len(groups)):
        group = groups[g]
        hashString = puzzle.hash(group)
        if hashString in patternDbDict[g]:
            h += patternDbDict[g][hashString]
        else:
            print("No pattern found in DB, using manhattan dist")
            for i in range(puzzle.boardSize):
                for j in range(puzzle.boardSize):
                    if puzzle.board[i][j] != 0 and puzzle.board[i][j] in group:
                        destPos = ((puzzle.board[i][j] - 1) // puzzle.boardSize,
                                   (puzzle.board[i][j] - 1) % puzzle.boardSize)
                        h += abs(destPos[0] - i)
                        h += abs(destPos[1] - j)

    return h
