import EventEmitter from "events";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import { Link } from "../Components/CoreUI";
import { MythicLabelText } from "../Components/Labels/MythicLabel";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import {
  Blue,
  Green,
  Invisible,
  Pink,
  Red,
  Sub,
  Subber,
  Text,
  White,
} from "../Components/Text";
import {
  type LoadingBarHandle,
  TextLoadingBar,
} from "../Components/TextLoadingBar";
import dfstyles from "../Styles/dfstyles";
import { isFirefox } from "../Utils/BrowserChecks";
import { TerminalTextStyle } from "../Utils/TerminalTypes";

const ENTER_KEY_CODE = 13;
const UP_ARROW_KEY_CODE = 38;
const ON_INPUT = "ON_INPUT";

export interface TerminalHandle {
  printElement: (element: React.ReactElement) => void;
  printLoadingBar: (
    prettyEntityName: string,
    ref: React.RefObject<LoadingBarHandle>,
  ) => void;
  printLoadingSpinner: () => void;
  print: (str: string, style?: TerminalTextStyle) => void;
  println: (str: string, style?: TerminalTextStyle) => void;
  printShellLn: (str: string) => void;
  printLink: (
    str: string,
    onClick: () => void,
    style: TerminalTextStyle,
  ) => void;
  focus: () => void;
  removeLast: (n: number) => void;
  getInput: () => Promise<string>;
  newline: () => void;
  setUserInputEnabled: (enabled: boolean) => void;
  setInput: (input: string) => void;
  clear: () => void;
}

export interface TerminalProps {
  promptCharacter: string;
  visible?: boolean;
  useCaretElement?: boolean;
}

export const Terminal = React.forwardRef<TerminalHandle, TerminalProps>(
  TerminalImpl,
);

let terminalLineKey = 0;

