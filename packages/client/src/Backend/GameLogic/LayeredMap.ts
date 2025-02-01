import { MAX_PLANET_LEVEL, MIN_PLANET_LEVEL } from "@df/constants";
import type { LocationId, Radii, WorldCoords, WorldLocation } from "@df/types";
import { Box, Circle, Point, QuadTree } from "js-quadtree";

/**
 * For every point in each of the planet quadtrees, we store a pointer to the planet.
 */
interface PlanetPointData {
  locationId: LocationId;
}

/**
 * Data structure which allows us to efficiently query for "which planets between level X and X + n
 * (for positive n) are present in the given world rectangle", as well as, in the future, "which
 * chunks are visible in the vieport".
 */
export class LayeredMap {
  private perLevelPlanetQuadtrees: Map<number, QuadTree>;
  private insertedLocations: Set<LocationId>;

  public constructor(worldRadius: number) {
    // add 500k so that players have the ability to mine far outside the current world radius.
    worldRadius += 500_000;

    const worldSize = new Box(
      -worldRadius,
      -worldRadius,
      worldRadius * 2,
      worldRadius * 2,
    );

    this.perLevelPlanetQuadtrees = new Map();
    this.insertedLocations = new Set();

    for (let i = MIN_PLANET_LEVEL; i <= MAX_PLANET_LEVEL; i++) {
      const config = {
        maximumDepth: 10,
        removeEmptyNodes: true,
      };

      this.perLevelPlanetQuadtrees.set(i, new QuadTree(worldSize, config));
    }
  }

  /**
   * Records the fact that there is a planet at the given world location.
   */
  public insertPlanet(location: WorldLocation, planetLevel: number) {
    if (this.insertedLocations.has(location.hash)) {
      return;
    }
    const quadTree = this.perLevelPlanetQuadtrees.get(planetLevel);
    const newPointData: PlanetPointData = { locationId: location.hash };
    quadTree?.insert(
      new Point(location.coords.x, location.coords.y, newPointData),
    );
    this.insertedLocations.add(location.hash);
  }

  /**
   * Removes the record of a planet at the given world location from the layered map.
   */
  public removePlanet(location: WorldLocation, planetLevel: number) {
    if (!this.insertedLocations.has(location.hash)) {
      return;
    }

    const quadTree = this.perLevelPlanetQuadtrees.get(planetLevel);

    // Find and remove the point from the quadtree
    const points = quadTree?.query(
      new Circle(location.coords.x, location.coords.y, 0.01),
    );

    if (points && points.length > 0) {
      for (const point of points) {
        const pointData = point.data as PlanetPointData;
        if (pointData.locationId === location.hash) {
          quadTree?.remove(point);
          break;
        }
      }
    }

    // Remove from inserted locations set
    this.insertedLocations.delete(location.hash);
  }

  /**
   * Gets all the planets within the given world radius of a world location.
   */
  public getPlanetsInCircle(
    coords: WorldCoords,
    worldRadius: number,
  ): LocationId[] {
    const results = [];
    for (const quad of this.perLevelPlanetQuadtrees.values()) {
      results.push(
        ...quad
          .query(new Circle(coords.x, coords.y, worldRadius))
          .map(this.getPointLocationId),
      );
    }
    return results;
  }

  /**
   * Gets the ids of all the planets that are both within the given bounding box (defined by its bottom
   * left coordinate, width, and height) in the world and of a level that was passed in via the
   * `planetLevels` parameter.
   */
  public getPlanets(
    worldX: number,
    worldY: number,
    worldWidth: number,
    worldHeight: number,
    planetLevels: number[],
    planetLevelToRadii: Map<number, Radii>,
  ): LocationId[] {
    const result: LocationId[] = [];

    for (const level of planetLevels) {
      const radiusPx = planetLevelToRadii.get(level)?.radiusWorld as number;
      const boundsIncrease = radiusPx * 5;

      const bounds = new Box(
        worldX - boundsIncrease,
        worldY - boundsIncrease,
        worldWidth + boundsIncrease * 2,
        worldHeight + boundsIncrease * 2,
      );

      const planets =
        this.perLevelPlanetQuadtrees
          .get(level)
          ?.query(bounds)
          .map(this.getPointLocationId) || [];

      result.push(...planets);
    }

    return result;
  }

  private getPointLocationId(point: Point): LocationId {
    return (point.data as PlanetPointData).locationId;
  }
}
