import React from "react";
// import "./scss/main.scss";

function CheckBox(props) {
  return (
    <fieldset>
      <div className="submission-checkbox">{renderCheckbox(props)}</div>
    </fieldset>
  );
}

function renderCheckbox(props) {
  const handleChange = (value) => {
    let selectionList = props.value[props.id];

    for (let i = 0; i < selectionList.length; i++) {
      if (selectionList[i].name === value.target.name) {
        selectionList[i].checked = value.target.checked;
      }
    }
    props.value[props.id] = selectionList;
    props.valueSetter({ ...props.value });
  };

  // Populate checkbox selection
  let renderList = [];
  const elems = props.value[props.id];

  for (let i = 0; i < elems.length; i++) {
    renderList.push(
      <div className="submission-checkbox-elem" key={elems[i].name}>
        <input
          type="checkbox"
          onChange={handleChange}
          id={elems[i].name}
          name={elems[i].name}
          checked={elems[i].checked}
        ></input>
        <label htmlFor={elems[i].name}>{elems[i].name}</label>
      </div>,
    );
  }
  return renderList;
}

export default CheckBox;
