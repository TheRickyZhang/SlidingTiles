import pickle
import heapq
from time import perf_counter_ns

NANO_TO_SEC = 1000000000
INF = 100000
groups = []
patternDbDict = []

# IDA* Code created by Michael Schrandt - https://github.com/mschrandt/NPuzzle/tree/main
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
    with open("patternDb_"+str(boardSize)+".dat", "rb") as patternDbFile:
        groups = pickle.load(patternDbFile)
        patternDbDict = pickle.load(patternDbFile)

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
        "children": [],
        "chosen": True
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
def search(path, g, bound, dirs, tree_node):
    cur = path[-1]
    f = g + hScore(cur)

    if f > bound:
        return f
    if cur.checkWin():
        tree_node["chosen"] = True
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
            "children": [],
            "chosen": False
        }
        tree_node["children"].append(child_node)

        t = search(path, g + 1, bound, dirs, child_node)
        if t == True:
            tree_node["chosen"] = True
            return True

        if t < min:
            min = t

        path.pop()
        dirs.pop()

    # If a node has no children added, it's a leaf, so remove the children property
    if not tree_node["children"]:
        tree_node.pop("children", None)

    return min


#Greedy Algorithm code created by Joel Peckham - https://github.com/joelpeckham/8puzzle
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

    decision_tree = {
        "state": puzzle.state(),
        "move": None,
        "children": [],
        "chosen": True
    }
    path_dict = {puzzle.hash(): decision_tree}

    while openList:
        curState = heapq.heappop(openList)
        if curState.puzzle.checkWin():
            tDelta = (perf_counter_ns() - t1) / NANO_TO_SEC
            # Backtrack to label all chosen nodes
            node = path_dict[curState.puzzle.hash()]
            while node:
                node["chosen"] = True
                node = node.get("parent", None)
            print("Took {} seconds to find a solution of {} moves using Greedy First-Best Search".format(tDelta, len(curState.moves)))
            return curState.moves, tDelta, curState.puzzle, decision_tree

        tree_node = path_dict[curState.puzzle.hash()]

        for move in curState.puzzle.DIRECTIONS:
            validMove, simPuzzle = curState.puzzle.simulateMove(move)

            if validMove:
                child_node = {"state": simPuzzle.state(), "move": move, "children": [], "chosen": False, "parent": tree_node}
                tree_node["children"].append(child_node)
                if simPuzzle.hash() not in closedSet:
                    closedSet.add(simPuzzle.hash())
                    path_dict[simPuzzle.hash()] = child_node
                    nextState = State(simPuzzle, 0, hScore(simPuzzle), curState.moves + [move])
                    heapq.heappush(openList, nextState)

        if not tree_node["children"]:
            tree_node.pop("children", None)

    return None, 0, puzzle, decision_tree


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