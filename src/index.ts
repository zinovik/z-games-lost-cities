import { BaseGame } from 'z-games-base-game';

import {
  ILostCitiesData,
  ILostCitiesPlayer,
  ILostCitiesMove,
  ILostCitiesCard,
} from './interfaces';
import {
  NAME,
  NAME_WORK,
  PLAYERS_MIN,
  PLAYERS_MAX,
  EXPEDITIONS_NUMBER,
  MIN_COST,
  MAX_COST,
  INVESTMENT_CARDS_NUMBER,
  START_CARDS_NUMBER,
} from './constants';

export * from './interfaces';
export * from './constants';

export class LostCities extends BaseGame {
  private static instance: LostCities;

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }

  public getName = (): string => {
    return NAME;
  }

  public getNameWork = (): string => {
    return NAME_WORK;
  }

  public getNewGame = (): { playersMax: number, playersMin: number, gameData: string } => {
    const gameData: ILostCitiesData = {
      cards: [],
      discards: [],
      cardsLeft: 0,
      players: [],
      discardsCount: [],
    };

    return {
      playersMax: PLAYERS_MAX,
      playersMin: PLAYERS_MIN,
      gameData: JSON.stringify(gameData),
    };
  }

  public startGame = (gameDataJSON: string): { gameData: string, nextPlayersIds: string[] } => {
    const gameData: ILostCitiesData = JSON.parse(gameDataJSON);
    const { cards } = gameData;
    let { players } = gameData;

    for (let i = 0; i < EXPEDITIONS_NUMBER; i++) {
      for (let j = MIN_COST; j < MAX_COST + 1; j++) {
        cards.push({
          cost: j,
          expedition: i,
        });
      }

      for (let k = 0; k < INVESTMENT_CARDS_NUMBER; k++) {
        cards.push({
          cost: 0,
          expedition: i,
        });
      }
    }

    players = players.map(player => {
      const cardsHand: ILostCitiesCard[] = [];

      for (let i = 0; i < START_CARDS_NUMBER; i++) {
        cardsHand.push(cards.splice(Math.floor(Math.random() * cards.length), 1)[0]);
      }

      return {
        ...player,
        cardsHand,
        cardsExpeditions: [],
        points: 0,
      };
    });

    const cardsLeft = cards.length;

    const nextPlayersIds = [players[Math.floor(Math.random() * players.length)].id];

    return {
      gameData: JSON.stringify({
        ...gameData,
        cards,
        cardsLeft,
        players,
      }), nextPlayersIds,
    };
  }

  public parseGameDataForUser = ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }): string => {
    const gameData: ILostCitiesData = JSON.parse(gameDataJSON);

    gameData.players.forEach((player, index) => {
      if (player.id === userId) {
        return;
      }

      gameData.players[index] = {
        ...gameData.players[index],
        cardsHand: [],
      };
    });

    const discards = [...gameData.discards].reverse();
    const discardsFiltered = [];

    for (let i = 0; i < EXPEDITIONS_NUMBER; i++) {
      const expeditionCard = discards.find(card => card.expedition === i);

      if (expeditionCard) {
        discardsFiltered.push(expeditionCard);
      }
    }

    return JSON.stringify({ ...gameData, discards: discardsFiltered, cards: [] });
  }

  public checkMove = ({ gameData: gameDataJSON, move: moveJSON, userId }: {
    gameData: string,
    move: string,
    userId: string,
  }): boolean => {
    const gameData: ILostCitiesData = JSON.parse(gameDataJSON);
    const move: ILostCitiesMove = JSON.parse(moveJSON);

    // const { cards, discards, cardsLeft } = gameData;
    const { players } = gameData;
    // const { card, isDiscard, takeExpedition } = move;
    const { card, isDiscard } = move;

    const playerNumber = this.getPlayerNumber({ userId, players });

    if (!isDiscard) {
      const lastExpeditionCard = [...players[playerNumber].cardsExpeditions].reverse().find(
        expeditionCard => expeditionCard.expedition === card.expedition,
      );

      if (lastExpeditionCard && card.cost < lastExpeditionCard.cost) {
        return false;
      }
    }
    // TODO Check card in the hand
    // TODO Check takeExpedition
    return true;
  }

  public makeMove = ({ gameData: gameDataJSON, move: moveJSON, userId }: { gameData: string, move: string, userId: string }): {
    gameData: string,
    nextPlayersIds: string[],
  } => {
    if (!this.checkMove({ gameData: gameDataJSON, move: moveJSON, userId })) {
      throw new Error('Impossible move!');
    }

    const gameData: ILostCitiesData = JSON.parse(gameDataJSON);
    const move: ILostCitiesMove = JSON.parse(moveJSON);

    const { cards, discards, cardsLeft } = gameData;
    let { players } = gameData;
    const { card, isDiscard, takeExpedition } = move;

    const playerNumber = this.getPlayerNumber({ userId, players });

    let cardCutOut = false;
    players[playerNumber].cardsHand = players[playerNumber].cardsHand.filter(currentCard => {
      if (!cardCutOut && currentCard.cost === card.cost && currentCard.expedition === card.expedition) {
        cardCutOut = true;
        return false;
      }

      return true;
    });

    if (isDiscard) {
      gameData.discards.push(card);
    } else {
      players[playerNumber].cardsExpeditions.push(card);
    }

    if (takeExpedition === null) {
      players[playerNumber].cardsHand.push(cards.splice(Math.floor(Math.random() * cards.length), 1)[0]);
    } else {
      let cardIndex = 0;
      discards.forEach((currentCard, index) => {
        if (currentCard.expedition === takeExpedition) {
          cardIndex = index;
        }
      });
      players[playerNumber].cardsHand.push(discards.splice(cardIndex, 1)[0]);
    }

    players[playerNumber].points = this.getPointsForPlayer(players[playerNumber]);

    const nextPlayersIds = [];

    if (cards.length) {
      if (playerNumber >= players.length - 1) {
        nextPlayersIds.push(players[0].id);
      } else {
        nextPlayersIds.push(players[playerNumber + 1].id);
      }
    } else {
      players = this.updatePlayerPlaces(players);
    }

    const discardsCount = new Array(EXPEDITIONS_NUMBER).fill(0);
    discards.forEach(discard => {
      discardsCount[discard.expedition] = discardsCount[discard.expedition] + 1;
    });

    return {
      gameData: JSON.stringify({
        ...gameData,
        cards,
        players,
        cardsLeft: cards.length,
        discardsCount,
      }),
      nextPlayersIds,
    };
  }

  public getRules = (): string[] => {
    const rules = [];

    rules.push('Lost Cities is a 60-card card game, designed in 1999 by game designer Reiner Knizia and published by several publishers. The objective of the game is to mount profitable expeditions to one or more of the five lost cities (the Himalayas, the Brazilian Rain Forest, the Desert Sands, the Ancient Volcanos and Neptune\'s Realm). The game was originally intended as a 2-player game, but rule variants have been contributed by fans to allow 1 or 2 further players, causing Reiner Knizia himself to later provide semi-official 4-player rules.');

    rules.push('Lost Cities is a fast-moving game, with players playing or discarding, and then replacing, a single card each turn. Cards represent progress on one of the five color-coded expeditions. Players must decide, during the course of the game, how many of these expeditions to actually embark upon. Card-play rules are quite straightforward, but because players can only move forward on an expedition (by playing cards which are higher-numbered than those already played), making the right choice in a given game situation can be quite difficult. An expedition that has been started will earn points according to how much progress has been made when the game ends, and after three rounds, the player with the highest total score wins the game. Each expedition that is started but not thoroughly charted incurs a negative point penalty (investment costs).');

    rules.push('Interaction between players is indirect, in that one cannot directly impact another player\'s expeditions. However, since players can draw from the common discard piles, they are free to make use of opposing discards. Additionally, since the available cards for a given expedition are finite, progress made by an opponent in a given color can lead to difficulty making progress in that same color.');

    rules.push('The game\'s board, while designed to supplement the theme, is optional and consists only of simple marked areas where players place discards. If Lost Cities had four expeditions instead of five, it could be played with a standard deck of playing cards. When doing so, the face cards would represent investment cards, with numbered cards two through ten serving as the expedition progress cards.');

    return rules;
  }

  private getPointsForPlayer = (player: ILostCitiesPlayer): number => {
    let points = 0;

    const expeditions: number[][] = [];

    for (let i = 0; i < EXPEDITIONS_NUMBER; i++) {
      expeditions.push([]);
    }

    player.cardsExpeditions.forEach(card => {
      expeditions[card.expedition].push(card.cost);
    });

    expeditions.forEach(expeditionCards => {
      let multiplier = 1;
      let expeditionPoints = 0;

      expeditionCards.forEach(card => {
        if (card) {
          expeditionPoints += card;
        } else {
          multiplier++;
        }
      });

      points += expeditionCards.length ? (expeditionPoints - 20) * multiplier : 0;
      points += expeditionCards.length >= 8 ? 20 : 0;
    });

    return points;
  }

  private updatePlayerPlaces = (players: ILostCitiesPlayer[]): ILostCitiesPlayer[] => {
    const playersPlaces: Array<{ id: string, points: number }> = [];

    players.forEach(player => {
      playersPlaces.push({ id: player.id, points: player.points });
    });

    playersPlaces.sort((a, b) => b.points - a.points);

    return players.map(player => {
      let place = 0;

      playersPlaces.forEach((playersPlace, i) => {
        if (player.id === playersPlace.id) {
          place = i + 1;
        }
      });

      return {
        ...player,
        place,
      };
    });
  }

  private getPlayerNumber = ({ userId, players }: { userId: string, players: ILostCitiesPlayer[] }): number => {
    let playerNumber = 0;

    players.forEach((player, index) => {
      if (player.id === userId) {
        playerNumber = index;
      }
    });

    return playerNumber;
  }
}

export const getCardShape = (numberPropType: object): object => {
  return {
    cost: numberPropType,
    expedition: numberPropType,
  };
};
