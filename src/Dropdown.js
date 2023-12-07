import React from "react";
import { Row } from "reactstrap";
// import "./scss/main.scss";

function Dropdown(props) {
  const handleChange = (value) => {
    let selectedState = { ...props.value };
    for (let i = 0; i < selectedState[props.id].length; i++) {
      selectedState[props.id][i].name === value.target.value
        ? (selectedState[props.id][i].checked = true)
        : (selectedState[props.id][i].checked = false);
    }

    props.valueSetter({ ...props.value, selectedState });
  };

  let dropdown = [];
  const elems = props.value[props.id];
  let defaultValue = "";

  for (let i = 0; i < elems.length; i++) {
    if (elems[i].checked === true) {
      defaultValue = elems[i].name;
    }
    dropdown.push(
      <option value={elems[i].name} key={elems[i].name}>
        {elems[i].name}
      </option>,
    );
  }

  return (
    <React.Fragment>
      <Row className="pt-4 pb-4 stats-row">{props.title}</Row>
      <Row className="pt-4 pb-4 stats-row">
        <select
          className="input"
          id={props.id}
          name={props.name}
          onChange={handleChange}
          value={defaultValue}
        >
          {dropdown}
        </select>
      </Row>
    </React.Fragment>
  );
}

export default Dropdown;
