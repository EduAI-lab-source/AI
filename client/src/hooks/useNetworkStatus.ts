import { useEffect, useState } from "react";

type NavigatorLike = { onLine?: boolean };

export function getNetworkStatus(navigatorLike?: NavigatorLike) {
  return navigatorLike?.onLine !== false;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => getNetworkStatus(typeof navigator === "undefined" ? undefined : navigator));

  useEffect(() => {
    const updateOnline = () => setIsOnline(true);
    const updateOffline = () => setIsOnline(false);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOffline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOffline);
    };
  }, []);

  return isOnline;
}
