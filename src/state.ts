import { Player } from './interface';
import { factory } from './log';

const log = factory.getLogger('State');

export class State {

  public board: string = ' '.repeat(9);
  public symbol = 'X';

  private playerById: Map<string, Player> = new Map();
  private playerBySymbol: Map<string, Player> = new Map();

  constructor(players: Array<string>) {
    for(let i = 0; i < 2 ; i++) {
      const player = {
        id: players[i],
        symbol: 'XO'[i]
      } as Player;
      this.playerById.set(player.id, player);
      this.playerBySymbol.set(player.symbol, player);
    }
  }

  public getPlayerToMove(): string {
    const player = this.playerBySymbol.get(this.symbol);
    if(!player) {
      log.error(`Could not find the next player. This is unexpected. [${this.symbol}] [${this.board}]`);
      return '';
    }
    return player.id;
  }

  public doMove(position: number): void {
    this.board = this.board.substring(0, position) + this.symbol + this.board.substring(position + 1);
    this.symbol = this.symbol === 'X' ? 'O' : 'X';
  }

  public isFull(): boolean {
    return this.board.indexOf(' ') === -1;
  }

  public getWinnerSymbol(): string | undefined {
    for(let i = 0; i < 3; i++) {
      // row
      if(this.containsWinner(this.board[3 * i], this.board[3 * i + 1], this.board[3 * i + 2])) {
        return this.board[3 * i];
      }
      // column
      if(this.containsWinner(this.board[i], this.board[i + 3], this.board[i + 6])) {
        return this.board[i];
      }
    }
    // diagonal
    if(this.containsWinner(this.board[0], this.board[4], this.board[8])) {
      return this.board[0];
    }
    if(this.containsWinner(this.board[2], this.board[4], this.board[6])) {
      return this.board[2];
    }
    return undefined;
  }

  private containsWinner(a: string, b: string, c: string): boolean {
    return a !== ' ' && a === b && b === c;
  }

}
