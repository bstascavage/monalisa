import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Banner from "./Banner";
import CheckBox from "./Checkbox";
import Dropdown from "./Dropdown";
import Servers from "./Servers";
import ServerButton from "./ServerButton";
import Hints, { HintData } from "./Hints";

import { ReactComponent as logo } from "./assets/logo.svg";
import mainLogo from "./assets/mona-lisa-logo-big.png";

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
      name: player.player,
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
        console.log(`Connected to the server for player: ${player.player}`);
        clients.push({ client: client, player: player.player });

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
      { name: "All", checked: false },
      { name: "Found", checked: false },
      { name: "Not Found", checked: true },
    ],
    entranceFilter: [
      { name: "Yes", checked: false },
      { name: "No", checked: true },
    ],
  });

  // TODO: Can this be combined with `filterData`
  const [receivingPlayerFilter, setReceivingPlayerFilter] = useState({
    playerList: [
      {
        name: "All",
        checked: true,
      },
    ],
  });
  const [findingPlayerFilter, setFindingPlayerFilter] = useState({
    playerList: [
      {
        name: "All",
        checked: true,
      },
    ],
  });

  const [hintData, setHintData] = useState([]);
  const hints = useMemo(
    () =>
      new HintData(
        pageState,
        filterData,
        setHintData,
        setReceivingPlayerFilter,
        setFindingPlayerFilter,
      ),
    [pageState, filterData],
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

    // servers[pageState.selected_server].players = selectedPlayers;
    servers[pageState.selected_server].players = pageState.players;
    localStorage.setItem("servers", JSON.stringify(servers));
    setPageState({
      type: "create_clients",
      servers: servers,
      server: pageState.selected_server,
    });
  };

  let page;
  let banner;

  banner = <Banner logo={logo} />;

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
          {banner}
          <div className="logo-title">
            <img src={mainLogo} className="logo" alt="Mona Lisa Hint System" />
            <div className="title-subtile">
              An Archipelago Hint Tool - All your hints in one view
            </div>
          </div>
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
        <React.Fragment>
          {banner}
          <Container className="player-select">
            <div className="player-select-header">Select your games</div>
            <CheckBox
              id="players"
              value={pageState}
              valueSetter={setPageState}
            />
            <div className="player-select-button">
              <Button color="primary" onClick={() => selectPlayers()}>
                Submit
              </Button>
            </div>
          </Container>
        </React.Fragment>
      );
    } else if (pageState.state === "create_clients") {
      createClients(pageState, setPageState, hints);
      page = <Container fluid></Container>;
    } else if (pageState.state === "retrieve_hints") {
      initialClient.disconnect();
      let hints = (
        <React.Fragment>
          <div className="server-list-page-container">
            <Hints
              id="hints"
              state={pageState}
              hintData={hintData}
              filterData={filterData}
              receivingPlayerFilter={receivingPlayerFilter}
              findingPlayerFilter={findingPlayerFilter}
            />
          </div>
        </React.Fragment>
      );

      page = (
        <React.Fragment>
          {banner}
          <Container fluid>
            <div className="dropdown-row">
              <Dropdown
                title="Hints"
                id="hintFilter"
                value={filterData}
                valueSetter={setFilterData}
              />
              <Dropdown
                title="Receiving Player"
                id="playerList"
                value={receivingPlayerFilter}
                valueSetter={setReceivingPlayerFilter}
              />
              <Dropdown
                title="Finding Player"
                id="playerList"
                value={findingPlayerFilter}
                valueSetter={setFindingPlayerFilter}
              />
              <Dropdown
                title="Status"
                id="foundFilter"
                value={filterData}
                valueSetter={setFilterData}
              />
              <Dropdown
                title="Show Entrances"
                id="entranceFilter"
                value={filterData}
                valueSetter={setFilterData}
                paddingBottom={true}
              />
            </div>
            {hints}
          </Container>
        </React.Fragment>
      );
    } else {
      page = <div></div>;
    }
  }

  return page;
}

export default App;
