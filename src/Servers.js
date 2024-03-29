import React from "react";
import {
  Button,
  Card,
  CardBody,
  CardText,
  CardTitle,
  CloseButton,
  Container,
} from "reactstrap";

import { ITEMS_HANDLING_FLAGS } from "archipelago.js";

function Servers(props) {
  return (
    <Container fluid>
      <div className="server-list-header">Servers</div>
      <React.Fragment>{renderServerCards(props)}</React.Fragment>
    </Container>
  );
}

function renderServerCards(props) {
  let pageState = props.state;
  let setPageState = props.stateSetter;

  const connectServer = (event, setPageState) => {
    const connectionInfo = {
      hostname: event.server,
      port: Number(event.port),
      protocol: "wss",
      game: event.gameName,
      name: event.playerName,
      items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
      version: {
        build: 0,
        major: 4,
        minor: 4,
      },
    };

    try {
      setPageState({ type: "connecting" });
      props.initialClient
        .connect(connectionInfo)
        .then(() => {
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
              players: props.initialClient.players.all,
              server: event.nickname,
            });
          }
        })
        .catch((error) => {
          console.error("Failed to connect:", error);
          setPageState({
            type: "error",
            msg: "There is an issue connecting to the server.  Please check your connection info and try again",
          });
        });
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  let cardList = [];

  const deleteServer = (event) => {
    delete pageState.servers[event.nickname];
    localStorage.setItem("servers", JSON.stringify(pageState.servers));
    setPageState({ type: "server_list", servers: pageState.servers });
  };

  for (const [key, value] of Object.entries(pageState.servers)) {
    cardList.push(
      <Card
        style={{
          width: "18rem",
        }}
        id={key}
        key={key}
      >
        <CardBody>
          <CardTitle tag="h5" className="text-uppercase mb-0">
            <div className="card-header-flex">
              <div style={{ fontSize: "24px" }}>{key}</div>
              <CloseButton
                style={{ height: "7px", width: "7px" }}
                onClick={() => deleteServer(value)}
              />
            </div>
          </CardTitle>
          <CardText>
            Server: {value.server}
            <br></br>
            Port: {value.port}
          </CardText>
          <div className="card-connect-button">
            <Button
              color="primary"
              onClick={() => connectServer(value, setPageState)}
            >
              Connect
            </Button>
          </div>
        </CardBody>
      </Card>,
    );
  }

  return <div className="server-list">{cardList}</div>;
}

export default Servers;
