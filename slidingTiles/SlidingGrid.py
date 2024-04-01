import random


class SlidingGrid:
    # Initializes grid with numbers from 0 to rows*cols - 1, where 0 is the empty space
    def __init__(self, rows=3, cols=3, grid=None):
        self.rows = rows
        self.cols = cols
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
            self.grid = [[(i * self.cols + j + 1) % (self.rows * self.cols) for j in range(self.cols)] for i in range(self.rows)]
            self.space = self.rows - 1, self.cols - 1

    def consoleprint(self):
        for row in self.grid:
            print(' '.join(str(cell).rjust(2, ' ') for cell in row))

    def swap(self, x1, y1, x2, y2):
        self.grid[x1][y1], self.grid[x2][y2] = self.grid[x2][y2], self.grid[x1][y1]

    def shuffle(self, moves=250):
        i = 0
        while i < moves:
            if self.move(random.choice([0, 1, 2, 3])):
                i += 1

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
    def is_solved(self, solution=None):
        if solution:
            for i in range(len(solution)):
                for j in range(len(solution[0])):
                    # Use -1 for blank spaces (any tile)
                    if self.grid[i][j] != solution[i][j] and solution[i][j] != -1:
                        return False
            return True

        else:
            expected_num = 1
            for i in range(self.rows):
                for j in range(self.cols):
                    if self.grid[i][j] != expected_num % (self.rows * self.cols):
                        return False
                    expected_num += 1
            return True
