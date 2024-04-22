from random import choice
from copy import deepcopy


class slidingGrid:
    # Initializes grid with numbers from 0 to rows*cols - 1, where 0 is the empty space
    UP = (1, 0)
    DOWN = (-1, 0)
    LEFT = (0, -1)
    RIGHT = (0, 1)

    DIRECTIONS = [UP, DOWN, LEFT, RIGHT]

    def __init__(self, boardSize=4, shuffle=0, grid_=None):
        self.boardSize = boardSize
        self.rows = boardSize
        self.cols = boardSize
        self.blankPos = None

        if grid_ is None:
            self.board = [[i * boardSize + j + 1 for j in range(boardSize)] for i in range(boardSize)]
            self.board[boardSize - 1][boardSize - 1] = 0
            self.blankPos = (boardSize - 1, boardSize - 1)
        else:
            self.board = grid_
            self.blankPos = self.find_blank()
        if shuffle:
            self.shuffle(shuffle)

    def find_blank(self):
        for i in range(self.rows):
            for j in range(self.cols):
                if self.board[i][j] == 0:
                    return i, j

    def __str__(self):
        outStr = ''
        for i in self.board:
            outStr += '\t'.join(map(str, i))
            outStr += '\n'
        return outStr

    def __getitem__(self, key):
        return self.board[key]

    def shuffle(self, numShuffles):
        for i in range(numShuffles):
            dir = choice(self.DIRECTIONS)
            self.move(dir)

    def consoleprint(self):
        for row in self.board:
            print(' '.join(str(cell).rjust(2, ' ') for cell in row))

    def move(self, dir):
        if isinstance(dir, int):
            raise ValueError("dir must be a tuple or list with at least two elements")
        newBlankPos = (self.blankPos[0] + dir[0], self.blankPos[1] + dir[1])

        if newBlankPos[0] < 0 or newBlankPos[0] >= self.boardSize \
                or newBlankPos[1] < 0 or newBlankPos[1] >= self.boardSize:
            return False

        self.board[self.blankPos[0]][self.blankPos[1]] = self.board[newBlankPos[0]][newBlankPos[1]]
        self.board[newBlankPos[0]][newBlankPos[1]] = 0
        self.blankPos = newBlankPos
        return True

    def moveSolve(self, moveList):
        for i in range(len(moveList)):
            self.move(moveList[i])
            self.consoleprint()
            print()
            # Implement something that will change the board on website

    def checkWin(self):
        for i in range(self.boardSize):
            for j in range(self.boardSize):
                if self.board[i][j] != i * self.boardSize + j + 1 and self.board[i][j] != 0:
                    return False
        return True

    def hash(self, group={}):
        if not group:
            group = {s for s in range(self.boardSize ** 2)}

        hashString = ['0'] * 2 * (self.boardSize ** 2)

        for i in range(self.boardSize):
            for j in range(self.boardSize):
                if self[i][j] in group:
                    hashString[2 * self[i][j]] = str(i)
                    hashString[2 * self[i][j] + 1] = str(j)
                else:
                    hashString[2 * self[i][j]] = 'x'
                    hashString[2 * self[i][j] + 1] = 'x'

        return ''.join(hashString).replace('x', '')

    def simulateMove(self, dir):
        simPuzzle = deepcopy(self)
        return simPuzzle.move(dir), simPuzzle

    def state(self):
        return deepcopy(self.board)
