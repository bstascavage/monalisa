import React from "react";
import { DataGrid } from "@mui/x-data-grid";

function CheckBox(props) {
  let columns = [
    {
      field: "player",
      headerName: "Player",
      width: 400,
    },
    {
      field: "game",
      headerName: "Game",
      width: 400,
    },
  ];

  const rows = renderCheckbox(props);
  return (
    <div style={{ height: "auto", width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 15 },
          },
        }}
        pageSizeOptions={[15, 25, 50, 100]}
        checkboxSelection
        onRowSelectionModelChange={(value) => {
          let players = [];

          for (let i = 0; i < value.length; i++) {
            players.push(rows[value[i] - 1]);
          }

          props.value["players"] = players;
          props.valueSetter({ ...props.value });
        }}
      />
    </div>
  );
}

function renderCheckbox(props) {
  // Populate checkbox selection
  let renderList = [];
  const elems = props.value[props.id];

  for (let i = 0; i < elems.length; i++) {
    if (elems[i].name !== "Archipelago") {
      renderList.push({
        id: i,
        player: elems[i].name,
        game: elems[i].game,
      });
    }
  }

  return renderList;
}

export default CheckBox;
