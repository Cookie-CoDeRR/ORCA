To ensure the ORCA dashboard performs smoothly on regional government computers while handling massive marine datasets, the frontend must aggressively offload rendering tasks to the GPU. Relying on traditional DOM-based mapping libraries will cause the browser to crash when rendering complex ocean currents, thermal fronts, and multi-agent chat streams simultaneously.

Here is the precise frontend stack designed for high-performance geospatial rendering and seamless AI integration.

### Core Framework: Next.js (React)

Next.js provides the architectural foundation for the dashboard. By utilizing Server-Side Rendering (SSR), the application delivers the initial HTML payload instantly, ensuring fast load times even on constrained rural networks. The React ecosystem makes it straightforward to build a split-pane interface: an interactive chat panel for the AI agents on one side, and the marine visualization map on the other.

### Base Map Engine: MapLibre GL JS

Instead of paid or closed-source alternatives, use MapLibre GL JS for the foundational map layer.

- **Why it works:** It is a community-governed, open-source TypeScript library that uses WebGL to render interactive maps directly in the browser.
- **Performance:** It utilizes GPU-accelerated rendering to maintain smooth 60fps frame rates while panning or zooming. This is critical when visualizing the Indian coastline and maritime boundaries.

### Geospatial Data Visualization: deck.gl

While MapLibre handles the base map, deck.gl acts as the heavy-duty data visualization layer draped over it.

- **Marine Data Handling:** deck.gl is built to handle heavy data loads using high-precision 64-bit floating-point computations directly in the GPU. This allows you to render millions of data points—such as Chlorophyll-a heatmaps, wave height polygons, and Potential Fishing Zones (PFZs)—without lagging the browser.
- **Seamless Integration:** deck.gl integrates natively with MapLibre. You can use the "interleaved" mode to mix 3D marine layers directly between MapLibre's text labels and basemap layers for a polished, unified view.

### Global State Management: Zustand

Your frontend needs to constantly sync the LangGraph AI state with the map viewport. When the Ocean Analytics agent finds a PFZ, the map must automatically fly to those coordinates.

- **Why it works:** Zustand is an ultra-lightweight, unopinionated state manager. It avoids the heavy boilerplate and performance overhead of Redux, providing a fast, direct bridge between the chat component (user inputs, agent JSON payloads) and the deck.gl map instance.

### UI Components: Tailwind CSS + Shadcn/ui

For the actual dashboard interface (menus, chat bubbles, alert panels, and layer toggles), Tailwind CSS paired with Shadcn/ui offers the fastest development velocity. Shadcn provides accessible, unstyled components that you own and can easily customize to match official government design guidelines.

---

### Architectural Comparison

| Feature           | Traditional Hackathon Stack                   | The ORCA High-Performance Stack                  |
| ----------------- | --------------------------------------------- | ------------------------------------------------ |
| **Map Rendering** | Leaflet (CPU-bound, DOM elements)             | MapLibre GL JS (WebGL GPU-accelerated)           |
| **Data Overlay**  | Basic GeoJSON overlays                        | deck.gl (64-bit GPU precision layers)            |
| **Data Delivery** | Loading raw GeoTIFFs directly in browser      | TiTiler (Serves lightweight vector/raster tiles) |
| **State Sync**    | React Context (Causes unnecessary re-renders) | Zustand (Targeted, high-speed state updates)     |

By implementing this stack, the LangGraph agents running securely on your backend will output lightweight JSON coordinates, which deck.gl and MapLibre instantly translate into fluid, interactive marine visualizations on the client's machine.
