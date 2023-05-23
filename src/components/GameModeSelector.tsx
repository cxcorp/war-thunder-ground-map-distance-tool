import Select from "react-select";
import { useCallback } from "react";
import { MapGameMode } from "@/services/map-service";
import { inter } from "@/common/fonts";
import styles from "@/styles/MapSelector.module.css";

interface GameModeSelectorProps {
  id: string;

  gameModes: MapGameMode[];
  value: MapGameMode | null;
  onChange: (value: MapGameMode | null) => void;
}

const getOptionLabel = (value: MapGameMode) => value.gameMode;
const getOptionValue = (value: MapGameMode) => value.mapGameModeKey;

export const GameModeSelector = ({
  id,
  gameModes,
  value,
  onChange,
}: GameModeSelectorProps) => {
  const handleChange = useCallback(
    (newValue: MapGameMode | null) => {
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <Select<MapGameMode>
      id={id}
      instanceId={`${id}-instance`}
      inputId={`${id}-input`}
      className={`${styles.selector} ${inter.className}`}
      options={gameModes}
      value={value ?? undefined}
      onChange={handleChange}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
    />
  );
};
