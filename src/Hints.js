import React from "react";
import { Container } from "reactstrap";

function Hints(props) {
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
      <tbody>
        {renderHints(
          props.state,
          props.hintData,
          props.filterData,
          props.playerFilter,
        )}
      </tbody>
    </Container>
  );
}

function renderHints(pageState, hintData, filterData, playerFilter) {
  let renderList = [];
  let hintFilterSelection = "";
  let foundFilterSelection = "";
  let playerFilterSelection = "";

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

  for (let i = 0; i < playerFilter.playerList.length; i++) {
    if (playerFilter.playerList[i].checked === true) {
      playerFilterSelection = playerFilter.playerList[i].name;
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

    for (let j = 0; j < pageState.clients.length; j++) {
      if (
        ((hintFilterSelection === "My Hints" &&
          hint.playerName === pageState.clients[j].player) ||
          (hintFilterSelection === "Assigned Hints" &&
            hint.findingPlayerName === pageState.clients[j].player) ||
          hintFilterSelection === "All") &&
        (foundFilterSelection === "All" ||
          (foundFilterSelection === "Found" && hint.isFound === "true") ||
          (foundFilterSelection === "Not Found" && hint.isFound === "false")) &&
        (playerFilterSelection === "All" ||
          playerFilterSelection === hint.playerName)
      ) {
        renderList.push(render);
        break;
      }
    }
  }

  return renderList;
}

export class HintData {
  constructor(state, hintSetter, playerFilterSetter) {
    this.state = state;
    this.hintSetter = hintSetter;
    this.playerFilterSetter = playerFilterSetter;
  }

  dynamicFilter() {
    // Creates a filter for each game, which is not static
    let playerList = [{ name: "All", checked: true }];

    for (
      let game_index = 0;
      game_index < this.state.clients.length;
      game_index++
    ) {
      playerList.push({
        name: this.state.clients[game_index].player,
        checked: false,
      });
    }

    this.playerFilterSetter({ playerList: playerList });
  }

  // retrieveHints(pageState, setHintData, serverUpdateEvent = undefined) {
  retrieveHints(serverUpdateEvent = undefined) {
    // Loops through all clients and retrieves all hints for each game
    let hintList = [];

    for (
      let game_index = 0;
      game_index < this.state.clients.length;
      game_index++
    ) {
      const client = this.state.clients[game_index].client;
      const hints = client.hints.mine;

      for (let hint_index = 0; hint_index < hints.length; hint_index++) {
        let hint = hints[hint_index];

        //  If `retrieveHints` is called because of an `ItemSend` server event, that means the hint has been found
        //  I have to do this because the Archipelago hint list only updates when you create a new client or a new hint is issued
        //  It is not updated if a hint's status changes from 'not found' to 'found'...for some reason
        if (typeof serverUpdateEvent != "undefined") {
          if (
            serverUpdateEvent.type === "ItemSend" &&
            hint.item === serverUpdateEvent.item.item &&
            hint.location === serverUpdateEvent.item.location &&
            hint.finding_player === serverUpdateEvent.item.player &&
            hint.receiving_player === serverUpdateEvent.receiving
          ) {
            hint.found = true;
          }
        }

        let parsedHint = this.retrieveHintMetadata(
          client,
          hint.receiving_player,
          hint.finding_player,
          hint.item,
          hint.item_flags,
          hint.location,
          hint.found,
        );

        //  Do not add if it already exists
        let isDuplicate = false;
        for (let i = 0; i < hintList.length; i++) {
          if (
            hintList[i].location === parsedHint.location &&
            hintList[i].item === parsedHint.item &&
            hintList[i].receiving_player === parsedHint.receiving_player &&
            hintList[i].finding_player === parsedHint.finding_player
          ) {
            isDuplicate = true;
            hintList[i] = parsedHint;
            break;
          }
        }

        if (!isDuplicate) {
          hintList.push(parsedHint);
        }
      }
    }

    this.hintSetter(hintList);
  }

  retrieveHintMetadata(
    client,
    receiving_player,
    finding_player,
    item_id,
    item_flags,
    location_id,
    found,
  ) {
    // Looks up human-readable metadata for hints, since Archipelago only returns player/item/location ids
    let hint = {};
    const gameName = client.players.game(receiving_player);
    const findingPlayerName = client.players.game(finding_player);

    // Static values that might be used in the future
    hint.Class = "Hint";
    hint.entrance = "";

    // Perserving original, non-parsed hint data from the server
    hint.finding_player = finding_player;
    hint.receiving_player = receiving_player;
    hint.item = item_id;
    hint.item_flags = item_flags;
    hint.location = location_id;
    hint.found = found;

    // Parsing hint data for more readable fields
    hint.playerName = client.players.name(receiving_player);
    hint.findingPlayerName = client.players.name(finding_player);
    hint.itemName = client.items.name(gameName, item_id);
    hint.locationName = client.locations.name(findingPlayerName, location_id);
    hint.isFound = found.toString();

    return hint;
  }
}

export default Hints;
