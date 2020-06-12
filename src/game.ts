import { factory } from './log';
import Player from './game/player';
import State from './game/state';
import Connection from './networking/connection';
import { ActionMessage, ErrorMessage, StartMessage, StateMessage, StopMessage } from './networking/message';

const log = factory.getLogger('Game');

export default class Game {

  private turn = 0;
  private state = {
    board: ' '.repeat(9)
  } as State;
  private moveIdCounter = 0;
  private playerById: Map<string, Player> = new Map();
  private playerBySymbol: Map<string, Player> = new Map();
  private symbolToMove = 'X';

  constructor(
    private gameId: number,
    private prefix: string,
    private suffix: string,
    private connection: Connection,
  ) { }

  private broadcastState(): void {
    if(this.turn >= 9) {
      this.stop();
    }
    if(this.getWinnerSymbol()) {
      this.stop();
    }

    const playerToMove = this.playerBySymbol.get(this.symbolToMove);
    if(!playerToMove) {
      log.error('Could not find the next player. This is unexpected.');
      return;
    }

    this.connection.send({
      type: 'state',
      game: this.gameId,
      turn: this.turn,
      players: [ playerToMove.id ],
      state: this.state,
    } as StateMessage);
  }

  private stop(): void {
    log.info('stopping game ' + this.gameId);
    this.connection.send({
      type: 'stop',
      game: this.gameId,
    } as StopMessage);
  }

  private paddify(id: number): string {
    return this.prefix + id + this.suffix;
  }

  public handleStartMessage(message: StartMessage): void {
    if(message.players.length !== 2) {
      return;
    }
    for(let i = 0; i < 2 ; i++) {
      const player = {
        id: this.paddify(message.players[i]),
        symbol: 'XO'[i]
      } as Player;
      this.playerById.set(player.id, player);
      this.playerBySymbol.set(player.symbol, player);
    }

    this.broadcastState();
  }

  public handleActionMessage(message: ActionMessage): void {
    try {
      const player = this.playerById.get(message.player);
      if(!player) {
        log.error('Could not find the next player. This is unexpected.');
        return;
      }
      // is this the player we expect an action from?
      if(player.symbol !== this.symbolToMove) {
        return;
      }
      // is this position free?
      if(this.state.board[message.action.position] !== ' ') {
        return;
      }
      // all is fine
      this.doMove(message.action.position, player.symbol);
      this.broadcastState();
    } catch(error) {
      this.connection.send({
        type: 'error',
        content: 'error while processing the move, please check your formatting'
      } as ErrorMessage);
      log.info(`Error while processing a move of a player: [${error}]`);
    }
  }

  private doMove(position: number, symbol: string): void {
    this.state.board = this.state.board.substring(0, position) + symbol + this.state.board.substring(position + 1);
    this.turn++;
    this.symbolToMove = symbol === 'X' ? 'O' : 'X';
  }

  private getWinnerSymbol(): string | undefined {
    const board = this.state.board;
    for(let i = 0; i < 3; i++) {
      // row
      if(this.containsWinner(board[3 * i], board[3 * i + 1], board[3 * i + 2])) {
        return board[3 * i];
      }
      // column
      if(this.containsWinner(board[i], board[i + 3], board[i + 6])) {
        return board[i];
      }
    }
    // diagonal
    if(this.containsWinner(board[0], board[4], board[8])) {
      return board[0];
    }
    if(this.containsWinner(board[2], board[4], board[6])) {
      return board[2];
    }
    return undefined;
  }

  private containsWinner(a: string, b: string, c: string): boolean {
    return a !== ' ' && a === b && b === c;
  }
}
