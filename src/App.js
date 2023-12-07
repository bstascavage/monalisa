import "./App.css";
import TextInput from "./TextInput";
import CheckBox from "./Checkbox";
import Dropdown from "./Dropdown";
import React, { useReducer, useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Button,
  Col,
  Row,
  Container,
} from "reactstrap";

import { Client, ITEMS_HANDLING_FLAGS } from "archipelago.js";

const initialClient = new Client();

function pageStateReducer(state, action) {
  switch (action.type) {
    case "server_list": // Graphql queries for enum values has succeeded
      return {
        state: "server_list",
        hide_page: false,
        show_servers: localStorage.getItem("servers") === null ? false : true,
        show_add_server: true,
        servers: action.servers,
      };
    case "connecting":
      return {
        state: "connecting",
        hide_page: true,
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

function renderServerCards(pageState, setPageState) {
  const connectServer = (event) => {
    const connectionInfo = {
      hostname: event.server,
      port: Number(event.port),
      game: event.gameName,
      name: event.playerName,
      items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
    };

    try {
      setPageState({ type: "connecting" });
      initialClient.connect(connectionInfo).then(() => {
        console.log("Connected to the server");
        const localConfig = JSON.parse(localStorage.getItem("servers"));

        if ("players" in localConfig[event.nickname]) {
          setPageState({
            type: "create_clients",
            servers: pageState.servers,
            server: event.nickname,
          });
        } else {
          setPageState({
            type: "pick_players",
            players: initialClient.players.all,
            server: event.nickname,
          });
        }
      });
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  let cardList = [];
  for (const [key, value] of Object.entries(pageState.servers)) {
    cardList.push(
      <Card
        // style={{ width: "100%" }}
        // style={{ height: 60 }}
        id={key}
        key={key}
      >
        <CardBody>
          <Row>
            <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
              {key}
            </CardTitle>
            <span className="h2 font-weight-bold mb-0">
              Server: {value.server}
              <br></br>
              Port: {value.port}
            </span>
            <br></br>
            <Button color="primary" onClick={() => connectServer(value)}>
              Connect
            </Button>
          </Row>
        </CardBody>
      </Card>,
    );
  }

  return <Col>{cardList}</Col>;
}

function createClients(pageState, setPageState) {
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
      game: player.game,
      name: player.name,
      items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
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
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  }
}

function dynamicFilter(pageState, playerFilter, setPlayerFilter) {
  // Creates a filter for each game, which is not static
  let playerList = [{ name: "All", checked: true }];

  for (
    let game_index = 0;
    game_index < pageState.clients.length;
    game_index++
  ) {
    playerList.push({
      name: pageState.clients[game_index].player,
      checked: false,
    });
  }

  setPlayerFilter({ playerList: playerList });
}

function retrieveHints(pageState, hintData, setHintData) {
  let hintList = [];

  for (
    let game_index = 0;
    game_index < pageState.clients.length;
    game_index++
  ) {
    const client = pageState.clients[game_index].client;
    const hints = client.hints.mine;

    for (let hint_index = 0; hint_index < hints.length; hint_index++) {
      const hint = hints[hint_index];
      const gameName = client.players.game(hint.receiving_player);
      const findingPlayerName = client.players.game(hint.finding_player);

      hint.playerName = client.players.name(hint.receiving_player);
      hint.findingPlayerName = client.players.name(hint.finding_player);
      hint.itemName = client.items.name(gameName, hint.item);
      hint.locationName = client.locations.name(
        findingPlayerName,
        hint.location,
      );
      hint.isFound = hint.found.toString();

      // Do not add if it already exists
      let isDuplicate = false;
      for (let i = 0; i < hintList.length; i++) {
        if (
          hintList[i].location === hint.location &&
          hintList[i].item === hint.item &&
          hintList[i].receiving_player === hint.receiving_player &&
          hintList[i].finding_player === hint.finding_player
        ) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        hintList.push(hint);
      }
    }
  }

  setHintData(hintList);
}

function renderHints(pageState, hintData, filterData) {
  let renderList = [];
  let hintFilterSelection = "";
  let foundFilterSelection = "";

  for (let i = 0; i < filterData.hintFilter.length; i++) {
    if (filterData.hintFilter[i].checked === true) {
      hintFilterSelection = filterData.hintFilter[i].name;
    }
  }

  for (let i = 0; i < filterData.foundFilter.length; i++) {
    if (filterData.foundFilter[i].checked === true) {
      foundFilterSelection = filterData.foundFilter[i].name;
    }
  }

  // Sort list by player name
  const hints = hintData.sort(function (a, b) {
    let x = a.playerName.toLowerCase();
    let y = b.playerName.toLowerCase();
    if (x > y) {
      return 1;
    }
    if (x < y) {
      return -1;
    }
    return 0;
  });

  for (let i = 0; i < hints.length; i++) {
    const hint = hints[i];

    let render = [];
    render.push(
      <tr key={hint.finding_player.toString() + hint.location.toString()}>
        <td>{hint.playerName}</td>
        <td>{hint.findingPlayerName}</td>
        <td>{hint.itemName}</td>
        <td>{hint.locationName}</td>
        <td>{hint.isFound}</td>
      </tr>,
    );
    if (hintFilterSelection === "My Hints") {
      for (let j = 0; j < pageState.clients.length; j++) {
        if (hint.playerName === pageState.clients[j].player) {
          if (
            foundFilterSelection === "All" ||
            (foundFilterSelection === "Found" && hint.isFound === "true") ||
            (foundFilterSelection === "Not Found" && hint.isFound === "false")
          ) {
            renderList.push(render);
          }
        }
      }
    } else if (hintFilterSelection === "Assigned Hints") {
      for (let j = 0; j < pageState.clients.length; j++) {
        if (hint.findingPlayerName === pageState.clients[j].player) {
          if (
            foundFilterSelection === "All" ||
            (foundFilterSelection === "Found" && hint.isFound === "true") ||
            (foundFilterSelection === "Not Found" && hint.isFound === "false")
          ) {
            renderList.push(render);
          }
        }
      }
    } else {
      if (
        foundFilterSelection === "All" ||
        (foundFilterSelection === "Found" && hint.isFound === "true") ||
        (foundFilterSelection === "Not Found" && hint.isFound === "false")
      ) {
        renderList.push(render);
      }
    }
  }

  return (
    <Container fluid>
      <thead>
        <tr>
          <th>Receiving Player</th>
          <th>Finding Player</th>
          <th>Item</th>
          <th>Location</th>
          <th>Found</th>
          <th style={{ borderStyle: "hidden", width: "85px" }}></th>
        </tr>
      </thead>
      <tbody>{renderList}</tbody>
    </Container>
  );
}

function App() {
  const [pageState, setPageState] = useReducer(pageStateReducer, {
    state: "server_list",
    hide_page: false,
    show_servers: localStorage.getItem("servers") === null ? false : true,
    show_add_server: true,
    servers: JSON.parse(localStorage.getItem("servers")),
    clients: [],
    hintFilter: [],
  });

  let submitFieldDataDefault = {
    server: "archipelago.gg",
    port: "",
    playerName: "",
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

  useEffect(() => {
    if (pageState.state === "retrieve_hints") {
      retrieveHints(pageState, hintData, setHintData);
      dynamicFilter(pageState, playerFilter, setPlayerFilter);
    }
  }, [pageState.state]);

  const handleSubmit = (event) => {
    // TODO: Add data validation
    // TODO: Check if server exists
    let servers = JSON.parse(localStorage.getItem("servers"));
    servers = servers === null ? {} : servers;
    servers[submitFieldData.nickname] = submitFieldData;
    localStorage.setItem("servers", JSON.stringify(servers));
    setPageState({ type: "server_list", servers: servers });
  };

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

  console.log(pageState);
  if (pageState.hide_page) {
    page = <div></div>;
  } else {
    if (pageState.state === "server_list") {
      let add_servers;
      let servers;
      if (pageState.show_add_server) {
        add_servers = (
          <Container fluid>
            <form onSubmit={handleSubmit}>
              <div className="App">
                <Row className="stats-row">
                  <Col lg="6" xl="3" className="col-padding">
                    Server
                  </Col>
                  <Col lg="6" xl="3" className="col-padding">
                    <TextInput
                      id="server"
                      placeholder="archipelago.gg"
                      value={submitFieldData}
                      valueSetter={setSubmitFieldData}
                    />
                  </Col>
                  <Col lg="6" xl="3" className="col-padding">
                    Port
                  </Col>
                  <Col lg="6" xl="3" className="col-padding">
                    <TextInput
                      id="port"
                      placeholder=""
                      value={submitFieldData}
                      valueSetter={setSubmitFieldData}
                    />
                  </Col>
                  <Col lg="6" xl="3" className="col-padding">
                    Game Name
                  </Col>
                  <Col lg="6" xl="3" className="col-padding">
                    <TextInput
                      id="gameName"
                      placeholder=""
                      value={submitFieldData}
                      valueSetter={setSubmitFieldData}
                    />
                  </Col>
                  <Col lg="6" xl="3" className="col-padding">
                    Player
                  </Col>
                  <Col lg="6" xl="3" className="col-padding">
                    <TextInput
                      id="playerName"
                      placeholder=""
                      value={submitFieldData}
                      valueSetter={setSubmitFieldData}
                    />
                  </Col>
                  <Col lg="6" xl="3" className="col-padding">
                    Server Nickname
                  </Col>
                  <Col lg="6" xl="3" className="col-padding">
                    <TextInput
                      id="nickname"
                      placeholder=""
                      value={submitFieldData}
                      valueSetter={setSubmitFieldData}
                    />
                  </Col>
                </Row>
              </div>
              <div className="submit-container" id="submit-container">
                <Button color="primary" type="submit">
                  Submit
                </Button>
              </div>
            </form>
          </Container>
        );
      } else {
        add_servers = <div></div>;
      }
      if (pageState.show_servers) {
        servers = (
          <Container fluid>
            <React.Fragment>
              {renderServerCards(pageState, setPageState)}
            </React.Fragment>
          </Container>
        );
      } else {
        servers = <div></div>;
      }

      page = (
        <React.Fragment>
          {add_servers}
          {servers}
        </React.Fragment>
      );
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
      createClients(pageState, setPageState);
      page = <Container fluid></Container>;
    } else if (pageState.state === "retrieve_hints") {
      initialClient.disconnect();
      let hints = (
        <Container fluid>
          <React.Fragment>
            {/* {retrieveHints(pageState, hintData)} */}
            {renderHints(pageState, hintData, filterData)}
          </React.Fragment>
        </Container>
      );

      page = (
        <React.Fragment>
          <Col lg="6" xl="3" className="col-padding">
            <Dropdown
              title="Hints Filter"
              id="hintFilter"
              value={filterData}
              valueSetter={setFilterData}
            />
            <Dropdown
              title="Found Filter"
              id="foundFilter"
              value={filterData}
              valueSetter={setFilterData}
            />
            <Dropdown
              title="Player Filter"
              id="playerList"
              value={playerFilter}
              valueSetter={setPlayerFilter}
            />
          </Col>

          <Col lg="6" xl="3" className="col-padding">
            {hints}
          </Col>
        </React.Fragment>
      );
    } else {
      page = <div></div>;
    }
  }

  return page;
}

export default App;
