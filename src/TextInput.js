import React from "react";

function TextInput(props) {
  const handleChange = (value) => {
    props.value[props.id] = value.target.value;
    props.valueSetter({ ...props.value });
  };

  return (
    <input
      className="input"
      onChange={handleChange}
      value={props.value[props.id]}
      name={props.id}
      type="text"
      placeholder={props.placeholder}
    />
  );
}

export default TextInput;
