import random


class SlidingGrid:
    # initializes grid with numbers from 0-size*size - 1, where 0 is the empty space
    def __init__(self, size=3, grid=None):
        self.size = size
        # inside __init__
        if grid:
            self.grid = grid
            self.space = None
            for i in range(size):
                for j in range(size):
                    if self.grid[i][j] == 0:
                        self.space = (i, j)
                        break
                if self.space is not None:
                    break
            if self.space is None:
                raise Exception("No empty spaces in grid")
        else:
            self.grid = [[(i * size + j + 1) % (size ** 2) for j in range(size)] for i in range(size)]
            self.space = size - 1, size - 1

    def consoleprint(self):
        for row in self.grid:
            print(''.join(str(cell).rjust(2, ' ') for cell in row))

    def swap(self, x1, y1, x2, y2):
        self.grid[x1][y1], self.grid[x2][y2] = self.grid[x2][y2], self.grid[x1][y1]

    def shuffle(self, moves=100):
        i = 0
        while i < moves:
            if self.move(random.choice([0, 1, 2, 3])):
                i += 1

    # "Moves" the singular blank space implicitly, with [0, 1, 2, 3] being [down, up, right, left]
    def move(self, direction):
        # Move down
        if direction == 0 and self.space[0] + 1 < self.size:
            self.swap(self.space[0], self.space[1], self.space[0] + 1, self.space[1])
            self.space = [self.space[0] + 1, self.space[1]]
            return True
        # Move up
        elif direction == 1 and self.space[0] - 1 >= 0:
            self.swap(self.space[0], self.space[1], self.space[0] - 1, self.space[1])
            self.space = [self.space[0] - 1, self.space[1]]
            return True
        # Move right
        elif direction == 2 and self.space[1] + 1 < self.size:
            self.swap(self.space[0], self.space[1], self.space[0], self.space[1] + 1)
            self.space = [self.space[0], self.space[1] + 1]
            return True
        # Move left
        elif direction == 3 and self.space[1] - 1 >= 0:
            self.swap(self.space[0], self.space[1], self.space[0], self.space[1] - 1)
            self.space = [self.space[0], self.space[1] - 1]
            return True
        else:
            return False

    def is_solved(self):
        for i in range(self.size ** 2):
            if self.grid[i // self.size][i % self.size] != i:
                return False
        return True
