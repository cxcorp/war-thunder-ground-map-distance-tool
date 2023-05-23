import _mapGridPixelSizeEntries from "../data/maps_to_grid_pixel_size.json";
import _mapGridMetersEntries from "../data/maps_to_grid_sizes.json";

const mapGridPixelSizeEntries = _mapGridPixelSizeEntries as [
  MapGameModeKey,
  number
][];
const mapGridMetersEntries = _mapGridMetersEntries as [
  MapGameModeKey,
  string
][];

type MapGameModeKey = string;

interface MapDataRow {
  mapName: string;
  mapGameModeKey: MapGameModeKey;
  gameMode: string;
  gridPixelSize: number;
  gridMeters: number;
}

const parseData = (): MapDataRow[] => {
  const mapGameModeKeyRegex = /^\[(?<gameMode>[^\[\]]+)\]\s*(?<mapName>.+)$/;
  const parseMapGameModeKey = (mapGameModeKey: MapGameModeKey) => {
    const groups = mapGameModeKeyRegex.exec(mapGameModeKey)?.groups;
    return {
      gameMode: groups?.gameMode,
      mapName: groups?.mapName,
    };
  };

  const parseGridMeters = (gridMetersStr: string) =>
    parseInt(gridMetersStr.replace(/\s*m+\s*$/g, ""), 10);

  // const hasValidGameModeAndMapName = <
  //   T extends {
  //     gameMode: string | undefined;
  //     mapName: string | undefined;
  //   }
  // >(
  //   value: T
  // ): value is Omit<T, "gameMode" | "mapName"> & {
  //   gameMode: string;
  //   mapName: string;
  // } =>
  //   typeof value.gameMode !== "undefined" &&
  //   typeof value.mapName !== "undefined";

  const mapGridMeters = Object.fromEntries(mapGridMetersEntries);

  return mapGridPixelSizeEntries.flatMap(([mapGameModeKey, gridPixelSize]) => {
    const { gameMode, mapName } = parseMapGameModeKey(mapGameModeKey);
    return gameMode && mapName
      ? [
          {
            mapName,
            gameMode,
            mapGameModeKey,
            gridPixelSize,
            gridMeters: parseGridMeters(mapGridMeters[mapGameModeKey]),
          },
        ]
      : [];
  });
};

export interface MapGameMode {
  mapGameModeKey: MapGameModeKey;
  gameMode: string;
  gridMeters: number;
  gridPixelSize: number;
}

export type MapName = string;

export interface MapData {
  name: MapName;
  gameModes: MapGameMode[];
}

export const mapData: MapData[] = Object.entries(
  parseData().reduce((acc, val) => {
    const gameModes = acc[val.mapName] ?? (acc[val.mapName] = []);
    gameModes.push(val);
    return acc;
  }, Object.create(null) as Record<MapName, MapDataRow[]>)
)
  .map(([mapName, gameModes]) => ({
    name: mapName,
    gameModes: gameModes.sort(({ gameMode: a }, { gameMode: b }) =>
      a.localeCompare(b, "en-US")
    ),
  }))
  .sort(({ name: a }, { name: b }) => a.localeCompare(b, "en-US"));
