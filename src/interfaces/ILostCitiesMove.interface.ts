import { IBaseGameMove } from 'z-games-base-game';

import { ILostCitiesCard } from './';

export interface ILostCitiesMove extends IBaseGameMove {
  card: ILostCitiesCard;
  isDiscard: boolean;
  takeExpedition: number;
}