function TerminalImpl(
  { promptCharacter, visible, useCaretElement }: TerminalProps,
  ref: React.Ref<TerminalHandle>,
) {
  const containerRef = useRef(document.createElement("div"));
  const inputRef = useRef(document.createElement("textarea"));
  const heightMeasureRef = useRef(document.createElement("textarea"));

  const [onInputEmitter] = useState(new EventEmitter());
  const [fragments, setFragments] = useState<React.ReactNode[]>([]);
  const [userInputEnabled, setUserInputEnabled] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [inputHeight, setInputHeight] = useState<number>(1);
  const [previousInput, setPreviousInput] = useState<string>("");

  const append = useCallback(
    (node: React.ReactNode) => {
      setFragments((lines) => {
        return [
          ...lines.slice(-199),
          <span key={terminalLineKey++}>{node}</span>,
        ];
      });
    },
    [setFragments],
  );

  const removeLast = useCallback(
    (n: number) => {
      setFragments((lines) => {
        return [...lines.slice(0, lines.length - n)];
      });
    },
    [setFragments],
  );

  const newline = useCallback(() => {
    append(<br />);
  }, [append]);

  const print = useCallback(
    (
      str: string,
      style = TerminalTextStyle.Sub,
      onClick: (() => void) | undefined = undefined,
    ) => {
      let fragment: JSX.Element;
      let innerFragment: JSX.Element = <span>{str}</span>;

      if (onClick !== undefined && style === TerminalTextStyle.Pink) {
        innerFragment = (
          <Link onClick={onClick} color={"pink"}>
            {innerFragment}
          </Link>
        );
      } else if (onClick !== undefined) {
        innerFragment = <Link onClick={onClick}>{innerFragment}</Link>;
      }

      switch (style) {
        case TerminalTextStyle.Mythic:
          fragment = <MythicLabelText text={str} />;
          break;
        case TerminalTextStyle.Green:
          fragment = <Green>{innerFragment}</Green>;
          break;
        case TerminalTextStyle.Blue:
          fragment = <Blue>{innerFragment}</Blue>;
          break;
        case TerminalTextStyle.Sub:
          fragment = <Sub>{innerFragment}</Sub>;
          break;
        case TerminalTextStyle.Subber:
          fragment = <Subber>{innerFragment}</Subber>;
          break;
        case TerminalTextStyle.Text:
          fragment = <Text>{innerFragment}</Text>;
          break;
        case TerminalTextStyle.White:
          fragment = <White>{innerFragment}</White>;
          break;
        case TerminalTextStyle.Red:
          fragment = <Red>{innerFragment}</Red>;
          break;

        case TerminalTextStyle.Pink:
          fragment = <Pink>{innerFragment}</Pink>;
          break;
        case TerminalTextStyle.Invisible:
          fragment = <Invisible>{innerFragment}</Invisible>;
          break;
        case TerminalTextStyle.Underline:
          fragment = (
            <Sub>
              <u>{innerFragment}</u>
            </Sub>
          );
          break;
        default:
          fragment = <Sub>{innerFragment}</Sub>;
      }

      append(fragment);
    },
    [append],
  );

  const onKeyUp = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.code === "KeyL" && e.ctrlKey) {
      e.preventDefault();
      setFragments([]);
    } else if (e.keyCode === ENTER_KEY_CODE && !e.shiftKey) {
      e.preventDefault();
      print(promptCharacter + " ", TerminalTextStyle.Green);
      print(inputText, TerminalTextStyle.Text);
      newline();
      onInputEmitter.emit(ON_INPUT, inputText);
      setPreviousInput(inputText);
      setInputHeight(1);
      setInputText("");
    } else if (
      e.keyCode === UP_ARROW_KEY_CODE &&
      inputText === "" &&
      previousInput !== ""
    ) {
      setInputHeight(1);
      setInputText(previousInput);
    }
  };

  const preventEnterDefault = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    e.stopPropagation();
    if (e.keyCode === ENTER_KEY_CODE && !e.shiftKey) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (userInputEnabled) {
      inputRef.current.focus();
    }
  }, [userInputEnabled]);

  const scrollToEnd = () => {
    containerRef.current.scrollTo(0, containerRef.current.scrollHeight);
  };

  useEffect(() => {
    scrollToEnd();
  }, [fragments]);

  useEffect(() => {
    setInputHeight(heightMeasureRef.current.scrollHeight);
  }, [inputText]);

  useImperativeHandle(
    ref,
    () => ({
      printElement: (element: React.ReactElement) => {
        append(element);
      },
      printLoadingBar: (
        prettyEntityName: string,
        ref: React.RefObject<LoadingBarHandle>,
      ) => {
        append(
          <TextLoadingBar prettyEntityName={prettyEntityName} ref={ref} />,
        );
      },
      print: (str: string, style?: TerminalTextStyle) => {
        print(str, style, undefined);
      },
      println: (str: string, style?: TerminalTextStyle) => {
        print(str, style, undefined);
        newline();
      },
      printLink: (
        str: string,
        onClick: () => void,
        style: TerminalTextStyle,
      ) => {
        print(str, style, onClick);
      },
      getInput: async () => {
        setUserInputEnabled(true);
        const text = await new Promise<string>((resolve) => {
          onInputEmitter.once(ON_INPUT, (text: string) => resolve(text.trim()));
        });
        setUserInputEnabled(false);
        return text;
      },
      printShellLn: (text: string) => {
        print(promptCharacter + " ", TerminalTextStyle.Green);
        print(text, TerminalTextStyle.Text);
        newline();
      },
      printLoadingSpinner: () => {
        append(<LoadingSpinner />);
        newline();
      },
      setInput: (input: string) => {
        if (inputRef.current) {
          setInputText(input);
        }
      },
      focus: () => {
        inputRef.current?.focus();
      },
      newline,
      removeLast,
      setUserInputEnabled,
      clear: () => {
        setFragments([]);
      },
    }),
    [
      onInputEmitter,
      promptCharacter,
      newline,
      print,
      append,
      removeLast,
      setFragments,
    ],
  );

  const containerStyle = visible
    ? undefined
    : ({ display: "none" } as React.CSSProperties);

  const inputRefStyles = !useCaretElement
    ? undefined
    : ({ caretColor: "transparent" } as React.CSSProperties);

  return (
    <TerminalContainer ref={containerRef} style={containerStyle}>
      {fragments}
      <Prompt
        userInputEnabled={userInputEnabled}
        onClick={() => {
          if (userInputEnabled) {
            inputRef.current.focus();
          }
        }}
      >
        <Green>{promptCharacter + " "}</Green>
        <TextAreas>
          <InputTextArea
            height={inputHeight}
            ref={inputRef}
            onKeyUp={onKeyUp}
            onKeyDown={preventEnterDefault}
            onKeyPress={isFirefox() ? () => { } : preventEnterDefault}
            value={inputText}
            onChange={(e) => {
              if (userInputEnabled) {
                setInputText(e.target.value);
              }
            }}
            style={inputRefStyles}
          />
          {/* "ghost" textarea used to measure the scrollHeight of the input */}
          <InputTextArea
            height={0}
            ref={heightMeasureRef}
            onChange={() => { }}
            value={inputText}
          />

          {/* "ghost" input to fake caret block element such as in real terminals */}
          {useCaretElement ? (
            <CaretElement>
              <GhostInput>{inputText}</GhostInput>
              <CaretBlock data-caret-block>&nbsp;</CaretBlock>
            </CaretElement>
          ) : undefined}
        </TextAreas>
      </Prompt>
    </TerminalContainer>
  );
}

const Prompt = styled.span`
  ${({ userInputEnabled }: { userInputEnabled: boolean }) => css`
    display: flex;
    justify-content: flex-start;
    flex-direction: row;
    opacity: ${userInputEnabled ? 1 : 0};
  `}
`;

const TextAreas = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
  :focus-within span[data-caret-block] {
    background-color: rgb(211, 211, 211);
  }
`;

const InputTextArea = styled.textarea`
  ${({ height }: { height: number }) => css`
    background: none;
    outline: none;
    border: none;
    color: ${dfstyles.colors.text};
    height: ${height}px;
    resize: none;
    flex-grow: ${height === 0 ? 0 : 1};
  `}
`;

const TerminalContainer = styled.div`
  height: 100%;
  width: 100%;
  margin: 0 auto;
  overflow: scroll;
  white-space: pre-wrap;
  overflow-wrap: break-word;

  & span {
    word-break: break-all;
  }

  @media (max-width: ${dfstyles.screenSizeS}) {
    font-size: ${dfstyles.fontSizeXS};
  }
`;

const CaretElement = styled.div`
  position: absolute;
  top: 1px;
  left: 0;
`;

const GhostInput = styled.span`
  display: inline-block;
  color: transparent;
`;

const CaretBlock = styled.span`
  display: inline-block;
  border: 1px solid rgb(211, 211, 211);
  width: 8px;
  height: 18px;
`;
