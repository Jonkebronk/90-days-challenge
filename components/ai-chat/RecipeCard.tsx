'use client';

import { useState } from 'react';
import { Clock, Users, ChefHat, Flame, Dumbbell, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    description?: string;
    category?: string;
    servings?: number;
    prep_time?: number;
    cook_time?: number;
    difficulty?: string;
    per_serving?: {
      kcal: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    match_score?: number;
    dietary_tags?: string[];
    cover_image?: string;
    ingredients?: Array<{
      name: string;
      amount_grams: number;
      display_amount?: string;
      display_unit?: string;
    }>;
    instructions?: Array<{
      step: number;
      instruction: string;
    }>;
  };
  compact?: boolean;
  onSelect?: (recipeId: string) => void;
  onViewDetails?: (recipeId: string) => void;
}

export function RecipeCard({ recipe, compact = false, onSelect, onViewDetails }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const difficultyColors: Record<string, string> = {
    easy: 'text-green-400 bg-green-400/10',
    medium: 'text-amber-400 bg-amber-400/10',
    hard: 'text-red-400 bg-red-400/10',
  };

  if (compact) {
    return (
      <div
        className={cn(
          'bg-[#3a3a3a] rounded-lg p-3 hover:bg-[#404040] transition-colors cursor-pointer',
          onSelect && 'cursor-pointer'
        )}
        onClick={() => onSelect?.(recipe.id)}
      >
        <div className="flex gap-3">
          {/* Image */}
          {recipe.cover_image && (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-[#2a2a2a]">
              <img
                src={recipe.cover_image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-gray-200 text-sm truncate">{recipe.title}</h4>
              {recipe.match_score !== undefined && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
                  recipe.match_score >= 80 ? 'text-green-400 bg-green-400/10' :
                  recipe.match_score >= 60 ? 'text-amber-400 bg-amber-400/10' :
                  'text-gray-400 bg-gray-400/10'
                )}>
                  {recipe.match_score}%
                </span>
              )}
            </div>

            {/* Macros */}
            {recipe.per_serving && (
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-gray-400">
                  <Flame className="h-3 w-3 inline mr-0.5" />
                  {recipe.per_serving.kcal}
                </span>
                <span className="text-blue-400">P{recipe.per_serving.protein}g</span>
                <span className="text-amber-400">K{recipe.per_serving.carbs}g</span>
                <span className="text-purple-400">F{recipe.per_serving.fat}g</span>
              </div>
            )}

            {/* Time */}
            {totalTime > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{totalTime} min</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full card
  return (
    <div className="bg-[#3a3a3a] rounded-xl overflow-hidden">
      {/* Header with image */}
      <div className="relative">
        {recipe.cover_image ? (
          <div className="h-40 bg-[#2a2a2a]">
            <img
              src={recipe.cover_image}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-[#e07a5f]/20 to-[#e07a5f]/5 flex items-center justify-center">
            <ChefHat className="h-10 w-10 text-[#e07a5f]/50" />
          </div>
        )}

        {/* Match score badge */}
        {recipe.match_score !== undefined && (
          <div className={cn(
            'absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium',
            recipe.match_score >= 80 ? 'bg-green-500 text-white' :
            recipe.match_score >= 60 ? 'bg-amber-500 text-white' :
            'bg-gray-600 text-gray-200'
          )}>
            {recipe.match_score}% match
          </div>
        )}

        {/* Category */}
        {recipe.category && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/50 text-xs text-white">
            {recipe.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-100 text-base">{recipe.title}</h4>

        {recipe.description && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{recipe.description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
          {totalTime > 0 && (
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{totalTime} min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1 text-gray-400">
              <Users className="h-3.5 w-3.5" />
              <span>{recipe.servings} port</span>
            </div>
          )}
          {recipe.difficulty && (
            <span className={cn('px-2 py-0.5 rounded-full', difficultyColors[recipe.difficulty] || 'text-gray-400 bg-gray-400/10')}>
              {recipe.difficulty === 'easy' ? 'Enkel' : recipe.difficulty === 'medium' ? 'Medel' : 'Avancerad'}
            </span>
          )}
        </div>

        {/* Macros */}
        {recipe.per_serving && (
          <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-[#2a2a2a] rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-200">{recipe.per_serving.kcal}</div>
              <div className="text-xs text-gray-500">kcal</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{recipe.per_serving.protein}g</div>
              <div className="text-xs text-gray-500">protein</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">{recipe.per_serving.carbs}g</div>
              <div className="text-xs text-gray-500">kolh.</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{recipe.per_serving.fat}g</div>
              <div className="text-xs text-gray-500">fett</div>
            </div>
          </div>
        )}

        {/* Dietary tags */}
        {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.dietary_tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-[#2a2a2a] rounded-full text-xs text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Expandable details */}
        {(recipe.ingredients || recipe.instructions) && (
          <div className="mt-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-[#e07a5f] hover:text-[#c96a52]"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Dolj detaljer
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Visa ingredienser & instruktioner
                </>
              )}
            </button>

            {expanded && (
              <div className="mt-3 space-y-4">
                {/* Ingredients */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Ingredienser</h5>
                    <ul className="space-y-1">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="text-sm text-gray-400 flex justify-between">
                          <span>{ing.name}</span>
                          <span className="text-gray-500">
                            {ing.display_amount && ing.display_unit
                              ? `${ing.display_amount} ${ing.display_unit}`
                              : `${ing.amount_grams}g`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructions */}
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Instruktioner</h5>
                    <ol className="space-y-2">
                      {recipe.instructions.map((inst, i) => (
                        <li key={i} className="text-sm text-gray-400">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#e07a5f]/20 text-[#e07a5f] text-xs mr-2">
                            {inst.step}
                          </span>
                          {inst.instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {onSelect && (
            <button
              onClick={() => onSelect(recipe.id)}
              className="flex-1 py-2 bg-[#e07a5f] hover:bg-[#c96a52] text-white text-sm rounded-lg transition-colors"
            >
              Valj detta recept
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(recipe.id)}
              className="px-3 py-2 bg-[#2a2a2a] hover:bg-[#404040] text-gray-300 text-sm rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Recipe list component for showing multiple suggestions
interface RecipeListProps {
  recipes: RecipeCardProps['recipe'][];
  title?: string;
  onSelect?: (recipeId: string) => void;
  onViewDetails?: (recipeId: string) => void;
}

export function RecipeList({ recipes, title, onSelect, onViewDetails }: RecipeListProps) {
  if (recipes.length === 0) return null;

  return (
    <div className="space-y-3">
      {title && (
        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-[#e07a5f]" />
          {title}
        </h4>
      )}
      <div className="space-y-2">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            compact
            onSelect={onSelect}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}
