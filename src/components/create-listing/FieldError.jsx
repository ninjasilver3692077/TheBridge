import { fieldError } from "../../styles/ui.js";

function FieldError({ message }) {
  return message ? <p className={fieldError}>{message}</p> : null;
}

export default FieldError;
