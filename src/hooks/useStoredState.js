import { useEffect, useState } from "react";

export function useStoredState(load, eventNames) {
  const [value, setValue] = useState(load);

  useEffect(() => {
    const refresh = () => setValue(load());
    const names = [...eventNames, "storage"];

    names.forEach((name) => window.addEventListener(name, refresh));

    return () =>
      names.forEach((name) => window.removeEventListener(name, refresh));
  }, [load, eventNames]);

  return value;
}
