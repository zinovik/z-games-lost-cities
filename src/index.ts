import { BaseGame } from 'z-games-base-game';

import { ILostCitiesData, ILostCitiesPlayer, ILostCitiesMove, ILostCitiesCard } from './interfaces';
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
  };

  public getNameWork = (): string => {
    return NAME_WORK;
  };

  public getOptionsVariants(): Array<{ name: string; values: string[] }> {
    return [...super.getOptionsVariants()];
  }

  public getNewGame = (): { playersMax: number; playersMin: number; gameData: string } => {
    const gameData: ILostCitiesData = {
      cards: [],
      discards: [],
      cardsLeft: 0,
      players: [],
      discardsCount: [],
      options: [
        {
          name: 'Max Time',
          value: '1 hour',
        },
      ],
    };

    return {
      playersMax: PLAYERS_MAX,
      playersMin: PLAYERS_MIN,
      gameData: JSON.stringify(gameData),
    };
  };

  public startGame = (gameDataJSON: string): { gameData: string; nextPlayersIds: string[] } => {
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
      }),
      nextPlayersIds,
    };
  };

  public parseGameDataForUser = ({ gameData: gameDataJSON, userId }: { gameData: string; userId: string }): string => {
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
  };

  public checkMove = ({
    gameData: gameDataJSON,
    move: moveJSON,
    userId,
  }: {
    gameData: string;
    move: string;
    userId: string;
  }): boolean => {
    const gameData: ILostCitiesData = JSON.parse(gameDataJSON);
    const move: ILostCitiesMove = JSON.parse(moveJSON);

    // const { cards, discards, cardsLeft } = gameData;
    const { players } = gameData;
    // const { card, isDiscard, takeExpedition } = move;
    const { card, isDiscard } = move;

    const playerNumber = this.getPlayerNumber({ userId, players });

    if (!isDiscard) {
      const lastExpeditionCard = [...players[playerNumber].cardsExpeditions]
        .reverse()
        .find(expeditionCard => expeditionCard.expedition === card.expedition);

      if (lastExpeditionCard && card.cost < lastExpeditionCard.cost) {
        return false;
      }
    }
    // TODO Check card in the hand
    // TODO Check takeExpedition
    return true;
  };

  public makeMove = ({
    gameData: gameDataJSON,
    move: moveJSON,
    userId,
  }: {
    gameData: string;
    move: string;
    userId: string;
  }): {
    gameData: string;
    nextPlayersIds: string[];
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

    let isCardCutOut = false;
    players[playerNumber].cardsHand = players[playerNumber].cardsHand.filter(currentCard => {
      if (!isCardCutOut && currentCard.cost === card.cost && currentCard.expedition === card.expedition) {
        isCardCutOut = true;
        return false;
      }

      return true;
    });

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

    if (isDiscard) {
      gameData.discards.push(card);
    } else {
      players[playerNumber].cardsExpeditions.push(card);
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
  };

  public getRules = (): string[] => {
    const rules = [];

    rules.push('Objective of the game');

    rules.push(
      'You are an adventurer trying to succeed in up to five expeditions (represented by five colors). To make ' +
        'progress, you will lay the corresponding cards in ascending order. Investment cards will let you double, ' +
        'triple, quadruple your earnings. But beware! Starting an expedition costs points and you may fail to cover ' +
        'your costs!',
    );

    rules.push("Player's turn");

    rules.push("Every player starts with 8 cards in hand. A player's turn is very simple: play a card, draw a card");

    rules.push('How to play a card?');

    rules.push(
      'You can play a card in two ways: 1) by laying it down on an expedition. The card will stay there for the ' +
        'rest of the game. 2) OR by discarding it on the matching discard pile. The card may be picked later by ' +
        'either player.',
    );

    rules.push('How to lay a card?');

    rules.push('Laying a card on an expedition must be done in ascending order. Cards do not need to be consecutive.');

    rules.push('Discarding a card');

    rules.push(
      'If you do not want to lay a card on an expedition, you can discard one instead. There is one discard pile ' +
        'per color.',
    );

    rules.push('Drawing a card');

    rules.push(
      'Once you have played a card, you must draw another one: 1) from the main deck,; 2) OR from any discard pile. ' +
        'You can not draw a card that you have discarded in the same turn!',
    );

    rules.push('Investment cards (X)');

    rules.push(
      'Investment cards are represented by the sign X. They must be laid before an expedition is started, that is ' +
        'before any value card on the same expedition. They will double, triple, quadruple your earnings or losses ' +
        '(for 1, 2, or 3 investment cards).',
    );

    rules.push('End of the game');

    rules.push('When a player draws the last card of the deck, the game ends immediately.');

    rules.push('Scoring');

    rules.push(
      'Each expedition which has at least one card on it costs 20 points. This cost is substracted from the total ' +
        'value of the cards on that expedition. This total is then multiplied if there are investment cards on the ' +
        'expedition (x2, x3 or x4). If the expedition has at least 8 cards, a (non multiplied) bonus of 20 points ' +
        'is given. The final score of a player is the total of points for the five expeditions. It can be negative!',
    );

    rules.push('Deck content');

    rules.push('In each color, there are: ONE card for each value between 2 and 10 and THREE investment cards (X).');

    return rules;
  };

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
  };

  private updatePlayerPlaces = (players: ILostCitiesPlayer[]): ILostCitiesPlayer[] => {
    const playersPlaces: Array<{ id: string; points: number }> = [];

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
  };

  private getPlayerNumber = ({ userId, players }: { userId: string; players: ILostCitiesPlayer[] }): number => {
    let playerNumber = 0;

    players.forEach((player, index) => {
      if (player.id === userId) {
        playerNumber = index;
      }
    });

    return playerNumber;
  };
}

export const getCardShape = (numberPropType: object): object => {
  return {
    cost: numberPropType,
    expedition: numberPropType,
  };
};
