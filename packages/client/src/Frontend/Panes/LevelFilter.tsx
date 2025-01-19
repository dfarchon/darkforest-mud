import React from "react";
import styled from "styled-components";

const LevelFilterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px;
  background-color: #2c2f33;
  border: 1px solid #4a4a4d;
  border-radius: 3px;
  margin-bottom: 8px;
  margin-left: auto;
  margin-right: auto;
  width: 80%;
`;

const LevelButton = styled.button<{ selected: boolean }>`
  padding: 2px 10px;
  margin: 1px;
  background-color: ${(props) => (props.selected ? "#6c6c6c" : "#444446")};
  color: ${(props) => (props.selected ? "#fff" : "#c0c0c0")};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: ${(props) => (props.selected ? "#6c6c6c" : "#62666b")};
  }
`;

interface LevelFilterProps {
  levels: number[];
  selectedLevels: number[];
  onSelectLevel: (levels: number[]) => void;
}

export const LevelFilter: React.FC<LevelFilterProps> = ({
  levels,
  selectedLevels,
  onSelectLevel,
}) => {
  const handleClick = (level: number) => {
    if (selectedLevels.length === 0) {
      onSelectLevel([level]);
    } else if (selectedLevels.length === 1) {
      const startLevel = selectedLevels[0];
      const minLevel = Math.min(startLevel, level);
      const maxLevel = Math.max(startLevel, level);
      const range = levels.filter((l) => l >= minLevel && l <= maxLevel);
      onSelectLevel(range);
    } else {
      onSelectLevel([level]);
    }
  };

  const isSelected = (value: number) =>
    selectedLevels.length > 0 &&
    value >= Math.min(...selectedLevels) &&
    value <= Math.max(...selectedLevels);

  return (
    <div className="flex items-center justify-center">
      {" "}
      <div>Planet Lvls:</div>
      <LevelFilterContainer>
        {levels.map((level) => (
          <LevelButton
            key={level}
            selected={isSelected(level)}
            onClick={() => handleClick(level)}
          >
            {level}
          </LevelButton>
        ))}
      </LevelFilterContainer>
    </div>
  );
};
