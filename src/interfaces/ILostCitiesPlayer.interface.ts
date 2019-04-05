import { IBaseGamePlayer } from 'z-games-base-game';

import { ILostCitiesCard } from './';

export interface ILostCitiesPlayer extends IBaseGamePlayer {
  cardsHand: ILostCitiesCard[];
  cardsExpeditions: ILostCitiesCard[];
  points: number;
}
