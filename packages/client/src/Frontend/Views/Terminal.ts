import { TerminalTextStyle } from "../Utils/TerminalTypes";
import { LoadingBarHandle, TextLoadingBar } from "../Components/TextLoadingBar";

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
