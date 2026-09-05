## Question

How to restructure the city into elevation tiers? Reference shows the city on layered terrain with distinct districts at different heights. Player should start on an elevated overlook (like the foreground character in the reference) looking down at the city.

Requirements:
- 3-4 elevation tiers (high overlook, upper mid, lower mid, distant basin)
- Elevated starting platform/overlook at z=-30 to z=-20, y=2
- Step-down transitions between tiers via ramps or stairs
- Lower terrain for the dense city core and distant skyline

## Type

prototype

## Blocked by

R1-central-landmark-tower

## Blocks

R3-neon-signage, R4-distinct-districts

## Resolution

City restructured into 4 elevation tiers matching the reference:
- **Tier 1 (y=2.0)**: High overlook at z=-30 to z=-20 — player spawn point with railing, looking down at the city
- **Tier 2 (y=1.0)**: Upper mid at z=-18 to z=-5 — sparse low buildings
- **Tier 3 (y=0.0)**: City core at z=-4 to z=20 — dense mid-height buildings, central tower
- **Tier 4 (y=-0.5)**: Distant basin at z=20 to z=45 — taller buildings + skyline towers
- 4-step stair transitions between overlook and upper mid tier
- Building density/heights increase toward the core and basin