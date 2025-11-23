# RTS Arena - Ability Controls

## How to Use Combat Abilities

### Prerequisites
1. Launch the game at http://localhost:3002/
2. Select units by clicking on them or box-selecting (click and drag)
3. Only blue team units (Team 0) can be selected and controlled

### Ability Keys

| Key | Ability | Effect | Cooldown |
|-----|---------|--------|----------|
| **Q** | Dash | Units dash forward instantly, dealing 30 damage to enemies in their path | 10 seconds |
| **W** | Shield | Activates a protective shield for 50% damage reduction | 15 seconds |
| **E** | Ranged Attack | Fires a projectile dealing 40 damage | 8 seconds |

### Visual Effects

- **Dash (Q)**: Yellow speed lines trail behind dashing units
- **Shield (W)**: Blue energy bubble with orbiting particles
- **Ranged Attack (E)**: Orange projectile with fire trail

### Testing Steps

1. **Test Dash (Q)**
   - Select one or more blue units
   - Press Q
   - Units should dash forward with yellow speed lines
   - Console will log "Unit X dashing!"
   - Try pressing Q again - should see cooldown message

2. **Test Shield (W)**
   - Select one or more blue units
   - Press W
   - Blue shield bubble should appear around units
   - Shield lasts for 3 seconds
   - Console will log "Unit X shielding!"

3. **Test Ranged Attack (E)**
   - Select one or more blue units
   - Press E
   - Orange projectile should fire in the unit's movement direction
   - Projectile travels for 2 seconds or until it hits an enemy
   - Console will log "Unit X firing ranged attack!"

### Debug Information

Open browser console (F12) to see:
- Ability activation messages
- Cooldown remaining messages
- Entity IDs performing abilities

### Known Limitations

- Abilities currently fire in the unit's movement direction
- Mouse targeting not yet implemented (Agent 5 will handle this)
- Damage reduction from Shield not yet integrated with combat system (Agent 1 responsibility)
- Units must have velocity component for dash to work properly

### Performance

The ability systems are optimized to:
- Handle 50+ units using abilities simultaneously
- Maintain 60 FPS with all visual effects active
- Use efficient ECS queries and component updates