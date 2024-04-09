import random
from copy import deepcopy


class slidingGrid:
    # Initializes grid with numbers from 0 to rows*cols - 1, where 0 is the empty space
    def __init__(self, rows=4, cols=4, grid=None):
        self.rows = rows
        self.cols = cols
        self.boardSize = 4
        if grid:
            self.grid = grid
            self.space = None
            for i in range(self.rows):
                for j in range(self.cols):
                    if self.grid[i][j] == 0:
                        self.space = (i, j)
                        break
                if self.space is not None:
                    break
            if self.space is None:
                raise Exception("No empty spaces in grid")
        else:
            self.grid = [[(i * self.cols + j + 1) % (self.rows * self.cols) for j in range(self.cols)] for i in
                         range(self.rows)]
            self.space = self.rows - 1, self.cols - 1

    def consoleprint(self):
        for row in self.grid:
            print(' '.join(str(cell).rjust(2, ' ') for cell in row))

    def swap(self, x1, y1, x2, y2):
        self.grid[x1][y1], self.grid[x2][y2] = self.grid[x2][y2], self.grid[x1][y1]

    def shuffle(self, moves=12):
        directions = [0, 1, 2, 3]  # down, up, right, left
        for _ in range(moves):
            # Attempt to move in a random direction from the empty space's position
            moved = False
            while not moved:
                direction = random.choice(directions)
                moved = self.move(direction)

    # Moves the blank space; direction is [0, 1, 2, 3] for [down, up, right, left]
    def move(self, direction):
        if direction == 0 and self.space[0] + 1 < self.rows:
            self.swap(self.space[0], self.space[1], self.space[0] + 1, self.space[1])
            self.space = [self.space[0] + 1, self.space[1]]
            return True
        elif direction == 1 and self.space[0] - 1 >= 0:
            self.swap(self.space[0], self.space[1], self.space[0] - 1, self.space[1])
            self.space = [self.space[0] - 1, self.space[1]]
            return True
        elif direction == 2 and self.space[1] + 1 < self.cols:
            self.swap(self.space[0], self.space[1], self.space[0], self.space[1] + 1)
            self.space = [self.space[0], self.space[1] + 1]
            return True
        elif direction == 3 and self.space[1] - 1 >= 0:
            self.swap(self.space[0], self.space[1], self.space[0], self.space[1] - 1)
            self.space = [self.space[0], self.space[1] - 1]
            return True
        else:
            return False

    # Returns true if this grid matches provided grid
    # If no provided grid, compare to enumeration from 1.
    def is_solved(self, solution=[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 0]]):
        for i in range(len(solution)):
            for j in range(len(solution[0])):
                # Use -1 for blank spaces (any tile)
                if self.grid[i][j] != solution[i][j] and solution[i][j] != -1:
                    return False
        return True

    def hash(self, group={}):
        if not group:
            group = {s for s in range(self.boardSize ** 2)}

        hashString = ['0'] * 2 * (self.boardSize ** 2)

        for i in range(self.boardSize):
            for j in range(self.boardSize):
                if self.grid[i][j] in group:
                    hashString[2 * self.grid[i][j]] = str(i)
                    hashString[2 * self.grid[i][j] + 1] = str(j)
                else:
                    hashString[2 * self.grid[i][j]] = 'x'
                    hashString[2 * self.grid[i][j] + 1] = 'x'

        return ''.join(hashString).replace('x', '')

    def simulateMove(self, _dir):
        simPuzzle = deepcopy(self)

        return simPuzzle.move(_dir), simPuzzle

    # Determines if initial shuffled grid id solvable or not
    # Returns True if solvable
    def is_solvable(self):
        arr = [cell for row in self.grid for cell in row if cell != 0]
        inversions = sum(sum(arr[i] > arr[j] for j in range(i + 1, len(arr))) for i in range(len(arr)))
        if self.cols % 2 == 0:
            inversions += self.grid[-1][-2] > self.grid[-1][-1]
        return inversions % 2 == 0

    # Makes grid solvable if it initially is not
    def make_solvable(self):
        if not self.is_solvable():
            self.shuffle()
            self.make_solvable()
            print("Reshuffled")
        else:
            print("Shuffled")