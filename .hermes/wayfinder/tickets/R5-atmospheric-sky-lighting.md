## Question

How to set up the atmospheric sky and lighting to match the reference? Key elements:
- Deep dusk/night sky with gradient (dark blue at top, warm glow at horizon)
- Aurora/nebula-like glow bands in the sky
- Soft directional lighting from above with warm tint
- Ambient light with slight blue/purple tint
- Volumetric-style fog with lower density near ground
- Glowing horizon ring at city edge

## Type

prototype

## Blocked by

R3-neon-signage, R4-distant-skyline

## Blocks

(none — final polish pass)

## Resolution

Sky and atmosphere updated to match the reference:
- Custom shader sky: dark blue top → midnight mid → warm horizon
- Aurora band near horizon (glowColor, Gaussian falloff)
- Star speckle via hash function (0.3 intensity)
- Horizon glow ring (90-93 unit radius, faint emissive)
- City ground glow ring (10-60 unit radius under buildings)
- Fog reduced density (0.006 vs previous 0.008) for better visibility