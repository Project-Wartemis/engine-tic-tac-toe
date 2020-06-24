import { Engine } from 'wartemis';
import { Action } from './interface';
import { State } from './state';

export class EngineTicTacToe extends Engine<State, Action> {

  constructor() {
    super('Tic Tac Toe');
  }

  // necessary methods

  public generateInitialState(players: Array<string>): State {
    return new State(players);
  }

  public getPlayersToMove(state: State): Array<string> {
    return [state.getPlayerToMove()];
  }

  public validateAction(state: State, player: string, action: Action): string | null {
    if(state.board[action.position] !== ' ') {
      return `Position ${action.position} is not free`;
    }
    return null;
  }

  public processActions(state: State, actions: Map<string, Action>): State {
    for(const action of actions.values()) {
      state.doMove(action.position);
    }
    return state;
  }

  public isGameOver(state: State, turn: number): boolean {
    if(state.isFull()) {
      return true;
    }
    if(state.getWinnerSymbol()) {
      return true;
    }
    return false;
  }
}
