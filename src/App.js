import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import CheckBox from "./Checkbox";
import Dropdown from "./Dropdown";
import Servers from "./Servers";
import ServerButton from "./ServerButton";
import Hints, { HintData } from "./Hints";

import React, { useMemo, useReducer, useState, useEffect } from "react";
import { Button, Container } from "reactstrap";

import {
  Client,
  ITEMS_HANDLING_FLAGS,
  SERVER_PACKET_TYPE,
} from "archipelago.js";

const initialClient = new Client();

function pageStateReducer(state, action) {
  switch (action.type) {
    case "server_list": // Graphql queries for enum values has succeeded
      return {
        state: "server_list",
        hide_page: false,
        show_servers:
          localStorage.getItem("servers") === null ||
          JSON.stringify(localStorage.getItem("servers")) === '"{}"'
            ? false
            : true,
        servers: action.servers,
        show_add_server: false,
      };
    case "add_server":
      return {
        state: "add_server",
        hide_page: false,
        show_servers:
          localStorage.getItem("servers") === null ||
          JSON.stringify(localStorage.getItem("servers")) === '"{}"'
            ? false
            : true,
        servers: action.servers,
        show_add_server: true,
      };
    case "connecting":
      return {
        state: "connecting",
        hide_page: true,
      };
    case "error":
      return {
        state: "error",
        msg: action.msg,
      };
    case "pick_players":
      return {
        state: "pick_players",
        hide_page: false,
        servers: JSON.parse(localStorage.getItem("servers")),
        selected_server: action.server,
        players: action.players,
      };
    case "create_clients":
      return {
        state: "create_clients",
        hide_page: false,
        servers: JSON.parse(localStorage.getItem("servers")),
        selected_server: action.server,
        clients: [],
      };
    case "retrieve_hints": {
      return {
        state: "retrieve_hints",
        hide_page: false,
        servers: JSON.parse(localStorage.getItem("servers")),
        selected_server: action.server,
        clients: action.clients,
      };
    }
    default:
      return state;
  }
}

