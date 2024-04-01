import React from "react";

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

  let className = props.paddingBottom
    ? "dropdown-filter dropdown-filter-last"
    : "dropdown-filter";

  return (
    <React.Fragment>
      <div key={props.id} className={className}>
        {props.title}
        <select
          className="dropdown"
          id={props.id}
          name={props.name}
          onChange={handleChange}
          value={defaultValue}
        >
          {dropdown}
        </select>
      </div>
    </React.Fragment>
  );
}

export default Dropdown;
