interface FilterOptions {
  biomes: string[];
  types: string[];
  rarities: string[];
}

interface FilterState {
  biome: string;
  type: string;
  rarity: string;
}

interface ArtifactFiltersProps {
  filters: FilterState;
  setFilters: (f: (prev: FilterState) => FilterState) => void;
  options: FilterOptions;
}

export function ArtifactFilters({
  filters,
  setFilters,
  options,
}: ArtifactFiltersProps) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-4 text-gray-400">
      {/* Biome */}
      <select
        value={filters.biome}
        onChange={(e) => setFilters((f) => ({ ...f, biome: e.target.value }))}
        className="rounded border px-3 py-1 text-sm"
      >
        <option value="">All Biomes</option>
        {options.biomes.map((biome) => (
          <option key={biome} value={biome}>
            {biome}
          </option>
        ))}
      </select>

      {/* Type */}
      <select
        value={filters.type}
        onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        className="rounded border px-3 py-1 text-sm"
      >
        <option value="">All Art types</option>
        {options.types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {/* Rarity */}
      <select
        value={filters.rarity}
        onChange={(e) => setFilters((f) => ({ ...f, rarity: e.target.value }))}
        className="rounded border px-3 py-1 text-sm"
      >
        <option value="">All Rarities</option>
        {options.rarities.map((rarity) => (
          <option key={rarity} value={rarity}>
            {rarity}
          </option>
        ))}
      </select>
    </div>
  );
}
