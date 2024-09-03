import { useParams, useLocation } from "react-router-dom";

export function GameLandingPage() {
  const { contract } = useParams();
  const location = useLocation();
  // Get the string after the question mark (including the question mark)
  const searchParams = location.search;

  // If you need to parse the parameters
  const params = new URLSearchParams(searchParams);
  const queryParam = params.toString(); // Get the complete query string

  return (
    <div>
      <p>Contract: {contract}</p>
      <p>Location: {location.pathname}</p>
      <p>Search: {queryParam}</p>
    </div>
  );
}
