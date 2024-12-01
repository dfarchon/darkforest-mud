import {
  html,
  render,
  useEffect,
  useState,
} from "https://esm.sh/htm/preact/standalone";

async function createGuild(name) {
  if (!name) throw new Error("Please provide a guild name");

  const tx = await df.submitTransaction({
    delegator: df.getPlayer(df.getAccount()).address,
    args: Promise.resolve([name]),
    contract: df.getContract(),
    methodName: "df__createGuild",
  });
  await tx.confirmedPromise;
  return `Guild '${name}' created successfully!`;
}

async function inviteToGuild(invitee) {
  if (!invitee) throw new Error("Please select a player to invite");

  const tx = await df.submitTransaction({
    delegator: df.getPlayer(df.getAccount()).address,
    args: Promise.resolve([invitee]),
    contract: df.getContract(),
    methodName: "df__inviteToGuild",
  });
  await tx.confirmedPromise;
  return `Player '${invitee}' invited to the guild successfully!`;
}

async function approveApplication(player_) {
  if (!player_) throw new Error("Please select a player to approve");

  const tx = await df.submitTransaction({
    delegator: df.getPlayer(df.getAccount()).address,
    args: Promise.resolve([player_]),
    contract: df.getContract(),
    methodName: "df__approveApplication",
  });
  await tx.confirmedPromise;
  return `Player '${player_}' approved successfully!`;
}

async function applyToGuild(guildId) {
  if (!guildId) throw new Error("Please enter a valid guild ID");

  const tx = await df.submitTransaction({
    delegator: df.getPlayer(df.getAccount()).address,
    args: Promise.resolve([guildId]),
    contract: df.getContract(),
    methodName: "df__applyToGuild",
  });
  await tx.confirmedPromise;
  return `Applied to guild #${guildId} successfully!`;
}

async function acceptInvitation(guildId) {
  if (!guildId) throw new Error("Please enter a valid guild ID");

  const tx = await df.submitTransaction({
    delegator: df.getPlayer(df.getAccount()).address,
    args: Promise.resolve([guildId]),
    contract: df.getContract(),
    methodName: "df__acceptInvitation",
  });
  await tx.confirmedPromise;
  return `Accepted invitation to guild #${guildId} successfully!`;
}

async function transferOwnership(newOwner) {
  if (!newOwner)
    throw new Error("Please select a valid player to transfer ownership to");

  const tx = await df.submitTransaction({
    delegator: df.getPlayer(df.getAccount()).address,
    args: Promise.resolve([newOwner]),
    contract: df.getContract(),
    methodName: "df__transferOwnership",
  });
  await tx.confirmedPromise;
  return `Ownership transferred to ${newOwner} successfully!`;
}

async function leaveGuild() {
  const tx = await df.submitTransaction({
    delegator: df.getPlayer(df.getAccount()).address,
    args: Promise.resolve([]),
    contract: df.getContract(),
    methodName: "df__leaveGuild",
  });
  await tx.confirmedPromise;
  return "You have left the guild successfully!";
}

async function disbandGuild() {
  const tx = await df.submitTransaction({
    delegator: df.getPlayer(df.getAccount()).address,
    args: Promise.resolve([]),
    contract: df.getContract(),
    methodName: "df__disbandGuild",
  });
  await tx.confirmedPromise;
  return "Guild disbanded successfully!";
}

function GuildControls() {
  const [state, setState] = useState({
    guildName: "",
    invitee: "",
    guildId: "",
    playerToApprove: "",
  });
  const [players, setPlayers] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const refreshPlayers = () => setPlayers(df.getAllPlayers());
    const sub = df.playersUpdated$.subscribe(refreshPlayers);
    refreshPlayers();
    return () => sub.unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const executeAction = async (action) => {
    setIsLoading(true);
    try {
      const message = await action();
      setStatusMessage(message);
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const playerOptions = players.map(
    (player) =>
      html`<option value=${player.address}>
        ${player.twitter || player.address}
      </option>`,
  );

  return html`
    <div style=${{ padding: "16px", background: "#1e1e1e", color: "#fff" }}>
      <h2>Guild Management</h2>
      ${statusMessage && html`<div>${statusMessage}</div>`}

      <!-- Create Guild -->
      <div>
        <input
          name="guildName"
          placeholder="Guild Name"
          value=${state.guildName}
          onInput=${handleInputChange}
        />
        <button
          disabled=${isLoading}
          onClick=${() => executeAction(() => createGuild(state.guildName))}
        >
          ${isLoading ? "Creating..." : "Create Guild"}
        </button>
      </div>

      <!-- Invite to Guild -->
      <div>
        <select
          name="invitee"
          value=${state.invitee}
          onChange=${handleInputChange}
        >
          <option value="">Select a player</option>
          ${playerOptions}
        </select>
        <button
          disabled=${isLoading}
          onClick=${() => executeAction(() => inviteToGuild(state.invitee))}
        >
          ${isLoading ? "Inviting..." : "Invite to Guild"}
        </button>
      </div>

      <!-- Apply to Guild -->
      <div>
        <input
          name="guildId"
          placeholder="Guild ID"
          value=${state.guildId}
          onInput=${handleInputChange}
        />
        <button
          disabled=${isLoading}
          onClick=${() => executeAction(() => applyToGuild(state.guildId))}
        >
          ${isLoading ? "Applying..." : "Apply to Guild"}
        </button>
        <button
          disabled=${isLoading}
          onClick=${() => executeAction(() => acceptInvitation(state.guildId))}
        >
          ${isLoading ? "Accepting..." : "Accept Invitation"}
        </button>
      </div>

      <!-- Approve Player -->
      <div>
        <select
          name="playerToApprove"
          value=${state.playerToApprove}
          onChange=${handleInputChange}
        >
          <option value="">Select a player</option>
          ${playerOptions}
        </select>
        <button
          disabled=${isLoading}
          onClick=${() =>
            executeAction(() => approveApplication(state.playerToApprove))}
        >
          ${isLoading ? "Approving..." : "Approve Player"}
        </button>
      </div>

      <!-- Transfer Ownership -->
      <div>
        <select
          name="newOwner"
          value=${state.newOwner}
          onChange=${handleInputChange}
        >
          <option value="">Select a player</option>
          ${playerOptions}
        </select>
        <button
          disabled=${isLoading}
          onClick=${() =>
            executeAction(() => transferOwnership(state.newOwner))}
        >
          ${isLoading ? "Transferring..." : "Transfer Ownership"}
        </button>
      </div>

      <!-- Leave Guild -->
      <div>
        <button
          disabled=${isLoading}
          onClick=${() => executeAction(leaveGuild)}
        >
          ${isLoading ? "Leaving..." : "Leave Guild"}
        </button>
      </div>

      <!-- Disband Guild -->
      <div>
        <button
          disabled=${isLoading}
          onClick=${() => executeAction(disbandGuild)}
        >
          ${isLoading ? "Disbanding..." : "Disband Guild"}
        </button>
      </div>
    </div>
  `;
}

class Plugin {
  async render(container) {
    render(html`<${GuildControls} />`, container);
  }
}

export default Plugin;
