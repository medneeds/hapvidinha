import { createContext, useContext, useState, ReactNode } from "react";

interface PrivacyContextType {
  namesHidden: boolean;
  toggleNamesHidden: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  namesHidden: false,
  toggleNamesHidden: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [namesHidden, setNamesHidden] = useState(false);

  const toggleNamesHidden = () => setNamesHidden((prev) => !prev);

  return (
    <PrivacyContext.Provider value={{ namesHidden, toggleNamesHidden }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => useContext(PrivacyContext);

export function maskName(name: string, hidden: boolean): string {
  if (!hidden || !name || name.trim() === "") return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return name;
  if (parts.length === 1) {
    return parts[0][0] + "•".repeat(Math.max(parts[0].length - 1, 2));
  }
  return (
    parts[0][0] +
    "•".repeat(Math.max(parts[0].length - 1, 2)) +
    " " +
    parts[parts.length - 1][0] +
    "•".repeat(Math.max(parts[parts.length - 1].length - 1, 2))
  );
}