function createClients(pageState, setPageState, hints) {
  const server = pageState.servers[pageState.selected_server];
  const players = server.players;
  let clients = pageState.clients;

  // Loop through each player/game and create a client
  for (let i = 0; i < players.length; i++) {
    const client = new Client();
    const player = players[i];
    const connectionInfo = {
      hostname: server.server,
      port: Number(server.port),
      protocol: "wss",
      game: player.game,
      name: player.name,
      items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
      version: {
        build: 0,
        major: 4,
        minor: 4,
      },
    };

    // Archipelago will return empty results if you query right after a client is connected
    // Therefore we need to wait ~5s before continuing
    const waitForArchipelago = () => {
      setTimeout(() => {
        setPageState({ type: "retrieve_hints", clients: clients });
      }, 500);
    };

    try {
      client.connect(connectionInfo).then(() => {
        console.log(`Connected to the server for player: ${player.name}`);
        clients.push({ client: client, player: player.name });

        if (
          pageState.servers[pageState.selected_server].players.length ===
          pageState.clients.length
        ) {
          waitForArchipelago();
        }
      });
      client.addListener(SERVER_PACKET_TYPE.PRINT_JSON, (packet, message) => {
        if (packet.type === "Hint" || packet.type === "ItemSend") {
          hints.retrieveHints(packet);
        }
      });
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  }
}

function App() {
  const [pageState, setPageState] = useReducer(pageStateReducer, {
    state: "server_list",
    hide_page: false,
    show_servers:
      localStorage.getItem("servers") === null ||
      JSON.stringify(localStorage.getItem("servers")) === '"{}"'
        ? false
        : true,
    show_add_server: false,
    servers: JSON.parse(localStorage.getItem("servers")),
    clients: [],
    hintFilter: [],
  });

  let submitFieldDataDefault = {
    server: "archipelago.gg",
    port: "",
    playerName: "",
    gameName: "",
    nickname: "",
  };
  const [submitFieldData, setSubmitFieldData] = useState(
    submitFieldDataDefault,
  );

  const [filterData, setFilterData] = useState({
    hintFilter: [
      { name: "All", checked: true },
      { name: "My Hints", checked: false },
      { name: "Assigned Hints", checked: false },
    ],
    foundFilter: [
      { name: "All", checked: true },
      { name: "Found", checked: false },
      { name: "Not Found", checked: false },
    ],
  });

  // TODO: Can this be combined with `filterData`
  const [playerFilter, setPlayerFilter] = useState({
    playerList: [
      {
        name: "All",
        checked: true,
      },
    ],
  });

  const [hintData, setHintData] = useState([]);
  const hints = useMemo(
    () => new HintData(pageState, setHintData, setPlayerFilter),
    [pageState],
  );

  useEffect(() => {
    if (pageState.state === "retrieve_hints") {
      hints.retrieveHints();
      hints.dynamicFilter();
    }
  }, [pageState, hints]);

  const selectPlayers = (event) => {
    let servers = JSON.parse(localStorage.getItem("servers"));
    let selectedPlayers = [];

    for (let i = 0; i < pageState.players.length; i++) {
      let player = pageState.players[i];
      if (player.checked === true) {
        selectedPlayers.push(player);
      }
    }

    servers[pageState.selected_server].players = selectedPlayers;
    localStorage.setItem("servers", JSON.stringify(servers));
    setPageState({
      type: "create_clients",
      servers: servers,
      server: pageState.selected_server,
    });
  };

  let page;

  if (pageState.hide_page) {
    page = <div></div>;
  } else {
    if (pageState.state === "server_list" || pageState.state === "add_server") {
      let add_servers;
      let servers;

      add_servers = (
        <ServerButton
          id="serverButtom"
          state={pageState}
          stateSetter={setPageState}
          submitFieldData={submitFieldData}
          submitFieldSetter={setSubmitFieldData}
          submitFieldDataDefault={submitFieldDataDefault}
        />
      );
      if (pageState.show_servers) {
        servers = (
          <Servers
            id="serverList"
            initialClient={initialClient}
            state={pageState}
            stateSetter={setPageState}
          />
        );
      } else {
        servers = <div></div>;
      }

      page = (
        <React.Fragment>
          {servers}
          {add_servers}
        </React.Fragment>
      );
    } else if (pageState.state === "error") {
      page = (
        <div>
          There is an issue connecting to the server. Please check your
          connection info and try again
        </div>
      );
      page = <React.Fragment>{pageState.msg}</React.Fragment>;
    } else if (pageState.state === "pick_players") {
      page = (
        <Container fluid>
          <CheckBox id="players" value={pageState} valueSetter={setPageState} />
          <Button color="primary" onClick={() => selectPlayers()}>
            Submit
          </Button>
        </Container>
      );
    } else if (pageState.state === "create_clients") {
      createClients(pageState, setPageState, hints);
      page = <Container fluid></Container>;
    } else if (pageState.state === "retrieve_hints") {
      initialClient.disconnect();
      let hints = (
        <React.Fragment>
          <Hints
            id="hints"
            state={pageState}
            hintData={hintData}
            filterData={filterData}
            playerFilter={playerFilter}
          />
        </React.Fragment>
      );

      page = (
        <Container fluid>
          <React.Fragment>
            <div className="dropdown-row">
              <Dropdown
                title="Hints Filter"
                id="hintFilter"
                value={filterData}
                valueSetter={setFilterData}
              />
              <Dropdown
                title="Game Filter"
                id="playerList"
                value={playerFilter}
                valueSetter={setPlayerFilter}
              />
              <Dropdown
                title="Found Filter"
                id="foundFilter"
                value={filterData}
                valueSetter={setFilterData}
              />
            </div>
            {hints}
          </React.Fragment>
        </Container>
      );
    } else {
      page = <div></div>;
    }
  }

  return page;
}

export default App;
