# 3D Game 2 Preview

Static GitHub Pages preview generated from the local Houdini + Blender + Unity pipeline.

- Houdini heightfield: `Assets/TerrainPipeline/ExternalTerrainExports/Houdini/`
- Houdini procedural chunks metadata: `Assets/Art/Environment/FloatingWorld/Metadata/houdini_generated_assets.json`
- Houdini WebGL mesh preview data: `Assets/Art/Environment/FloatingWorld/Metadata/houdini_preview_meshes.json`
- CC0 terrain PBR manifest: `Assets/Art/Environment/FloatingWorld/Materials/Textures/CC0Terrain/cc0_terrain_textures_manifest.json`
- Poly Haven CC0 mesh manifest: `Assets/Art/Environment/FloatingWorld/Metadata/polyhaven_cc0_assets_manifest.json`
- Poly Haven WebGL mesh preview data: `Assets/Art/Environment/FloatingWorld/Metadata/polyhaven_preview_meshes.json`
- Unity integration report: `Assets/TerrainPipeline/ImportReports/professional_pipeline_report.md`
- Unity integration manifest: `Assets/TerrainPipeline/ImportReports/unity_integration_manifest.json`
- WebGL terrain preview: `index.html`
- Playable Unity WebGL build: `play/index.html` plus a cache-busting versioned `play-YYYYMMDD-HHMM/index.html` folder.

The `/play/` folder is a real Unity WebGL export. The rest of the site previews exported terrain data, Houdini chunk geometry, and pipeline progress.
