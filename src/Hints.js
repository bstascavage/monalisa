import React from "react";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

function Hints(props) {
  let rows = renderHints(
    props.state,
    props.hintData,
    props.filterData,
    props.receivingPlayerFilter,
    props.findingPlayerFilter,
  );

  // Only shows the `entrance` column if "Show Entrances" dropdown is selected
  let showEntrance = false;
  for (let i = 0; i < props.filterData.entranceFilter.length; i++) {
    if (
      props.filterData.entranceFilter[i].name === "Yes" &&
      props.filterData.entranceFilter[i].checked === true
    ) {
      showEntrance = props.filterData.entranceFilter[i].checked;
    }
  }

  const renderEntranceHeader = () => {
    return showEntrance === true ? (
      <TableCell align="left">Entrance</TableCell>
    ) : (
      <div></div>
    );
  };
  const renderEntranceBody = (row) => {
    return showEntrance === true ? (
      <TableCell align="left">{row.entrance}</TableCell>
    ) : (
      <div></div>
    );
  };

  return (
    <TableContainer component={Paper}>
      <Table stickyHeader sx={{ minWidth: 650 }} aria-label="sticky table">
        <TableHead>
          <TableRow>
            <TableCell>
              <b>Receiving Player</b>
            </TableCell>
            <TableCell align="left">
              <b>Finding Player</b>
            </TableCell>
            <TableCell align="left">
              <b>Item</b>
            </TableCell>
            <TableCell align="left">
              <b>Location</b>
            </TableCell>
            {renderEntranceHeader()}
            <TableCell align="left">
              <b>Status</b>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              hover
              key={row.findingPlayerName + row.locationName}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.playerName}
              </TableCell>
              <TableCell align="left">{row.findingPlayerName}</TableCell>
              <TableCell align="left">{row.itemName}</TableCell>
              <TableCell align="left">{row.locationName}</TableCell>
              {renderEntranceBody(row)}
              <TableCell align="left">{row.isFound}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function renderHints(
  pageState,
  hintData,
  filterData,
  receivingPlayerFilter,
  findingPlayerFilter,
) {
  let renderList = [];
  let hintFilterSelection = "";
  let foundFilterSelection = "";
  let receivingPlayerFilterSelection = "";
  let findingPlayerFilterSelection = "";

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

  for (let i = 0; i < receivingPlayerFilter.playerList.length; i++) {
    if (receivingPlayerFilter.playerList[i].checked === true) {
      receivingPlayerFilterSelection = receivingPlayerFilter.playerList[i].name;
    }
  }

  for (let i = 0; i < findingPlayerFilter.playerList.length; i++) {
    if (findingPlayerFilter.playerList[i].checked === true) {
      findingPlayerFilterSelection = findingPlayerFilter.playerList[i].name;
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

    render = {
      playerName: hint.playerName,
      findingPlayerName: hint.findingPlayerName,
      itemName: hint.itemName,
      locationName: hint.locationName,
      isFound: hint.isFound,
      entrance: hint.entrance,
    };

    for (let j = 0; j < pageState.clients.length; j++) {
      if (
        ((hintFilterSelection === "My Hints" &&
          hint.playerName === pageState.clients[j].player) ||
          (hintFilterSelection === "Assigned Hints" &&
            hint.findingPlayerName === pageState.clients[j].player) ||
          hintFilterSelection === "All") &&
        (foundFilterSelection === "All" ||
          (foundFilterSelection === "Found" && hint.foundBool === "true") ||
          (foundFilterSelection === "Not Found" &&
            hint.foundBool === "false")) &&
        (receivingPlayerFilterSelection === "All" ||
          receivingPlayerFilterSelection === hint.playerName) &&
        (findingPlayerFilterSelection === "All" ||
          findingPlayerFilterSelection === hint.findingPlayerName)
      ) {
        renderList.push(render);
        break;
      }
    }
  }

  return renderList;
}

export class HintData {
  constructor(
    state,
    hintSetter,
    receivingPlayerFilterSetter,
    findingPlayerFilterSetter,
  ) {
    this.state = state;
    this.hintSetter = hintSetter;
    this.receivingPlayerFilterSetter = receivingPlayerFilterSetter;
    this.findingPlayerFilterSetter = findingPlayerFilterSetter;
  }

  dynamicFilter() {
    // Creates a filter for each game, which is not static
    let receivingPlayerList = [{ name: "All", checked: true }];
    let findingPlayerList = [{ name: "All", checked: true }];
    let findingPlayers = new Set([]);

    for (
      let game_index = 0;
      game_index < this.state.clients.length;
      game_index++
    ) {
      receivingPlayerList.push({
        name: this.state.clients[game_index].player,
        checked: false,
      });

      let hints = this.state.clients[game_index].client.hints.mine;
      for (let hint_index = 0; hint_index < hints.length; hint_index++) {
        // Gets the player id and looks up the player name
        // Adds it to a set in order to deal with duplicates
        findingPlayers.add(
          this.state.clients[game_index].client.players.name(
            hints[hint_index].finding_player,
          ),
        );
      }
    }

    for (const value of findingPlayers) {
      findingPlayerList.push({
        name: value,
        checked: false,
      });
    }

    this.receivingPlayerFilterSetter({ playerList: receivingPlayerList });
    this.findingPlayerFilterSetter({ playerList: findingPlayerList });
  }

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
          hint.entrance,
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
    entrance,
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
    hint.entrance = entrance;

    // Parsing hint data for more readable fields
    hint.playerName = client.players.name(receiving_player);
    hint.findingPlayerName = client.players.name(finding_player);
    hint.itemName = client.items.name(gameName, item_id);
    hint.locationName = client.locations.name(findingPlayerName, location_id);
    hint.foundBool = found.toString();
    hint.isFound = found === true ? "Found" : "Not Found";

    return hint;
  }
}

export default Hints;
