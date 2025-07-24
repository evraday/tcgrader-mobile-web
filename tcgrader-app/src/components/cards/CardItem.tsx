import React from 'react';
import { Card } from '../../types';
import { RARITY_COLORS, CONDITION_NAMES } from '../../constants';

interface CardItemProps {
  card: Card;
  onClick?: () => void;
  showPrice?: boolean;
  showCondition?: boolean;
}

const CardItem: React.FC<CardItemProps> = ({ 
  card, 
  onClick, 
  showPrice = true,
  showCondition = true 
}) => {
  return (
    <div 
      className="card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        {card.frontImage ? (
          <img
            src={card.frontImage}
            alt={card.name}
            className="w-full h-48 object-cover rounded-lg mb-3"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-4xl">🎴</span>
          </div>
        )}
        
        {card.foil && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
            Foil
          </div>
        )}
      </div>

      <h3 className="font-semibold text-sm mb-1 truncate">{card.name}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {card.setName} • #{card.number}
      </p>

      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium capitalize"
          style={{ color: RARITY_COLORS[card.rarity] }}
        >
          {card.rarity}
        </span>
        
        {showCondition && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {CONDITION_NAMES[card.condition]}
          </span>
        )}
      </div>

      {showPrice && card.prices && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Market</span>
            <span className="text-sm font-bold text-primary-600">
              ${(card.prices.market * (card.foil && card.prices.foilMultiplier ? card.prices.foilMultiplier : 1)).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {(card.signed || card.altered) && (
        <div className="mt-2 flex gap-2">
          {card.signed && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
              Signed
            </span>
          )}
          {card.altered && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
              Altered
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CardItem;