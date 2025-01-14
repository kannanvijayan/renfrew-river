# Notes

Just scratch notes.

## 2025-01-13 - Dwarf Fortress Tick Details

Just for reference, it's worthwhile to compare expected performance per
tick based on an intensive game like DF.

DF fortress mode has:

  * Every tick:
    - Announcement checks
    - Consider autosave
    - Fluids and map tile information
    - Vermin movement
    - Map events such as fires
    - Projectiles moved
    - Activities (training, storytelling, etc.) updated
    - Dwarves advance immediate actions
    - Building states updated
    - Minecarts moved
    - Hauling routes advanced
  * Every 10 ticks:
    - Advance seasons
      - global weather/map updates
    - Plot element advances (diplomats, sieges)
    - Whether fort is still alive
  * Every 50 ticks, staggered:
    - taverns, temples, libraries
    - stockpiles
    - GC Items
  * Every 100 ticks
    - Check job assignments
    - Check strange moods
    - (Staggered) Check job auctions
    - Items rooted
    - Vegetation advanced
  * Every 1000 ticks
    - GC objects
    - Building use check

Normal walking speed:
  - 9 ticks per tile

Fasttest speed:
  - 1 tick per tile (perigrine falcon)
