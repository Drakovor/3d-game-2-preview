# Professional Open World Pipeline Report

Unity is the integration stage only. Terrain data, mesh sculpture, procedural meshes, and PBR textures must come from the correct external tool role. On this Mac, Houdini is the active professional terrain source.

World size: 1000m x 1000m
Active terrain source: Assets/TerrainPipeline/ExternalTerrainExports/Houdini

| Tool | State | Specific job | Expected root | Details |
| --- | --- | --- | --- | --- |
| Houdini Heightfield | Ready | Mac-local procedural terrain heightfield: heightmap, slope, flow, deposit and biome masks. | `Assets/TerrainPipeline/ExternalTerrainExports/Houdini` | All required terrain outputs are present. |
| Gaea | Waiting | Optional future terrain sculpture when available off this Mac: erosion, heightmap, slope/flow/deposit/snow masks. | `Assets/TerrainPipeline/ExternalTerrainExports/Gaea` | Missing: base_height_1025.png, mask_slope.png, mask_flow.png, mask_biome_rgba.png. |
| World Creator | Waiting | Optional future terrain iteration and splat/heat maps when available. | `Assets/TerrainPipeline/ExternalTerrainExports/WorldCreator` | Missing: base_height_1025.png, mask_slope.png, mask_flow.png, mask_biome_rgba.png. |
| World Machine | Waiting | Optional future/off-Mac large-world procedural terrain builds and deterministic batch exports. | `Assets/TerrainPipeline/ExternalTerrainExports/WorldMachine` | Missing: base_height_1025.png, mask_slope.png, mask_flow.png, mask_biome_rgba.png. |
| Houdini | Ready | AAA procedural mesh chunks: cliffs, canyons, arches, cave entrances, terrain variants. | `Assets/Art/Environment/FloatingWorld/Houdini + Assets/Art/Environment/FloatingWorld/FBX` | 3 generated Houdini LOD0 FBX chunk(s), 2 HIP source file(s), and metadata found. |
| ZBrush | Waiting | High-detail sculpt pass for hero rocks, cave lips, cliff faces, and unique silhouettes. | `Assets/Art/Environment/FloatingWorld/ZBrush` | No source meshes found yet for this tool role. |
| Blender | Ready | Blockout, layout assembly, kitbash/reference modular meshes, and manual cleanup where needed. | `Tools/FantasyWorldPipeline/blender` | 73 Blender reference FBX file(s) found. These are blockout/reference meshes, not a replacement for Houdini/ZBrush/Substance passes. |
| Substance Painter | Waiting | PBR texturing for 3D hero meshes: BaseColor, Normal, MaskMap. | `Assets/Art/Environment/FloatingWorld/Materials/Textures/Substance` | No complete PBR texture set found yet. |
| ambientCG CC0 Terrain Textures | Ready | Free professional terrain PBR fallback while paid/unavailable texturing tools are missing: BaseColor, Normal, AO, Roughness, Height. | `Assets/Art/Environment/FloatingWorld/Materials/Textures/CC0Terrain` | 4 complete CC0 terrain PBR source set(s) found; Unity generates mask maps from AO/Roughness/Height. |
| Poly Haven CC0 Mesh Kit | Ready | Free professional 3D kitbash assets for cliffs, cave lips, deadwood, and ground dressing when paid asset kits are unavailable. | `Assets/Art/Environment/FloatingWorld/FBX + Assets/Art/Environment/FloatingWorld/Materials/Textures/CC03D` | 2 complete CC0 mesh asset set(s) found with FBX LODs and PBR textures. |
| Unity | Ready | Integration only: Terrain, static meshes, LODGroups, colliders, streaming cells, occlusion flags. | `Assets/Scenes` | Unity project structure is present; builder can assemble valid external exports. |

## Required Production Split

- 20% Terrain heightmap: broad ground, plains, soft valleys, vegetation paint, simple physics.
- 80% Static/procedural meshes: grounded landmark plateaus, cliffs, arches, caves, canyons, vertical silhouettes, hero rock forms.

## Unity Integration Evidence

- Manifest: `Assets/TerrainPipeline/ImportReports/unity_integration_manifest.json`
- Terrain: imported from `Assets/TerrainPipeline/ExternalTerrainExports/Houdini` at 1025 height resolution, 512 alphamap resolution, 4 terrain layers.
- Terrain PBR textures: 4 CC0 terrain source set(s) assigned to terrain layers; manifest `Assets/Art/Environment/FloatingWorld/Materials/Textures/CC0Terrain/cc0_terrain_textures_manifest.json`.
- Foliage/details: 2 detail prototype(s), 256 detail resolution, 142537 mask-painted detail instance(s).
- Cave terrain holes: 1 opening(s), 3249 hidden terrain hole pixel(s).
- Mesh streaming: 47 stream cell(s), 47 LODGroup(s), 3 Houdini chunk cell(s), 13 CC0 kitbash cell(s), 31 Blender/reference cell(s).
- Play mode view: `Player_Explorer_Controller` has a `CharacterController` and `TerrainExplorerController`; use the Game tab and Play to walk the real Unity terrain.
- Spawn readability: the rebuilt scene opens with an exploration camera looking down a grounded Blender route kit anchored to the Houdini heightmap.
- Biome dressing: forest trees/deadwood, ruin columns, canyon boulders, cave torches, crystal clusters, and snow cairns are generated in Unity and snapped to the Houdini terrain.
- Overview verification: `World_Overview_Camera` is kept for whole-map captures and does not replace the playable camera.

## Blocking Items For Final Quality

- No blocking required-tool export is missing.
