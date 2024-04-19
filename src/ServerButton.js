import React from "react";
import {
  Button,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
} from "reactstrap";

function ServerButton(props) {
  const addServer = (setPageState) => {
    setPageState({ type: "add_server", servers: props.state.servers });
  };

  // Toggles the "add server" modal off when the user clicks away
  const toggle = () => {
    props.stateSetter({ type: "server_list", servers: props.state.servers });
  };

  const handleSubmit = (event) => {
    // TODO: Add data validation
    // TODO: Check if server exists
    event.preventDefault();
    if (!isValidPort(Number(event.target.port.value))) {
      props.stateSetter({
        type: "error",
        msg: "Something is wrong with your connection info.  Please validate and try again.",
      });
    } else {
      let servers = JSON.parse(localStorage.getItem("servers"));
      servers = servers === null ? {} : servers;
      servers[event.target.nickname.value] = {
        server: event.target.server.value,
        port: event.target.port.value,
        password: event.target.password.value,
        gameName: event.target.gameName.value,
        playerName: event.target.playerName.value,
        nickname: event.target.nickname.value,
      };
      localStorage.setItem("servers", JSON.stringify(servers));
      props.stateSetter({ type: "server_list", servers: servers });
      props.submitFieldSetter(props.submitFieldDataDefault);
    }
  };

  return (
    <div className="add-server-button">
      <Modal isOpen={props.state.show_add_server} toggle={toggle}>
        <ModalHeader cssModule={{ "modal-title": "w-100 text-center" }}>
          Add a new server
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup row>
              <Label for="server" sm={3}>
                Server
              </Label>
              <Col sm={8}>
                <Input
                  id="server"
                  name="server"
                  value={props.submitFieldData.server}
                  onChange={(e) => {
                    props.submitFieldSetter({ server: e.value });
                  }}
                  type="text"
                />
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label for="port" sm={3}>
                Port
              </Label>
              <Col sm={8}>
                <Input
                  id="port"
                  name="port"
                  type="text"
                  value={props.submitFieldData.port}
                  onChange={(e) => {
                    props.submitFieldSetter({ port: e.value });
                  }}
                />
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label for="port" sm={3}>
                Password
              </Label>
              <Col sm={8}>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  value={props.submitFieldData.password}
                  onChange={(e) => {
                    props.submitFieldSetter({ password: e.value });
                  }}
                />
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label for="gameName" sm={3}>
                Game Name
              </Label>
              <Col sm={8}>
                <Input
                  id="gameName"
                  name="gameName"
                  type="text"
                  value={props.submitFieldData.gameName}
                  onChange={(e) => {
                    props.submitFieldSetter({ gameName: e.value });
                  }}
                />
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label for="playerName" sm={3}>
                Player Name
              </Label>
              <Col sm={8}>
                <Input
                  id="playerName"
                  name="playerName"
                  type="text"
                  value={props.submitFieldData.playerName}
                  onChange={(e) => {
                    props.submitFieldSetter({ playerName: e.value });
                  }}
                />
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label for="nickname" sm={3}>
                Nickname
              </Label>
              <Col sm={8}>
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={props.submitFieldData.nickname}
                  onChange={(e) => {
                    props.submitFieldSetter({ nickname: e.value });
                  }}
                />
              </Col>
            </FormGroup>
            <FormGroup row>
              <div className="modal-submit-button">
                <Button type="submit" color="primary">
                  Submit
                </Button>
              </div>
            </FormGroup>
          </Form>
        </ModalBody>
      </Modal>
      <Button color="primary" onClick={() => addServer(props.stateSetter)}>
        Add Server
      </Button>
    </div>
  );
}

function isValidPort(port) {
  // Validates that a number is a valid port.  Written by ChatGPT
  // Ensure the port is a number
  if (typeof port !== "number") {
    return false;
  }

  // Check if the port is an integer
  if (!Number.isInteger(port)) {
    return false;
  }

  // Check if the port is within the valid range (1 to 65535)
  if (port < 1 || port > 65535) {
    return false;
  }

  // If all checks pass, the port is valid
  return true;
}

export default ServerButton;
