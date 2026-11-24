import { useEffect } from "react";
import { Canvas } from "./canvas/Canvas";
import {
  LibraryPanel,
  PropertiesPanel,
  StartOverlay,
  StatusBar,
  TitleBar,
  Toolbar,
} from "./components/Chrome";
import { StoreProvider, useDispatchApp, useApp } from "./state/store";

function Shell() {
  const s = useApp();
  const dispatch = useDispatchApp();

  // release every held button when the simulation stops
  useEffect(() => {
    if (!s.running)
      for (const id of s.pressed) dispatch({ t: "release", id });
  }, [s.running, s.pressed, dispatch]);

  if (!s.started) return <StartOverlay />;
  return (
    <div className="app">
      <TitleBar />
      <Toolbar />
      <div className="body">
        <LibraryPanel />
        <Canvas />
        <PropertiesPanel />
      </div>
      <StatusBar />
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
