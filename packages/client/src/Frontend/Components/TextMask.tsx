import React, { useCallback, useState } from "react";
import { TextPreview } from "./TextPreview";

const DEFAULT_UNFOCUSED_WIDTH = "50px";
const DEFAULT_FOCUSED_WIDTH = "150px";

export function TextMask({
  maskText = "",
  text = "",
  noticeText = "",
  unFocusedWidth = DEFAULT_UNFOCUSED_WIDTH,
  focusedWidth = DEFAULT_FOCUSED_WIDTH,
  style,
}: {
  maskText?: string;
  text?: string;
  noticeText?: string;
  unFocusedWidth?: string;
  focusedWidth?: string;
  maxLength?: number;
  style?: React.CSSProperties;
}) {
  const [mask, setMask] = useState(true);

  const onClick = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    setMask(false);
  }, []);

  if (mask) {
    return (
      <span
        style={{ color: "white", backgroundColor: "#00DC82" }}
        onClick={onClick}
      >
        {maskText}
      </span>
    );
  } else {
    return (
      <span>
        <TextPreview
          text={text}
          unFocusedWidth={unFocusedWidth}
          focusedWidth={focusedWidth}
          style={style}
        />
        <span style={{ color: "pink" }}> {noticeText} </span>
      </span>
    );
  }
}
