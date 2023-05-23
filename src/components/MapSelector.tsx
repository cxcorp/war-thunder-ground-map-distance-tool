import Select from "react-select";
import { useCallback } from "react";
import { MapData } from "@/services/map-service";
import { inter } from "@/common/fonts";
import styles from "@/styles/MapSelector.module.css";

interface MapSelectorProps {
  id: string;

  maps: MapData[];
  value: MapData | null;
  onChange: (value: MapData | null) => void;
}

const getOptionLabel = (value: MapData) => value.name;
const getOptionValue = (value: MapData) => value.name;

export const MapSelector = ({
  id,
  maps,
  value,
  onChange,
}: MapSelectorProps) => {
  const handleChange = useCallback(
    (newValue: MapData | null) => {
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <Select<MapData>
      id={id}
      instanceId={`${id}-instance`}
      inputId={`${id}-input`}
      className={`${styles.selector} ${inter.className}`}
      options={maps}
      value={value ?? undefined}
      onChange={handleChange}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
    />
  );
};
