"use client";

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export function Whiteboard() {
  return (
    <div className="h-full w-full">
      <Tldraw persistenceKey="learnspace-demo-board" />
    </div>
  );
}
