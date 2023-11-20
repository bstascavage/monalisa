import "./App.css";
import TextInput from "./TextInput";
import CheckBox from "./Checkbox";
import React, { useReducer, useState } from "react";
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
        hide_page: false,
        connected: false,
        show_servers: true,
        show_add_server: true,
        servers: action.servers,
      };
    case "connecting":
      return {
        hide_page: true,
      };
    case "pick_players":
      return {
        hide_page: false,
        connected: true,
        show_servers: false,
        show_add_server: false,
        show_players: true,
        servers: JSON.parse(localStorage.getItem("servers")),
        players: action.players,
        selected_server: action.server,
      };
    case "retrieve_hints":
      return {
        hide_page: false,
        connected: true,
        show_servers: false,
        show_add_server: false,
        show_players: false,
        retrieve_hints: true,
        show_hints: false,
        servers: JSON.parse(localStorage.getItem("servers")),
        selected_server: action.server,
        clients: [],
      };
    case "show_hints":
      return {
        hide_page: false,
        connected: true,
        show_servers: false,
        show_add_server: false,
        show_players: false,
        retrieve_hints: false,
        show_hints: true,
        servers: JSON.parse(localStorage.getItem("servers")),
        selected_server: action.server,
        clients: action.clients,
      };
    case "done": {
      return {
        hide_page: false,
        connected: true,
        show_servers: false,
        show_add_server: false,
        show_players: false,
        retrieve_hints: false,
        show_hints: false,
        done: true,
        servers: JSON.parse(localStorage.getItem("servers")),
        selected_server: action.server,
        clients: action.clients,
        hints: action.hints,
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
        // const players = client.players.all;
        const foo = JSON.parse(localStorage.getItem("servers"));
        if ("players" in foo[event.nickname]) {
          setPageState({
            type: "retrieve_hints",
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

        // You are now connected and authenticated to the server. You can add more code here if need be.
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

function getAllHints(pageState, setPageState) {
  console.log(pageState);
  const server = pageState.servers[pageState.selected_server];
  const players = server.players;
  let parsedHints = [];

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

    try {
      client.connect(connectionInfo).then(() => {
        console.log(`Connected to the server for player: ${player.name}`);
        let clients = pageState.clients;
        clients.push(client);
        setPageState({ type: "show_hints", clients: clients });

        if (
          pageState.servers[pageState.selected_server].players.length ===
          pageState.clients.length
        ) {
          console.log("HELLO THERE");

          for (let i = 0; i < pageState.clients.length; i++) {
            console.log("BRIAN");
            const client = pageState.clients[i];
            const hints = client.hints.mine;
            console.log(client.hints.mine);

            for (let j = 0; j < hints.length; j++) {
              const hint = hints[j];
              const gameName = client.players.game(hint.receiving_player);
              const findingPlayerGame = client.players.game(
                hint.finding_player,
              );

              parsedHints.push({
                receiving_player: client.players.name(hint.receiving_player),
                finding_player: client.players.name(hint.finding_player),
                item: client.items.name(gameName, hint.item),
                location: client.locations.name(
                  findingPlayerGame,
                  hint.location,
                ),
                hint: hint.found.toString(),
              });
            }
          }

          console.log(clients);
          console.log(parsedHints);
          setPageState({ type: "done", clients: clients, hints: parsedHints });
        }
        // const players = client.players.all;
        // setPageState({ type: "pick_players", players: client.players.all, server: event.nickname })

        // You are now connected and authenticated to the server. You can add more code here if need be.
      });
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  }
}

function App() {
  const [pageState, setPageState] = useReducer(pageStateReducer, {
    hide_page: false,
    connected: false,
    show_servers: localStorage.getItem("servers") === null ? false : true,
    show_add_server: true,
    servers: JSON.parse(localStorage.getItem("servers")),
  });

  let fieldDataDefault = {
    server: "archipelago.gg",
    port: "",
    playerName: "",
    nickname: "",
  };
  const [submitFieldData, setSubmitFieldData] = useState(fieldDataDefault);

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
    console.log(pageState);
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
      type: "retrieve_hints",
      servers: servers,
      server: pageState.selected_server,
    });
  };
  // const connectionInfo = {
  //   hostname: "archipelago.gg", // Replace with the actual AP server hostname.
  //   port: 62344, // Replace with the actual AP server port.
  //   game: "A Link to the Past", // Replace with the game name for this player.
  //   name: "SetoALTTP", // Replace with the player slot name.
  //   items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
  // };

  let page;

  if (pageState.hide_page) {
    page = <div></div>;
  } else {
    if (!pageState.connected) {
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
    } else {
      if (pageState.show_players) {
        page = (
          <Container fluid>
            <CheckBox
              id="players"
              value={pageState}
              valueSetter={setPageState}
            />
            <Button color="primary" onClick={() => selectPlayers()}>
              Submit
            </Button>
          </Container>
        );
      } else if (pageState.retrieve_hints) {
        getAllHints(pageState, setPageState);
        page = <Container fluid></Container>;
      } else if (pageState.done) {
        let renderList = [];
        console.log(pageState);
        for (let i = 0; i < pageState.clients.length; i++) {
          console.log(i);
          const client = pageState.clients[i];
          const hints = client.hints.mine;
          for (let j = 0; j < hints.length; j++) {
            const hint = hints[j];
            const gameName = client.players.game(hint.receiving_player);
            const findingPlayerGame = client.players.game(hint.finding_player);

            renderList.push(
              <tr key={j}>
                <td>{client.players.name(hint.receiving_player)}</td>
                <td>{client.players.name(hint.finding_player)}</td>
                <td>{client.items.name(gameName, hint.item)}</td>
                <td>
                  {client.locations.name(findingPlayerGame, hint.location)}
                </td>
                <td>{hint.found.toString()}</td>
              </tr>,
            );
            console.log(client.players.name(hint.receiving_player));
          }
        }
        page = (
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
      } else {
        page = <div></div>;
      }
    }
  }
  return page;
}

export default App;
