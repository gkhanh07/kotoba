import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
// false on the server and during hydration, true afterwards: gates anything that reads browser storage or the clock.
export const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);
