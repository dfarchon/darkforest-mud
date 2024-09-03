import { hello } from "utils";

export const HelloPage = () => {
  return (
    <>
      <div> {hello(" Landing Page!")}</div>
      <h1 className="text-4xl font-bold underline">Hello taiwind!</h1>
    </>
  );
};
