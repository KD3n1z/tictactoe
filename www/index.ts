const { shell } = require('electron');

var board: number[][];

var playerIsFirst: boolean = true;

function openUrl(url: string): void {
    shell.openExternal(url);
}

function cloneBoard(array): number[][] {
    return [
        [...array[0]],
        [...array[1]],
        [...array[2]]
    ];
}

async function makeMove (y: number, x: number) {
    if(board[y][x] != 0){
        return;
    }
    board[y][x] = 1;
    
    displayBoard();

    if(checkWin(board) == 1) {
        setStatus("you won!");
        disableButtons(true);
        return;
    }
    
    let possibleMoves: {x: number, y: number}[] = getPossibleMoves(board);

    if(possibleMoves.length > 0) {
        await aiMakeBestMove(possibleMoves);
    }

    switch(checkWin(board)) {
        case 2:
            setStatus("you've lost!");
            disableButtons(true);
            break;
        default:
            if(getPossibleMoves(board).length == 0) {
                setStatus("draw!");
                disableButtons(true);
            }
            break;
    }
    displayBoard();
}

function getPossibleMoves(cBoard): {x: number, y: number}[] {
    let possibleMoves: {x: number, y: number}[] = [];

    for(let _x = 0; _x < 3; _x++) {
        for(let _y = 0; _y < 3; _y++) {
            if(cBoard[_y][_x] == 0) {
                possibleMoves.push({x: _x, y: _y});
            }
        }
    }

    return possibleMoves;
}

async function aiMakeBestMove(possibleMoves: {x: number, y: number}[]) {
    setStatus("ai makes a move...");
    disableControls(true);
    disableButtons(true);
    let bestMove: {x: number, y: number} = null;
    let bestScore = -Infinity;

    possibleMoves.forEach(move => {
        let clonedBoard: number[][] = cloneBoard(board);
        clonedBoard[move.y][move.x] = 2;

        let score = minimax(clonedBoard, false);

        if(score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    });
    
    board[bestMove.y][bestMove.x] = 2;
    disableControls(false);
    disableButtons(false);
    setStatus("your turn");
}

function minimax(cBoard: number[][], isMaximizing: boolean = true, depth: number = 0): number{
    let state: number = checkWin(cBoard);

    if(state == 1) {
        return -100 + depth;
    }
    else if(state == 2) {
        return 100 - depth;
    }
    
    let possibleMoves: {x: number, y: number}[] = getPossibleMoves(cBoard);

    if(possibleMoves.length == 0){
        return 0;
    }

    let bestScore = -Infinity;

    if(!isMaximizing) {
        bestScore = Infinity;
    }

    possibleMoves.forEach(move => {
        let clonedBoard: number[][] = cloneBoard(cBoard);
        if(isMaximizing) {
            clonedBoard[move.y][move.x] = 2;
            bestScore = Math.max(bestScore, minimax(clonedBoard, false, depth + 1));
        }else{
            clonedBoard[move.y][move.x] = 1;
            bestScore = Math.min(bestScore, minimax(clonedBoard, true, depth + 1));
        }
    });

    return bestScore;
}

function displayBoard(): void {
    let buttons : HTMLCollection = document.getElementById("gameboard").children;

    for(let i: number = 0; i < 9; i++) {
        let cell: string;

        switch(board[Math.floor(i / 3)][i % 3]) {
            case 0:
                cell = "";
                break;
            case 1:
                cell = "X";
                break;
            case 2:
                cell = "O";
                break;
        }

        buttons[i].textContent = cell;
    }
}

function checkWin(board : number[][]): number {
    for(let i: number = 0; i < 3; i++) {
        if(board[0][i] != 0 && board[0][i] == board[1][i] && board[1][i] == board[2][i]) {
            return board[0][i];
        }
        if(board[i][0] != 0 && board[i][0] == board[i][1] && board[i][1] == board[i][2]) {
            return board[i][0];
        }
    }

    if(board[0][0] != 0 && board[0][0] == board[1][1] && board[1][1] == board[2][2]) {
        return board[0][0];
    }

    if(board[0][2] != 0 && board[0][2] == board[1][1] && board[1][1] == board[2][0]) {
        return board[0][2];
    }

    return 0;
}

function newGame(): void {
    board = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    if(!playerIsFirst){
        aiMakeBestMove(getPossibleMoves(board));
    }
    displayBoard();
    disableButtons(false);
    setStatus("your turn");
}

function disableButtons(disable: boolean): void {
    let buttons: HTMLCollection = document.getElementById("gameboard").children;
    for(let i: number = 0; i < buttons.length; i++) {
        (buttons[i] as HTMLButtonElement).disabled = disable
    }
}

function disableControls(disable: boolean): void {
    let buttons: HTMLCollection = document.getElementById("btns").children;
    for(let i: number = 0; i < buttons.length; i++) {
        (buttons[i] as HTMLButtonElement).disabled = disable
    }
}

function setStatus(status: string): void {
    document.getElementById("status").textContent = status;
}

function changeFirstPlayer(button: HTMLButtonElement) {
    playerIsFirst = !playerIsFirst;

    console.log(playerIsFirst);

    if(playerIsFirst) {
        button.textContent = "You start the game";
        for(let x: number = 0; x < 3; x++) {
            for(let y: number = 0; y < 3; y++) {
                if(board[y][x] == 1) {
                    return;
                }
            }
        }
        newGame();
    }else{
        button.textContent = "AI starts the game";
        for(let x: number = 0; x < 3; x++) {
            for(let y: number = 0; y < 3; y++) {
                if(board[y][x] != 0) {
                    return;
                }
            }
        }
        aiMakeBestMove(getPossibleMoves(board)).then(() => {
            displayBoard();
        });
    }
}

document.addEventListener("DOMContentLoaded", function() {
    newGame();
});